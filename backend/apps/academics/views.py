from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from apps.academics.models import GatePaper, Subject, Topic, TopicProgress
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
    Returns the list of subjects for a GATE paper (defaults to CS).
    """
    paper_code = request.GET.get("paper", "CS").upper()
    subjects = Subject.objects.filter(paper__code=paper_code).prefetch_related("topics")
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)


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
