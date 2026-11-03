from rest_framework import serializers
from apps.students.models import StudentProfile
from apps.academics.models import GatePaper
from apps.academics.serializers import GatePaperSerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    primary_paper_details = GatePaperSerializer(source="primary_paper", read_only=True)
    secondary_paper_details = GatePaperSerializer(source="secondary_paper", read_only=True)

    primary_paper = serializers.PrimaryKeyRelatedField(
        queryset=GatePaper.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    secondary_paper = serializers.PrimaryKeyRelatedField(
        queryset=GatePaper.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "full_name",
            "email",
            "qualification",
            "academic_year",
            "college_name",
            "graduation_year",
            "target_gate_year",
            "primary_paper",
            "secondary_paper",
            "primary_paper_details",
            "secondary_paper_details",
            "previous_attempt_score",
            "prep_level",
            "daily_prep_hours",
            "preferred_learning_method",
            "is_onboarded",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        primary = attrs.get("primary_paper", getattr(self.instance, "primary_paper", None))
        secondary = attrs.get("secondary_paper", getattr(self.instance, "secondary_paper", None))

        if primary and secondary:
            if primary.code == secondary.code:
                raise serializers.ValidationError({
                    "secondary_paper": "Primary and secondary GATE papers cannot be identical."
                })
            if not primary.allowed_secondary_papers.filter(code=secondary.code).exists():
                raise serializers.ValidationError({
                    "secondary_paper": f"Paper {secondary.code} is not an officially permitted secondary paper for {primary.code}."
                })

        return attrs

