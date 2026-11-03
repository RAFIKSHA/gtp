from rest_framework import serializers
from apps.academics.models import GatePaper, Subject, Topic, TopicProgress


class GatePaperSerializer(serializers.ModelSerializer):
    allowed_secondary_papers = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="code"
    )

    class Meta:
        model = GatePaper
        fields = ["code", "name", "is_active", "allowed_secondary_papers"]


class TopicSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = [
            "id",
            "name",
            "slug",
            "order_index",
            "concept_notes",
            "is_active",
            "questions_count",
            "is_completed",
        ]

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if request and hasattr(request, "student_profile"):
            return TopicProgress.objects.filter(
                student=request.student_profile,
                topic=obj,
                is_completed=True
            ).exists()
        return False


class SubjectSerializer(serializers.ModelSerializer):
    topics_count = serializers.IntegerField(source="topics.count", read_only=True)
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "slug",
            "order_index",
            "description",
            "icon_name",
            "topics_count",
            "topics",
        ]
