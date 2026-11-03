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


class Subject(models.Model):
    """
    Represents an official subject within a GATE paper (e.g. Discrete Mathematics in CS).
    """
    paper = models.ForeignKey(
        GatePaper,
        on_delete=models.CASCADE,
        related_name="subjects"
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150)
    order_index = models.PositiveIntegerField(
        default=1,
        help_text="Recommended sequence position in the syllabus"
    )
    description = models.TextField(blank=True, default="")
    icon_name = models.CharField(max_length=50, default="BookOpen")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"
        ordering = ["order_index", "name"]
        unique_together = [("paper", "slug")]

    def __str__(self):
        return f"{self.name} ({self.paper.code})"


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
