from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.administration.permissions import IsAdminRole
from apps.administration.serializers import (
    AdminBranchSerializer,
    AdminGatePaperSerializer,
    BranchGatePaperSerializer,
    AdminSubjectSerializer,
    AdminTopicSerializer,
    AdminQuestionSerializer,
    AdminMockTestSerializer,
    AdminStudentSerializer,
)
from apps.academics.models import Branch, BranchGatePaper, Subject, Topic, GatePaper
from apps.questions.models import Question, StudentAttempt
from apps.mock_tests.models import MockTest, MockTestQuestion, MockTestAttempt
from apps.students.models import StudentProfile


# -----------------------------------------------------------------------------
# 1. PLATFORM OVERVIEW TELEMETRY
# -----------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_overview(request):
    """
    Returns authentic platform-wide operational statistics from Supabase.
    Zero fabricated or randomized metrics.
    """
    total_students = StudentProfile.objects.count()
    active_students = StudentProfile.objects.filter(attempts__isnull=False).distinct().count()
    total_branches = Branch.objects.count()
    total_subjects = Subject.objects.count()
    total_topics = Topic.objects.count()
    total_questions = Question.objects.count()
    total_pyqs = Question.objects.filter(is_pyq=True).count()
    published_tests = MockTest.objects.filter(is_published=True).count()
    total_test_attempts = MockTestAttempt.objects.count()

    # Recent student activity log
    recent_attempts = StudentAttempt.objects.select_related("student", "question__topic__subject").order_by("-attempted_at")[:8]
    activity_log = [
        {
            "id": str(att.id),
            "student_name": att.student.full_name,
            "subject_name": att.question.topic.subject.name,
            "question_type": att.question.question_type,
            "is_correct": att.is_correct,
            "marks_awarded": att.marks_awarded,
            "timestamp": att.attempted_at.isoformat(),
        }
        for att in recent_attempts
    ]

    return Response({
        "metrics": {
            "total_students": total_students,
            "active_students": active_students,
            "total_branches": total_branches,
            "total_subjects": total_subjects,
            "total_topics": total_topics,
            "total_questions": total_questions,
            "total_pyqs": total_pyqs,
            "published_tests": published_tests,
            "total_test_attempts": total_test_attempts,
        },
        "recent_activity": activity_log,
    }, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# 1B. BRANCHES CRUD (Stage 2)
# -----------------------------------------------------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_branches_list_create(request):
    """
    List all academic branches or register a new engineering branch.
    """
    if request.method == "GET":
        branches = Branch.objects.all().order_by("display_order", "name")
        serializer = AdminBranchSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = AdminBranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminRole])
