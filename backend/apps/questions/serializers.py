from rest_framework import serializers
from apps.questions.models import Question, StudentAttempt, Bookmark


class QuestionListSerializer(serializers.ModelSerializer):
    """
    Public sanitized question serializer for student practice and PYQ browsing.
    CRITICAL SECURITY & INTEGRITY: Never exposes correct_answer or detailed_explanation!
    """
    subject_name = serializers.CharField(source="topic.subject.name", read_only=True)
    subject_slug = serializers.CharField(source="topic.subject.slug", read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True)
    topic_slug = serializers.CharField(source="topic.slug", read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "subject_name",
            "subject_slug",
            "topic_name",
            "topic_slug",
            "question_type",
            "statement",
            "options",
            "marks",
            "negative_mark",
            "is_pyq",
            "pyq_year",
            "difficulty",
            "is_bookmarked",
            "created_at",
        ]

    def get_is_bookmarked(self, obj):
        student_profile = self.context.get("student_profile")
        if student_profile:
            return Bookmark.objects.filter(student=student_profile, question=obj).exists()
        return False


class QuestionDetailSerializer(serializers.ModelSerializer):
    """
    Full question details returned ONLY after student submits their response.
    """
    subject_name = serializers.CharField(source="topic.subject.name", read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "subject_name",
            "topic_name",
            "question_type",
            "statement",
            "options",
            "correct_answer",
            "detailed_explanation",
            "marks",
            "negative_mark",
            "is_pyq",
            "pyq_year",
            "difficulty",
        ]


class StudentAttemptSerializer(serializers.ModelSerializer):
    question_details = QuestionDetailSerializer(source="question", read_only=True)

    class Meta:
        model = StudentAttempt
        fields = [
            "id",
            "question",
            "question_details",
            "selected_answer",
            "is_correct",
            "marks_awarded",
            "time_taken_seconds",
            "attempted_at",
        ]


class BookmarkSerializer(serializers.ModelSerializer):
    question = QuestionListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "question", "created_at"]

