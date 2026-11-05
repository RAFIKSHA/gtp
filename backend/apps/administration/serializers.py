from rest_framework import serializers
from apps.academics.models import GatePaper, Branch, BranchGatePaper, Subject, Topic
from apps.questions.models import Question, StudentAttempt
from apps.mock_tests.models import MockTest, MockTestQuestion, MockTestAttempt
from apps.students.models import StudentProfile


class BranchGatePaperSerializer(serializers.ModelSerializer):
    """
    Serializer for Branch to GATE Paper many-to-many mappings.
    """
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)
    gate_paper_code = serializers.CharField(source="gate_paper.code", read_only=True)
    gate_paper_name = serializers.CharField(source="gate_paper.name", read_only=True)

    class Meta:
        model = BranchGatePaper
        fields = [
            "id",
            "branch",
            "branch_name",
            "branch_code",
            "gate_paper",
            "gate_paper_code",
            "gate_paper_name",
            "is_primary",
            "is_active",
            "created_at",
        ]


class AdminGatePaperSerializer(serializers.ModelSerializer):
    """
    Serializer for GATE examination papers with their connected academic branches.
    """
    connected_branches = serializers.SerializerMethodField()
    connected_branches_count = serializers.SerializerMethodField()

    class Meta:
        model = GatePaper
        fields = [
            "code",
            "name",
            "is_active",
            "connected_branches",
            "connected_branches_count",
            "created_at",
        ]

    def get_connected_branches(self, obj):
        mappings = obj.branch_mappings.select_related("branch").all()
        return [
            {
                "mapping_id": str(m.id),
                "branch_id": str(m.branch.id),
                "branch_name": m.branch.name,
                "branch_code": m.branch.code,
                "is_primary": m.is_primary,
                "is_active": m.is_active,
            }
            for m in mappings
        ]

    def get_connected_branches_count(self, obj):
        return obj.branch_mappings.count()


class AdminBranchSerializer(serializers.ModelSerializer):
    """
    Administrative serializer for managing academic engineering branches.
    """
    slug = serializers.SlugField(required=False)
    subjects_count = serializers.IntegerField(source="subjects.count", read_only=True)
    gate_paper_code = serializers.CharField(source="gate_paper.code", read_only=True, default=None)
    gate_paper_name = serializers.CharField(source="gate_paper.name", read_only=True, default=None)
    connected_papers = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            "id",
            "name",
            "code",
            "slug",
            "description",
            "icon_name",
            "display_order",
            "is_active",
            "is_published",
            "gate_paper",
            "gate_paper_code",
            "gate_paper_name",
            "connected_papers",
            "subjects_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from django.utils.text import slugify
        if not attrs.get("slug"):
            base_str = attrs.get("code") or attrs.get("name") or ""
            attrs["slug"] = slugify(base_str)
        return attrs

    def get_connected_papers(self, obj):
        mappings = obj.paper_mappings.select_related("gate_paper").all()
        return [
            {
                "mapping_id": str(m.id),
                "paper_code": m.gate_paper.code,
                "paper_name": m.gate_paper.name,
                "is_primary": m.is_primary,
                "is_active": m.is_active,
            }
            for m in mappings
        ]


class AdminSubjectSerializer(serializers.ModelSerializer):
    """
    Administrative serializer for creating and managing GATE subjects.
    """
    topics_count = serializers.IntegerField(source="topics.count", read_only=True)
    paper_code = serializers.CharField(source="paper.code", read_only=True, default=None)
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)
    branch_code = serializers.CharField(source="branch.code", read_only=True, default=None)

    class Meta:
        model = Subject
        fields = [
            "id",
            "branch",
            "branch_name",
            "branch_code",
            "paper",
            "paper_code",
            "code",
            "name",
            "slug",
            "order_index",
            "description",
            "icon_name",
            "is_active",
            "is_published",
            "topics_count",
            "created_at",
        ]


class AdminTopicSerializer(serializers.ModelSerializer):
    """
    Administrative serializer for creating and managing syllabus topics.
    """
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Topic
        fields = [
            "id",
            "subject",
            "subject_name",
            "name",
            "slug",
            "order_index",
            "concept_notes",
            "is_active",
            "questions_count",
            "created_at",
        ]


