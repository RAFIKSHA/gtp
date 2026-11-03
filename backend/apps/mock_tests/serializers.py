from rest_framework import serializers
from apps.mock_tests.models import (
    MockTest,
    MockTestQuestion,
    MockTestAttempt,
    MockTestAnswer,
)
from apps.questions.models import Question


class MockTestListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing available mock tests in student portal.
    Includes student's attempt history if available.
    """
    paper_code = serializers.CharField(source="paper.code", read_only=True)
    paper_name = serializers.CharField(source="paper.name", read_only=True)
    student_attempt = serializers.SerializerMethodField()

    class Meta:
        model = MockTest
        fields = [
            "id",
            "title",
            "slug",
            "paper_code",
            "paper_name",
            "test_type",
            "duration_minutes",
            "total_marks",
            "total_questions",
            "passing_marks",
            "instructions",
            "is_published",
            "student_attempt",
            "created_at",
        ]

    def get_student_attempt(self, obj):
        student_profile = self.context.get("student_profile")
        if not student_profile:
            return None

        attempts = MockTestAttempt.objects.filter(student=student_profile, mock_test=obj).order_by("-started_at")
        if not attempts.exists():
            return None

        latest = attempts.first()
        return {
            "attempt_id": str(latest.id),
            "status": latest.status,
            "started_at": latest.started_at,
            "completed_at": latest.completed_at,
            "score_obtained": latest.score_obtained,
            "total_possible_marks": latest.total_possible_marks,
            "accuracy_percentage": latest.accuracy_percentage,
            "attempts_count": attempts.count(),
        }


class MockTestQuestionItemSerializer(serializers.ModelSerializer):
    """
    Sanitized question serializer for active exam palette.
    CRITICAL: Does NOT leak correct_answer or detailed_explanation!
    """
    question_id = serializers.UUIDField(source="question.id", read_only=True)
    question_type = serializers.CharField(source="question.question_type", read_only=True)
    statement = serializers.CharField(source="question.statement", read_only=True)
    options = serializers.JSONField(source="question.options", read_only=True)
    subject_name = serializers.CharField(source="question.topic.subject.name", read_only=True)
    topic_name = serializers.CharField(source="question.topic.name", read_only=True)
    selected_answer = serializers.SerializerMethodField()
    is_answered = serializers.SerializerMethodField()
    is_marked_for_review = serializers.SerializerMethodField()

    class Meta:
        model = MockTestQuestion
        fields = [
            "id",
            "question_id",
            "order_index",
            "section_name",
            "question_type",
            "statement",
            "options",
            "marks",
            "negative_mark",
            "subject_name",
            "topic_name",
            "selected_answer",
            "is_answered",
            "is_marked_for_review",
        ]

    def get_selected_answer(self, obj):
        answers_map = self.context.get("answers_map", {})
        answer_rec = answers_map.get(obj.question_id)
        return answer_rec.selected_answer if answer_rec else None

    def get_is_answered(self, obj):
        answers_map = self.context.get("answers_map", {})
        answer_rec = answers_map.get(obj.question_id)
        return answer_rec.is_answered if answer_rec else False

    def get_is_marked_for_review(self, obj):
        answers_map = self.context.get("answers_map", {})
        answer_rec = answers_map.get(obj.question_id)
        return answer_rec.is_marked_for_review if answer_rec else False


class MockTestAnswerReviewSerializer(serializers.ModelSerializer):
    """
    Detailed solution review for a question after exam submission.
    Unlocks official answer key and mathematical proof.
    """
    question_id = serializers.UUIDField(source="question.id", read_only=True)
    question_type = serializers.CharField(source="question.question_type", read_only=True)
    statement = serializers.CharField(source="question.statement", read_only=True)
    options = serializers.JSONField(source="question.options", read_only=True)
    correct_answer = serializers.JSONField(source="question.correct_answer", read_only=True)
    detailed_explanation = serializers.CharField(source="question.detailed_explanation", read_only=True)
    subject_name = serializers.CharField(source="question.topic.subject.name", read_only=True)
    topic_name = serializers.CharField(source="question.topic.name", read_only=True)

    class Meta:
        model = MockTestAnswer
        fields = [
            "id",
            "question_id",
            "question_type",
            "statement",
            "options",
            "correct_answer",
            "detailed_explanation",
            "selected_answer",
            "is_answered",
            "is_marked_for_review",
            "is_correct",
            "marks_awarded",
            "time_spent_seconds",
            "subject_name",
            "topic_name",
        ]


class MockTestResultSerializer(serializers.ModelSerializer):
    """
    Full scorecard and results serializer for a completed test attempt.
    """
    test_title = serializers.CharField(source="mock_test.title", read_only=True)
    test_type = serializers.CharField(source="mock_test.test_type", read_only=True)
    duration_minutes = serializers.IntegerField(source="mock_test.duration_minutes", read_only=True)
    passing_marks = serializers.FloatField(source="mock_test.passing_marks", read_only=True)
    answers = MockTestAnswerReviewSerializer(many=True, read_only=True)
    section_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = MockTestAttempt
        fields = [
            "id",
            "test_title",
            "test_type",
            "duration_minutes",
            "passing_marks",
            "status",
            "started_at",
            "completed_at",
            "time_spent_seconds",
            "score_obtained",
            "total_possible_marks",
            "accuracy_percentage",
            "correct_count",
            "incorrect_count",
            "unattempted_count",
            "section_breakdown",
            "answers",
        ]

    def get_section_breakdown(self, obj):
        """
        Computes marks and accuracy grouped by subject for performance insight.
        """
        breakdown = {}
        for ans in obj.answers.select_related("question__topic__subject").all():
            subj_name = ans.question.topic.subject.name
            if subj_name not in breakdown:
                breakdown[subj_name] = {
                    "subject": subj_name,
                    "total_questions": 0,
                    "attempted": 0,
                    "correct": 0,
                    "marks_awarded": 0.0,
                }
            breakdown[subj_name]["total_questions"] += 1
            if ans.is_answered:
                breakdown[subj_name]["attempted"] += 1
            if ans.is_correct:
                breakdown[subj_name]["correct"] += 1
            breakdown[subj_name]["marks_awarded"] += ans.marks_awarded

        # Calculate accuracy per subject
        result = []
        for s in breakdown.values():
            s["marks_awarded"] = round(s["marks_awarded"], 2)
            s["accuracy"] = round((s["correct"] / s["attempted"] * 100), 1) if s["attempted"] > 0 else 0.0
            result.append(s)
        return result

