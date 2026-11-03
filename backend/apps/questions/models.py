import uuid
from django.db import models


class Question(models.Model):
    """
    Represents a GATE question supporting MCQ, MSQ, and NAT types.
    Answers and explanations remain secured on the server.
    """
    TYPE_CHOICES = [
        ("MCQ", "Multiple Choice Question (Single Option Correct)"),
        ("MSQ", "Multiple Select Question (One or More Options Correct, No Negative Marks)"),
        ("NAT", "Numerical Answer Type (Numeric Range, No Negative Marks)"),
    ]

    DIFFICULTY_CHOICES = [
        ("Easy", "Easy"),
        ("Medium", "Medium"),
        ("Hard", "Hard"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        "academics.Topic",
        on_delete=models.CASCADE,
        related_name="questions"
    )
    question_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        default="MCQ"
    )
    statement = models.TextField(
        help_text="Question statement with LaTeX formulas and code blocks"
    )
    options = models.JSONField(
        blank=True,
        null=True,
        help_text="List of option strings for MCQ/MSQ (e.g. ['(A) ...', '(B) ...'])"
    )
    correct_answer = models.JSONField(
        help_text="Server-side answer key: int for MCQ, list[int] for MSQ, or {'min': x, 'max': y} for NAT"
    )
    detailed_explanation = models.TextField(
        help_text="Step-by-step mathematical proof or concept explanation"
    )
    marks = models.PositiveIntegerField(
        default=1,
        choices=[(1, "1 Mark"), (2, "2 Marks")]
    )
    negative_mark = models.FloatField(
        default=0.33,
        help_text="Negative marking penalty. GATE rule: 0.33 for 1-mark MCQ, 0.66 for 2-mark MCQ, 0.0 for MSQ and NAT"
    )
    is_pyq = models.BooleanField(
        default=False,
        help_text="True if this question appeared in an official GATE examination"
    )
    pyq_year = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="GATE examination year (e.g. 2024)"
    )
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="Medium"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Question"
        verbose_name_plural = "Questions"
        ordering = ["-created_at"]

    def __str__(self):
        pyq_tag = f" [GATE {self.pyq_year}]" if self.is_pyq and self.pyq_year else ""
        return f"{self.question_type} ({self.marks}M){pyq_tag} — {self.statement[:60]}..."


class StudentAttempt(models.Model):
    """
    Records an individual student's question submission with automated evaluation and timing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    selected_answer = models.JSONField(
        help_text="Selected option index (MCQ), indices array (MSQ), or number (NAT)"
    )
    is_correct = models.BooleanField(default=False)
    marks_awarded = models.FloatField(
        default=0.0,
        help_text="Positive marks for correct, negative for incorrect MCQ, 0.0 for unanswered/incorrect MSQ/NAT"
    )
    time_taken_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Seconds spent attempting this question"
    )
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Student Attempt"
        verbose_name_plural = "Student Attempts"
        ordering = ["-attempted_at"]

    def __str__(self):
        status = "Correct" if self.is_correct else "Incorrect"
        return f"{self.student.full_name} - {self.question.id}: {status} ({self.marks_awarded} marks)"


class Bookmark(models.Model):
    """
    Bookmarks saved by a student for fast revision.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="bookmarks"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="bookmarked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bookmark"
        verbose_name_plural = "Bookmarks"
        unique_together = [("student", "question")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.full_name} bookmarked {self.question.id}"

