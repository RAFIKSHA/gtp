import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class StudentProfile(models.Model):
    """
    Dedicated GATE preparation profile for a student.
    Linked to the authenticated CodexPetra student account without storing passwords.
    """
    PREP_LEVEL_CHOICES = [
        ("Beginner", "Beginner (Starting from fundamentals)"),
        ("Intermediate", "Intermediate (Coursework complete, practicing questions)"),
        ("Advanced", "Advanced (Revision & full-length mock tests)"),
    ]

    DAILY_TIME_CHOICES = [
        ("1-2 Hours", "1-2 Hours per day"),
        ("2-3 Hours", "2-3 Hours per day"),
        ("4+ Hours", "4+ Hours per day"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    # Personal & Academic credentials
    full_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, default="")
    qualification = models.CharField(max_length=100, blank=True, default="")
    academic_year = models.CharField(max_length=50, blank=True, default="")
    college_name = models.CharField(max_length=200, blank=True, default="")
    graduation_year = models.PositiveIntegerField(null=True, blank=True)

    # GATE Exam Target
    target_gate_year = models.PositiveIntegerField(
        default=2026,
        help_text="Target examination year"
    )
    enrolled_branch = models.ForeignKey(
        "academics.Branch",
        on_delete=models.SET_NULL,
        related_name="enrolled_students",
        null=True,
        blank=True,
        help_text="Undergraduate / academic engineering branch (e.g. CSE, ECE, ME)"
    )
    primary_paper = models.ForeignKey(
        "academics.GatePaper",
        on_delete=models.PROTECT,
        related_name="primary_students",
        null=True,
        blank=True
    )
    secondary_paper = models.ForeignKey(
        "academics.GatePaper",
        on_delete=models.SET_NULL,
        related_name="secondary_students",
        null=True,
        blank=True
    )

    # Preparation metrics
    previous_attempt_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Optional previous GATE marks / score"
    )
    prep_level = models.CharField(
        max_length=50,
        choices=PREP_LEVEL_CHOICES,
        default="Beginner"
    )
    daily_prep_hours = models.CharField(
        max_length=50,
        choices=DAILY_TIME_CHOICES,
        default="2-3 Hours"
    )
    preferred_learning_method = models.CharField(
        max_length=100,
        default="Concept First + PYQs"
    )

    # Onboarding Status
    is_onboarded = models.BooleanField(
        default=False,
        help_text="True if student has confirmed their onboarding check-in"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"
        ordering = ["-created_at"]

    def clean(self):
        """
        Validate that the secondary paper is officially permitted for the primary paper.
        """
        if self.primary_paper and self.secondary_paper:
            if self.primary_paper == self.secondary_paper:
                raise ValidationError("Primary and secondary GATE papers cannot be identical.")
            if not self.primary_paper.allowed_secondary_papers.filter(code=self.secondary_paper.code).exists():
                raise ValidationError(
                    f"Paper {self.secondary_paper.code} is not an officially permitted secondary paper for {self.primary_paper.code}."
                )

    def __str__(self):
        return f"{self.full_name} ({self.email or self.user.username})"

