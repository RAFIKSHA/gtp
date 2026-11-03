from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.students.views import _get_current_student_profile
from apps.questions.models import StudentAttempt
from apps.mock_tests.models import (
    MockTest,
    MockTestQuestion,
    MockTestAttempt,
    MockTestAnswer,
)
from apps.mock_tests.serializers import (
    MockTestListSerializer,
    MockTestQuestionItemSerializer,
    MockTestResultSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def mock_tests_list(request):
    """
    Returns all published mock tests with metadata and current student attempt history.
    """
    student_profile = _get_current_student_profile(request)
    tests = MockTest.objects.filter(is_published=True).order_by("duration_minutes", "-created_at")

    serializer = MockTestListSerializer(
        tests,
        many=True,
        context={"student_profile": student_profile}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def mock_test_detail(request, slug):
    """
    Returns preview and instructions for a specific mock test before beginning the exam.
    """
    student_profile = _get_current_student_profile(request)
    test = get_object_or_404(MockTest, slug=slug, is_published=True)

    serializer = MockTestListSerializer(
        test,
        context={"student_profile": student_profile}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def start_mock_test(request, test_id):
    """
    Starts or resumes an active exam session.
    Server-side source of truth for start time and timer countdown.
    CRITICAL: Does NOT return correct_answer or detailed_explanation!
    """
    student_profile = _get_current_student_profile(request)
    mock_test = get_object_or_404(MockTest, id=test_id, is_published=True)

    now = timezone.now()
    allowed_seconds = mock_test.duration_minutes * 60

    # Check if there is an in-progress attempt for this student
    active_attempt = MockTestAttempt.objects.filter(
        student=student_profile,
        mock_test=mock_test,
        status="in_progress"
    ).order_by("-started_at").first()

    if active_attempt:
        # Check if time has already expired
        elapsed = int((now - active_attempt.started_at).total_seconds())
        if elapsed >= allowed_seconds:
            # Overtime: Auto-submit existing attempt
            return _evaluate_and_submit_attempt(active_attempt, is_auto_submit=True)
        attempt = active_attempt
    else:
        # Create brand new attempt session
        attempt = MockTestAttempt.objects.create(
            student=student_profile,
            mock_test=mock_test,
            status="in_progress",
            total_possible_marks=mock_test.total_marks,
        )

        # Pre-seed MockTestAnswer rows for all test questions
        test_questions = mock_test.test_questions.select_related("question").all()
        answers_to_create = []
        for tq in test_questions:
            answers_to_create.append(
                MockTestAnswer(
                    attempt=attempt,
                    question=tq.question,
                    is_answered=False,
                    is_marked_for_review=False,
                )
            )
        MockTestAnswer.objects.bulk_create(answers_to_create, ignore_conflicts=True)

    # Calculate server-side remaining time
    elapsed_seconds = int((timezone.now() - attempt.started_at).total_seconds())
    time_remaining_seconds = max(0, allowed_seconds - elapsed_seconds)

    # Fetch ordered questions
    test_questions = mock_test.test_questions.select_related("question", "question__topic__subject").order_by("order_index")
    answers_map = {ans.question_id: ans for ans in attempt.answers.all()}

    questions_data = MockTestQuestionItemSerializer(
        test_questions,
        many=True,
        context={"answers_map": answers_map}
    ).data

    return Response({
        "attempt_id": str(attempt.id),
        "test": {
            "id": str(mock_test.id),
            "title": mock_test.title,
            "slug": mock_test.slug,
            "duration_minutes": mock_test.duration_minutes,
            "total_marks": mock_test.total_marks,
            "total_questions": mock_test.total_questions,
            "instructions": mock_test.instructions,
        },
        "server_time": timezone.now().isoformat(),
        "started_at": attempt.started_at.isoformat(),
        "time_remaining_seconds": time_remaining_seconds,
        "questions": questions_data,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def autosave_mock_test_answer(request, attempt_id):
    """
    Autosaves student answers and review marks periodically from the exam client.
    Checks server elapsed time to trigger auto-submit if time expires.
    """
    attempt = get_object_or_404(MockTestAttempt, id=attempt_id)
    if attempt.status != "in_progress":
        return Response(
            {"error": "This test has already been submitted.", "status": attempt.status},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check server-side time expiration
    now = timezone.now()
    allowed_seconds = attempt.mock_test.duration_minutes * 60
    elapsed_seconds = int((now - attempt.started_at).total_seconds())
    time_remaining_seconds = max(0, allowed_seconds - elapsed_seconds)

    if elapsed_seconds >= allowed_seconds:
        # Time expired: Auto-submit!
        return _evaluate_and_submit_attempt(attempt, is_auto_submit=True)

    # Process incoming answers payload
    # Format: { "answers": [ { "question_id": "...", "selected_answer": ..., "is_marked_for_review": bool, "time_spent_seconds": int } ] }
    answers_data = request.data.get("answers", [])
    for item in answers_data:
        qid = item.get("question_id")
        if not qid:
            continue

        selected = item.get("selected_answer")
        is_marked = bool(item.get("is_marked_for_review", False))
        time_spent = int(item.get("time_spent_seconds", 0))

        # Check if answered
        has_answered = selected is not None and selected != "" and selected != []

        MockTestAnswer.objects.filter(attempt=attempt, question_id=qid).update(
            selected_answer=selected,
            is_answered=has_answered,
            is_marked_for_review=is_marked,
            time_spent_seconds=time_spent,
        )

    return Response({
        "success": True,
        "time_remaining_seconds": time_remaining_seconds,
        "auto_submitted": False,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_mock_test(request, attempt_id):
    """
    Submits the test by student confirmation. Triggers server-side evaluation engine.
    """
    attempt = get_object_or_404(MockTestAttempt, id=attempt_id)
    if attempt.status != "in_progress":
        return Response(
            {"message": "Test was already submitted.", "attempt_id": str(attempt.id)},
            status=status.HTTP_200_OK
        )

    # Also update any final answers passed with submit request
    answers_data = request.data.get("answers", [])
    for item in answers_data:
        qid = item.get("question_id")
        if not qid:
            continue
        selected = item.get("selected_answer")
        has_answered = selected is not None and selected != "" and selected != []
        MockTestAnswer.objects.filter(attempt=attempt, question_id=qid).update(
            selected_answer=selected,
            is_answered=has_answered,
            is_marked_for_review=bool(item.get("is_marked_for_review", False)),
            time_spent_seconds=int(item.get("time_spent_seconds", 0)),
        )

    return _evaluate_and_submit_attempt(attempt, is_auto_submit=False)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_mock_test_results(request, attempt_id):
    """
    Returns full scorecard and unlocks mathematical solutions for a submitted exam attempt.
    """
    attempt = get_object_or_404(MockTestAttempt, id=attempt_id)
    if attempt.status == "in_progress":
        return Response(
            {"error": "Exam is still in progress. Solutions cannot be viewed before submission."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = MockTestResultSerializer(attempt)
    return Response(serializer.data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# AUTOMATED EVALUATION ENGINE
# -----------------------------------------------------------------------------
def _evaluate_and_submit_attempt(attempt: MockTestAttempt, is_auto_submit: bool = False):
    """
    Pure server-side evaluation engine applying official GATE scoring rules:
    - MCQ: +Marks for correct, -1/3rd Negative Mark for wrong answer.
    - MSQ: +Marks only if ALL correct options are selected and NO incorrect options. NO negative marks.
    - NAT: +Marks if numerical value within accepted tolerance. NO negative marks.
    - Unanswered: 0 Marks.
    """
    now = timezone.now()
    elapsed_seconds = int((now - attempt.started_at).total_seconds())
    max_duration_seconds = attempt.mock_test.duration_minutes * 60
    total_time_spent = min(elapsed_seconds, max_duration_seconds)

    # Build mapping of question configs in this test
    tq_map = {
        tq.question_id: tq
        for tq in MockTestQuestion.objects.filter(mock_test=attempt.mock_test)
    }

    answers = attempt.answers.select_related("question").all()

    total_score = 0.0
    correct_count = 0
    incorrect_count = 0
    unattempted_count = 0

    for ans in answers:
        q = ans.question
        tq = tq_map.get(q.id)
        marks_val = float(tq.marks if tq else q.marks)
        neg_val = float(tq.negative_mark if tq else q.negative_mark)

        if not ans.is_answered or ans.selected_answer is None or ans.selected_answer == "":
            ans.is_correct = False
            ans.marks_awarded = 0.0
            unattempted_count += 1
            ans.save(update_fields=["is_correct", "marks_awarded"])
            continue

        is_correct = False
        marks_awarded = 0.0

        # 1. Multiple Choice Question (Single Option)
        if q.question_type == "MCQ":
            try:
                is_correct = (int(ans.selected_answer) == int(q.correct_answer))
            except (ValueError, TypeError):
                is_correct = False

            if is_correct:
                marks_awarded = marks_val
                correct_count += 1
            else:
                marks_awarded = -neg_val
                incorrect_count += 1

        # 2. Multiple Select Question (All correct, no negative marks)
        elif q.question_type == "MSQ":
            try:
                sel = sorted([int(x) for x in ans.selected_answer]) if isinstance(ans.selected_answer, list) else []
                cor = sorted([int(x) for x in q.correct_answer]) if isinstance(q.correct_answer, list) else []
                is_correct = (sel == cor and len(sel) > 0)
            except (ValueError, TypeError):
                is_correct = False

            if is_correct:
                marks_awarded = marks_val
                correct_count += 1
            else:
                marks_awarded = 0.0
                incorrect_count += 1

        # 3. Numerical Answer Type (Range/Exact tolerance, no negative marks)
        elif q.question_type == "NAT":
            try:
                numeric_val = float(ans.selected_answer)
                if isinstance(q.correct_answer, dict):
                    min_val = float(q.correct_answer.get("min", 0.0))
                    max_val = float(q.correct_answer.get("max", 0.0))
                    is_correct = (min_val <= numeric_val <= max_val)
                else:
                    is_correct = abs(numeric_val - float(q.correct_answer)) < 0.001
            except (ValueError, TypeError):
                is_correct = False

            if is_correct:
                marks_awarded = marks_val
                correct_count += 1
            else:
                marks_awarded = 0.0
                incorrect_count += 1

        ans.is_correct = is_correct
        ans.marks_awarded = round(marks_awarded, 2)
        ans.save(update_fields=["is_correct", "marks_awarded"])
        total_score += ans.marks_awarded

        # Also mirror attempt into StudentAttempt for unified platform analytics!
        StudentAttempt.objects.update_or_create(
            student=attempt.student,
            question=q,
            defaults={
                "selected_answer": ans.selected_answer,
                "is_correct": is_correct,
                "marks_awarded": ans.marks_awarded,
                "time_taken_seconds": ans.time_spent_seconds,
            }
        )

    attempted_total = correct_count + incorrect_count
    accuracy = round((correct_count / attempted_total * 100), 1) if attempted_total > 0 else 0.0

    attempt.status = "auto_submitted" if is_auto_submit else "submitted"
    attempt.completed_at = now
    attempt.time_spent_seconds = total_time_spent
    attempt.score_obtained = round(total_score, 2)
    attempt.accuracy_percentage = accuracy
    attempt.correct_count = correct_count
    attempt.incorrect_count = incorrect_count
    attempt.unattempted_count = unattempted_count
    attempt.save()

    return Response({
        "success": True,
        "message": "Examination auto-submitted upon timer expiration." if is_auto_submit else "Examination submitted successfully.",
        "attempt_id": str(attempt.id),
        "status": attempt.status,
        "score_obtained": attempt.score_obtained,
        "total_possible_marks": attempt.total_possible_marks,
        "accuracy_percentage": attempt.accuracy_percentage,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "unattempted_count": attempt.unattempted_count,
        "time_spent_seconds": attempt.time_spent_seconds,
    }, status=status.HTTP_200_OK)

