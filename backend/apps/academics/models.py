import uuid
from django.db import models


class GatePaper(models.Model):
    """
    Represents an official GATE examination paper (e.g. CS, DA, EC).
    Encodes official secondary paper combinations permitted by GATE authorities.
    """
    code = models.CharField(
        max_length=10,
        primary_key=True,
        help_text="Official GATE paper code, e.g., CS, DA"
    )
    name = models.CharField(
        max_length=200,
        help_text="Full paper name, e.g., Computer Science & Information Technology"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this paper is actively supported in the portal"
    )
    allowed_secondary_papers = models.ManyToManyField(
        "self",
        blank=True,
        symmetrical=False,
        related_name="allowed_as_secondary_for",
        help_text="Official secondary papers permitted when this paper is chosen as primary"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "GATE Paper"
        verbose_name_plural = "GATE Papers"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Branch(models.Model):
    """
    Represents an academic engineering discipline (e.g. CSE, ECE, EE, ME, CE, DA).
    Serves as the root of the Academic CMS + LMS hierarchy.
    Optionally bridges to an official GATE examination paper.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=200,
        help_text="Full branch name, e.g. 'Computer Science & Engineering'"
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique branch identifier code, e.g. 'CSE', 'ECE', 'ME'"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        help_text="URL-safe unique identifier"
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Detailed overview of the branch, career scope, and GATE relevance"
    )
    icon_name = models.CharField(
        max_length=50,
        default="Layers",
        help_text="Lucide icon identifier, e.g. 'Laptop', 'Cpu', 'Zap', 'Layers', 'Database'"
    )
    display_order = models.PositiveIntegerField(
        default=1,
        help_text="Ordering sequence in admin and student navigation"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this branch is active on the platform"
    )
    is_published = models.BooleanField(
        default=True,
        help_text="Controls student portal visibility"
    )
    gate_paper = models.ForeignKey(
        GatePaper,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="legacy_branches",
        help_text="Optional legacy bridge to official GATE paper (e.g. CSE -> CS)"
    )
    gate_papers = models.ManyToManyField(
        GatePaper,
        through="BranchGatePaper",
        related_name="branches",
        blank=True,
        help_text="All official GATE papers associated with this engineering branch"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Branch"
        verbose_name_plural = "Branches"
        ordering = ["display_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class BranchGatePaper(models.Model):
    """
    Many-to-many mapping between an Academic Engineering Branch and a GATE examination paper.
    Supports multi-paper branches (e.g. CSE -> CS and DA) and multi-branch papers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="paper_mappings"
    )
    gate_paper = models.ForeignKey(
        GatePaper,
        on_delete=models.CASCADE,
        related_name="branch_mappings"
    )
    is_primary = models.BooleanField(
        default=True,
        help_text="True if this is the primary examination paper for this engineering branch"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this mapping is active"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Branch GATE Paper Mapping"
        verbose_name_plural = "Branch GATE Paper Mappings"
        unique_together = [("branch", "gate_paper")]
        ordering = ["-is_primary", "gate_paper__code"]

    def __str__(self):
        primary_tag = " (Primary)" if self.is_primary else ""
        return f"{self.branch.code} ➔ {self.gate_paper.code}{primary_tag}"


class Subject(models.Model):
    """
    Represents an official subject within an academic branch and optional GATE paper.
    """
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subjects",
        help_text="Parent academic engineering branch"
    )
    paper = models.ForeignKey(
        GatePaper,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subjects",
        help_text="Optional GATE examination paper relevance"
    )
    code = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Branch-specific subject code, e.g. CS-101, CS-DM"
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150)
    order_index = models.PositiveIntegerField(
        default=1,
        help_text="Recommended sequence position in the syllabus"
    )
    description = models.TextField(blank=True, default="")
    icon_name = models.CharField(max_length=50, default="BookOpen")
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"
        ordering = ["order_index", "name"]
        unique_together = [("branch", "slug")]

    def __str__(self):
        branch_str = self.branch.code if self.branch else (self.paper.code if self.paper else "General")
        return f"{self.name} ({branch_str})"



class Topic(models.Model):
    """
    Represents a specific syllabus topic within a subject (e.g. Propositional Logic).
    Contains concept explanations, formulas, and learning notes.
    """
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="topics"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    order_index = models.PositiveIntegerField(default=1)
    concept_notes = models.TextField(
        blank=True,
        default="",
        help_text="Markdown and LaTeX concept explanations, theorems, and formulas"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Topic"
        verbose_name_plural = "Topics"
        ordering = ["order_index", "name"]
        unique_together = [("subject", "slug")]

    def __str__(self):
        return f"{self.name} — {self.subject.name}"


class TopicProgress(models.Model):
    """
    Tracks a student's completion of a syllabus topic.
    """
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="topic_progress"
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="student_progress"
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Topic Progress"
        verbose_name_plural = "Topic Progress Records"
        unique_together = [("student", "topic")]

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.student.full_name} - {self.topic.name}: {status}"
