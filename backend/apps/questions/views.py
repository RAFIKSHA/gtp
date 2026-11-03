from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.questions.models import Question, StudentAttempt, Bookmark
from apps.questions.serializers import (
    QuestionListSerializer,
    QuestionDetailSerializer,
    StudentAttemptSerializer,
    BookmarkSerializer,
)
from apps.students.views import _get_current_student_profile


@api_view(["GET"])
@permission_classes([AllowAny])
def practice_questions_list(request):
    """
    Returns filtered questions for practice or PYQ archive.
    Strips correct answers and explanations for exam integrity.
    """
    student_profile = _get_current_student_profile(request)
    queryset = Question.objects.select_related("topic", "topic__subject").all()

    # Filters
    subject_slug = request.GET.get("subject")
    if subject_slug:
        queryset = queryset.filter(topic__subject__slug=subject_slug)

    topic_slug = request.GET.get("topic")
    if topic_slug:
        queryset = queryset.filter(topic__slug=topic_slug)

    question_type = request.GET.get("type")
    if question_type:
        queryset = queryset.filter(question_type=question_type.upper())

    difficulty = request.GET.get("difficulty")
    if difficulty:
        queryset = queryset.filter(difficulty__iexact=difficulty)

    is_pyq = request.GET.get("is_pyq")
    if is_pyq is not None:
        queryset = queryset.filter(is_pyq=is_pyq.lower() in ("true", "1", "yes"))

    pyq_year = request.GET.get("year")
    if pyq_year:
        queryset = queryset.filter(pyq_year=int(pyq_year))

    serializer = QuestionListSerializer(
        queryset,
        many=True,
        context={"student_profile": student_profile}
    )
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_question_answer(request, question_id):
    """
    Evaluates student answer according to official GATE marking criteria.
    Saves attempt record and returns correctness, marks, and detailed solution.
    """
    student_profile = _get_current_student_profile(request)
    question = get_object_or_404(Question, id=question_id)

    selected_answer = request.data.get("selected_answer")
    time_taken_seconds = int(request.data.get("time_taken_seconds", 0))

    if selected_answer is None:
        return Response(
            {"error": "selected_answer is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    is_correct = False
    marks_awarded = 0.0

    # 1. Multiple Choice Question (Single Option)
    if question.question_type == "MCQ":
        try:
            is_correct = int(selected_answer) == int(question.correct_answer)
        except (ValueError, TypeError):
            is_correct = False

        if is_correct:
            marks_awarded = float(question.marks)
        else:
            marks_awarded = -float(question.negative_mark)

    # 2. Multiple Select Question (One or more options, no negative marks)
    elif question.question_type == "MSQ":
        try:
            student_selection = sorted([int(x) for x in selected_answer]) if isinstance(selected_answer, list) else []
            correct_selection = sorted([int(x) for x in question.correct_answer]) if isinstance(question.correct_answer, list) else []
            is_correct = student_selection == correct_selection
        except (ValueError, TypeError):
            is_correct = False

        marks_awarded = float(question.marks) if is_correct else 0.0

    # 3. Numerical Answer Type (Range/Exact, no negative marks)
    elif question.question_type == "NAT":
        try:
            numeric_val = float(selected_answer)
            if isinstance(question.correct_answer, dict):
                min_val = float(question.correct_answer.get("min", 0.0))
                max_val = float(question.correct_answer.get("max", 0.0))
                is_correct = (min_val <= numeric_val <= max_val)
            else:
                is_correct = abs(numeric_val - float(question.correct_answer)) < 0.001
        except (ValueError, TypeError):
            is_correct = False

        marks_awarded = float(question.marks) if is_correct else 0.0

    # Record or update attempt
    attempt, created = StudentAttempt.objects.update_or_create(
        student=student_profile,
        question=question,
        defaults={
            "selected_answer": selected_answer,
            "is_correct": is_correct,
            "marks_awarded": marks_awarded,
            "time_taken_seconds": time_taken_seconds,
        }
    )

    # Detailed solution payload
    return Response({
        "success": True,
        "is_correct": is_correct,
        "marks_awarded": marks_awarded,
        "correct_answer": question.correct_answer,
        "detailed_explanation": question.detailed_explanation,
        "message": "Excellent work!" if is_correct else "Concept review recommended.",
        "attempt_id": str(attempt.id),
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def toggle_bookmark(request, question_id):
    """
    Toggles bookmark status on a question for the current student.
    """
    student_profile = _get_current_student_profile(request)
    question = get_object_or_404(Question, id=question_id)

    bookmark = Bookmark.objects.filter(student=student_profile, question=question).first()

    if bookmark:
        bookmark.delete()
        is_bookmarked = False
    else:
        Bookmark.objects.create(student=student_profile, question=question)
        is_bookmarked = True

    return Response({
        "success": True,
        "question_id": str(question.id),
        "is_bookmarked": is_bookmarked,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def student_bookmarks_list(request):
    """
    Returns all bookmarked questions saved by the student.
    """
    student_profile = _get_current_student_profile(request)
    bookmarks = Bookmark.objects.filter(student=student_profile).select_related(
        "question", "question__topic", "question__topic__subject"
    )
    serializer = BookmarkSerializer(
        bookmarks,
        many=True,
        context={"student_profile": student_profile}
    )
    return Response(serializer.data)