class AdminQuestionSerializer(serializers.ModelSerializer):
    """
    Administrative question management serializer with rigorous GATE integrity validation.
    """
    subject_id = serializers.IntegerField(source="topic.subject.id", read_only=True)
    subject_name = serializers.CharField(source="topic.subject.name", read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "topic",
            "topic_name",
            "subject_id",
            "subject_name",
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
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        q_type = attrs.get("question_type", getattr(self.instance, "question_type", None))
        options = attrs.get("options", getattr(self.instance, "options", None))
        correct_answer = attrs.get("correct_answer", getattr(self.instance, "correct_answer", None))
        marks = attrs.get("marks", getattr(self.instance, "marks", 1))

        # 1. Validate MCQ
        if q_type == "MCQ":
            if not options or len(options) < 2:
                raise serializers.ValidationError({"options": "MCQ questions must provide at least 2 options."})
            if correct_answer is None:
                raise serializers.ValidationError({"correct_answer": "MCQ must have a selected correct option index (e.g. 0, 1, 2, 3)."})
            try:
                idx = int(correct_answer)
                if idx < 0 or idx >= len(options):
                    raise serializers.ValidationError({"correct_answer": f"Index {idx} is outside option range (0 to {len(options)-1})."})
            except (ValueError, TypeError):
                raise serializers.ValidationError({"correct_answer": "MCQ correct answer must be an integer index."})

            # Auto-align GATE negative marks
            if "negative_mark" not in attrs:
                attrs["negative_mark"] = 0.33 if marks == 1 else 0.66

        # 2. Validate MSQ
        elif q_type == "MSQ":
            if not options or len(options) < 2:
                raise serializers.ValidationError({"options": "MSQ questions must provide at least 2 options."})
            if not isinstance(correct_answer, list) or len(correct_answer) == 0:
                raise serializers.ValidationError({"correct_answer": "MSQ correct answer must be a list of option indices (e.g. [0, 2])."})
            # GATE rule: MSQ has 0 negative marking
            attrs["negative_mark"] = 0.0

        # 3. Validate NAT
        elif q_type == "NAT":
            if correct_answer is None:
                raise serializers.ValidationError({"correct_answer": "NAT question must specify a numerical value or range {'min': x, 'max': y}."})
            # GATE rule: NAT has 0 negative marking
            attrs["negative_mark"] = 0.0

        # 4. Validate PYQ
        is_pyq = attrs.get("is_pyq", getattr(self.instance, "is_pyq", False))
        pyq_year = attrs.get("pyq_year", getattr(self.instance, "pyq_year", None))
        if is_pyq and not pyq_year:
            raise serializers.ValidationError({"pyq_year": "Official PYQ questions must specify the examination year."})

        return attrs


class AdminMockTestSerializer(serializers.ModelSerializer):
    """
    Administrative serializer for creating, configuring, and publishing mock tests.
    """
    paper_code = serializers.CharField(source="paper.code", read_only=True)
    questions_count = serializers.IntegerField(source="test_questions.count", read_only=True)
    attempts_count = serializers.IntegerField(source="attempts.count", read_only=True)

    class Meta:
        model = MockTest
        fields = [
            "id",
            "title",
            "slug",
            "paper",
            "paper_code",
            "test_type",
            "duration_minutes",
            "total_marks",
            "total_questions",
            "passing_marks",
            "instructions",
            "is_published",
            "questions_count",
            "attempts_count",
            "created_at",
            "updated_at",
        ]


class AdminStudentSerializer(serializers.ModelSerializer):
    """
    Administrative overview of student activity and learning progress.
    """
    paper_code = serializers.CharField(source="primary_paper.code", read_only=True)
    attempts_count = serializers.SerializerMethodField()
    tests_completed = serializers.SerializerMethodField()
    average_accuracy = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "full_name",
            "email",
            "target_gate_year",
            "paper_code",
            "qualification",
            "academic_year",
            "is_onboarded",
            "attempts_count",
            "tests_completed",
            "average_accuracy",
            "created_at",
        ]

    def get_attempts_count(self, obj):
        return obj.attempts.count()

    def get_tests_completed(self, obj):
        return obj.mock_test_attempts.filter(status__in=["submitted", "auto_submitted"]).count()

    def get_average_accuracy(self, obj):
        attempts = obj.attempts.all()
        total = attempts.count()
        if total == 0:
            return 0.0
        correct = attempts.filter(is_correct=True).count()
        return round((correct / total * 100), 1)

