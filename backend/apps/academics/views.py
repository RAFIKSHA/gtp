from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import models
from apps.academics.models import GatePaper, Branch, BranchGatePaper, Subject, Topic, TopicProgress
from apps.academics.serializers import GatePaperSerializer, SubjectSerializer, TopicSerializer
from apps.students.views import _get_current_student_profile


@api_view(["GET"])
@permission_classes([AllowAny])
def gate_papers_list(request):
    """
    Returns all active GATE examination papers with their allowed secondary combinations.
    """
    papers = GatePaper.objects.filter(is_active=True).prefetch_related("allowed_secondary_papers")
    serializer = GatePaperSerializer(papers, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def subject_list(request):
    """
    Returns subjects for student LMS.
    Supports filtering by ?branch=<code_or_uuid> and/or ?paper=<paper_code>.
    Falls back gracefully to GATE CS subjects if no parameters provided.
    """
    branch_param = request.GET.get("branch")
    paper_code = request.GET.get("paper")

    subjects = Subject.objects.filter(is_active=True, is_published=True).prefetch_related("topics").order_by("order_index")

    if branch_param:
        if len(branch_param) == 36 and "-" in branch_param:
            subjects = subjects.filter(branch_id=branch_param)
        else:
            subjects = subjects.filter(branch__code__iexact=branch_param)
    elif paper_code:
        paper_code_upper = paper_code.upper()
        subjects = subjects.filter(
            models.Q(paper__code=paper_code_upper) |
            models.Q(branch__paper_mappings__gate_paper__code=paper_code_upper, branch__paper_mappings__is_active=True)
        ).distinct()
    else:
        # Default fallback to CS
        subjects = subjects.filter(
            models.Q(paper__code="CS") | models.Q(branch__code="CSE")
        ).distinct()

    # Calculate student completion state
    student_profile = _get_current_student_profile(request)
    request.student_profile = student_profile

    serializer = SubjectSerializer(subjects, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def learning_branches_list(request):
    """
    Returns active academic branches eligible for student selection.
    If ?paper_code=<code> is provided, returns branches mapped to that GATE paper
    with 'is_primary' indication.
    """
    paper_code = request.GET.get("paper_code")
    if paper_code:
        mappings = BranchGatePaper.objects.filter(
            gate_paper__code=paper_code.upper(),
            is_active=True,
            branch__is_active=True,
            branch__is_published=True
        ).select_related("branch", "gate_paper").order_by("-is_primary", "branch__display_order")

        data = [
            {
                "id": str(m.branch.id),
                "name": m.branch.name,
                "code": m.branch.code,
                "slug": m.branch.slug,
                "description": m.branch.description,
                "icon_name": m.branch.icon_name,
                "is_primary": m.is_primary,
                "subjects_count": m.branch.subjects.filter(is_active=True, is_published=True).count(),
                "gate_paper_code": m.gate_paper.code,
                "gate_paper_name": m.gate_paper.name,
            }
            for m in mappings
        ]
        return Response(data, status=status.HTTP_200_OK)

    # Return all published branches
    branches = Branch.objects.filter(is_active=True, is_published=True).order_by("display_order")
    data = [
        {
            "id": str(b.id),
            "name": b.name,
            "code": b.code,
            "slug": b.slug,
            "description": b.description,
            "icon_name": b.icon_name,
            "is_primary": True,
            "subjects_count": b.subjects.filter(is_active=True, is_published=True).count(),
            "gate_paper_code": b.gate_paper.code if b.gate_paper else None,
            "gate_paper_name": b.gate_paper.name if b.gate_paper else None,
        }
        for b in branches
    ]
    return Response(data, status=status.HTTP_200_OK)



@api_view(["GET"])
@permission_classes([AllowAny])
def subject_detail(request, slug):
    """
    Returns detailed subject information, including all syllabus topics and concept notes.
    """
    try:
        subject = Subject.objects.prefetch_related("topics").get(slug=slug)
    except Subject.DoesNotExist:
        return Response(
            {"error": f"Subject with slug '{slug}' not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Attach student profile to request for completion state calculation
    student_profile = _get_current_student_profile(request)
    request.student_profile = student_profile

    serializer = SubjectSerializer(subject, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def toggle_topic_completion(request, topic_id):
    """
    Toggles completion status for a student on a specific topic.
    """
    student_profile = _get_current_student_profile(request)
    try:
        topic = Topic.objects.get(id=topic_id)
    except Topic.DoesNotExist:
        return Response(
            {"error": f"Topic with id '{topic_id}' not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    progress, created = TopicProgress.objects.get_or_create(
        student=student_profile,
        topic=topic
    )

    # Toggle
    progress.is_completed = not progress.is_completed
    progress.completed_at = timezone.now() if progress.is_completed else None
    progress.save()

    return Response({
        "success": True,
        "topic_id": topic.id,
        "topic_name": topic.name,
        "is_completed": progress.is_completed,
    })