def admin_branch_detail(request, branch_id):
    """
    Retrieve, update or safely delete an academic branch.
    """
    branch = get_object_or_404(Branch, id=branch_id)

    if request.method == "GET":
        return Response(AdminBranchSerializer(branch).data)

    elif request.method == "PUT":
        serializer = AdminBranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Dependency Check: prevent accidental deletion if active subjects exist
        subject_count = branch.subjects.count()
        if subject_count > 0:
            return Response(
                {
                    "error": f"Cannot delete branch '{branch.name}'. It contains {subject_count} linked subjects. Please reassign or delete these subjects first, or deactivate/unpublish the branch instead."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        branch_name = branch.name
        branch.delete()
        return Response(
            {"message": f"Branch '{branch_name}' deleted successfully."},
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_branch_toggle_status(request, branch_id):
    """
    One-click status toggle for active or published state.
    """
    branch = get_object_or_404(Branch, id=branch_id)
    field = request.data.get("field")
    if field == "is_active":
        branch.is_active = not branch.is_active
        branch.save(update_fields=["is_active", "updated_at"])
    elif field == "is_published":
        branch.is_published = not branch.is_published
        branch.save(update_fields=["is_published", "updated_at"])
    else:
        return Response(
            {"error": "Invalid field. Must be 'is_active' or 'is_published'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(AdminBranchSerializer(branch).data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# 1C. GATE PAPERS & BRANCH-GATE MAPPINGS (Stage 2)
# -----------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_gate_papers_list(request):
    """
    List all official GATE papers along with their connected academic branches.
    """
    papers = GatePaper.objects.all().order_by("code")
    serializer = AdminGatePaperSerializer(papers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_branch_gate_mappings_list_create(request):
    """
    List or create branch to GATE paper mappings.
    Filterable by ?branch_id=<uuid> or ?paper_code=<code>.
    """
    if request.method == "GET":
        qs = BranchGatePaper.objects.select_related("branch", "gate_paper").all()
        branch_id = request.GET.get("branch_id")
        paper_code = request.GET.get("paper_code")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if paper_code:
            qs = qs.filter(gate_paper_id=paper_code)

        serializer = BranchGatePaperSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        branch_id = request.data.get("branch")
        paper_code = request.data.get("gate_paper")

        if not branch_id or not paper_code:
            return Response(
                {"error": "Both branch ID and gate_paper code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check existing mapping to avoid duplicates
        existing = BranchGatePaper.objects.filter(branch_id=branch_id, gate_paper_id=paper_code).first()
        if existing:
            return Response(
                {"error": f"Branch is already mapped to GATE paper {paper_code}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BranchGatePaperSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE", "PATCH"])
@permission_classes([IsAdminRole])
def admin_branch_gate_mapping_detail(request, mapping_id):
    """
    Delete or update a specific branch-paper mapping.
    """
    mapping = get_object_or_404(BranchGatePaper, id=mapping_id)

    if request.method == "DELETE":
        branch_name = mapping.branch.name
        paper_code = mapping.gate_paper.code
        mapping.delete()
        return Response(
            {"message": f"Mapping between '{branch_name}' and GATE {paper_code} removed successfully."},
            status=status.HTTP_200_OK,
        )

    elif request.method == "PATCH":
        serializer = BranchGatePaperSerializer(mapping, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_branch_gate_mapping_toggle_primary(request, mapping_id):
    mapping = get_object_or_404(BranchGatePaper, id=mapping_id)
    mapping.is_primary = not mapping.is_primary
    mapping.save(update_fields=["is_primary"])
    return Response(BranchGatePaperSerializer(mapping).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_branch_gate_mapping_toggle_active(request, mapping_id):
    mapping = get_object_or_404(BranchGatePaper, id=mapping_id)
    mapping.is_active = not mapping.is_active
    mapping.save(update_fields=["is_active"])
    return Response(BranchGatePaperSerializer(mapping).data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# 2. SUBJECTS CRUD (Stage 3 - Branch Scoped)
# -----------------------------------------------------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_subjects_list_create(request):
    """
    List or add subjects.
    Supports filtering by ?branch_id=<uuid> or ?paper_code=<code>.
    """
    if request.method == "GET":
        subjects = Subject.objects.select_related("branch", "paper").all().order_by("order_index")
        branch_id = request.GET.get("branch_id")
        paper_code = request.GET.get("paper_code")
        if branch_id:
            subjects = subjects.filter(branch_id=branch_id)
        if paper_code:
            subjects = subjects.filter(paper__code=paper_code)

        serializer = AdminSubjectSerializer(subjects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = AdminSubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminRole])
def admin_subject_detail(request, subject_id):
    subject = get_object_or_404(Subject, id=subject_id)

    if request.method == "GET":
        return Response(AdminSubjectSerializer(subject).data)

    elif request.method == "PUT":
        serializer = AdminSubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        subject.delete()
        return Response({"message": "Subject deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------------------------------------
# 3. TOPICS CRUD
# -----------------------------------------------------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_topics_list_create(request):
    if request.method == "GET":
        subject_id = request.GET.get("subject_id")
        queryset = Topic.objects.all().select_related("subject")
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        serializer = AdminTopicSerializer(queryset.order_by("order_index"), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = AdminTopicSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminRole])
def admin_topic_detail(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)

    if request.method == "GET":
        return Response(AdminTopicSerializer(topic).data)

    elif request.method == "PUT":
        serializer = AdminTopicSerializer(topic, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        topic.delete()
        return Response({"message": "Topic deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------------------------------------
# 4. QUESTION BANK & PYQ CRUD
# -----------------------------------------------------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_questions_list_create(request):
    if request.method == "GET":
        queryset = Question.objects.all().select_related("topic__subject").order_by("-created_at")

        # Filters
        subject_id = request.GET.get("subject_id")
        if subject_id:
            queryset = queryset.filter(topic__subject_id=subject_id)

        q_type = request.GET.get("type")
        if q_type:
            queryset = queryset.filter(question_type=q_type)

        is_pyq = request.GET.get("is_pyq")
        if is_pyq is not None and is_pyq != "":
            queryset = queryset.filter(is_pyq=(is_pyq.lower() == "true"))

        serializer = AdminQuestionSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = AdminQuestionSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.save()
            return Response(AdminQuestionSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminRole])
def admin_question_detail(request, question_id):
    question = get_object_or_404(Question, id=question_id)

    if request.method == "GET":
        return Response(AdminQuestionSerializer(question).data)

    elif request.method == "PUT":
        serializer = AdminQuestionSerializer(question, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        question.delete()
        return Response({"message": "Question deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------------------------------------
# 5. MOCK TEST CREATION & MANAGEMENT
# -----------------------------------------------------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def admin_mock_tests_list_create(request):
    if request.method == "GET":
        tests = MockTest.objects.all().order_by("-created_at")
        serializer = AdminMockTestSerializer(tests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = AdminMockTestSerializer(data=request.data)
        if serializer.is_valid():
            test = serializer.save()
            return Response(AdminMockTestSerializer(test).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminRole])
def admin_mock_test_detail(request, test_id):
    test = get_object_or_404(MockTest, id=test_id)

    if request.method == "GET":
        return Response(AdminMockTestSerializer(test).data)

    elif request.method == "PUT":
        serializer = AdminMockTestSerializer(test, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        test.delete()
        return Response({"message": "Mock test deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_assign_test_questions(request, test_id):
    """
    Assigns or updates questions linked to a mock test with ordering and section names.
    Payload: { "questions": [ { "question_id": "...", "section_name": "...", "order_index": 1, "marks": 2, "negative_mark": 0.66 } ] }
    """
    test = get_object_or_404(MockTest, id=test_id)
    questions_data = request.data.get("questions", [])

    # Replace existing question mappings
    MockTestQuestion.objects.filter(mock_test=test).delete()

    created_records = []
    for q_item in questions_data:
        qid = q_item.get("question_id")
        q = get_object_or_404(Question, id=qid)
        mq = MockTestQuestion.objects.create(
            mock_test=test,
            question=q,
            section_name=q_item.get("section_name", "Core Computer Science"),
            order_index=q_item.get("order_index", 1),
            marks=float(q_item.get("marks", q.marks)),
            negative_mark=float(q_item.get("negative_mark", q.negative_mark)),
        )
        created_records.append(str(mq.id))

    return Response({
        "success": True,
        "message": f"Successfully mapped {len(created_records)} questions to {test.title}.",
        "total_assigned": len(created_records),
    }, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# 6. STUDENT MANAGEMENT
# -----------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_students_list(request):
    """
    Lists registered students with academic details, activity counters, and overall accuracy.
    """
    students = StudentProfile.objects.all().select_related("user", "primary_paper").order_by("-created_at")
    serializer = AdminStudentSerializer(students, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

