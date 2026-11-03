import uuid
from django.db import models


class MockTest(models.Model):
    """
    Represents an official GATE mock examination paper.
    Supports Full-Length (180 mins, 65 questions, 100 marks), Sectional, Subject-wise, and Topic-wise tests.
    """
    TYPE_CHOICES = [
        ("Full-Length", "Full-Length Mock Test (180 Mins)"),
        ("Sectional", "Sectional Mock Test"),
        ("Subject", "Subject-Wise Test"),
        ("Topic", "Topic-Wise Test"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, help_text="Test title, e.g. 'GATE CSE All-India Mock 1'")
    slug = models.SlugField(max_length=200, unique=True)
    paper = models.ForeignKey(
        "academics.GatePaper",
        on_delete=models.CASCADE,
        related_name="mock_tests"
    )
    test_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default="Full-Length"
    )
    duration_minutes = models.PositiveIntegerField(
        default=180,
        help_text="Official test duration in minutes (e.g. 180 for full-length, 45 for sectional)"
    )
    total_marks = models.FloatField(
        default=100.0,
        help_text="Maximum marks possible in this test"
    )
    total_questions = models.PositiveIntegerField(
        default=65,
        help_text="Total number of questions in this examination"
    )
    passing_marks = models.FloatField(
        default=25.0,
        help_text="Estimated qualifying cutoff marks"
    )
    instructions = models.TextField(
        blank=True,
        default="1. Total duration of examination is strictly enforced by the server.\n"
                "2. The clock will be set at the top right corner.\n"
                "3. MCQ questions have negative marking (1/3rd). MSQ and NAT questions carry NO negative marking.\n"
                "4. You can use 'Mark for Review' to revisit questions later.",
        help_text="Examination instructions displayed to student before starting"
    )
    is_published = models.BooleanField(
        default=True,
        help_text="Controls visibility in student portal"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Mock Test"
        verbose_name_plural = "Mock Tests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.paper.code} - {self.test_type})"


class MockTestQuestion(models.Model):
    """
    Through model mapping a question into a mock test.
    Enforces question palette sequence, sectional division, and custom exam weightage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mock_test = models.ForeignKey(
        MockTest,
        on_delete=models.CASCADE,
        related_name="test_questions"
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.CASCADE,
        related_name="in_mock_tests"
    )
    section_name = models.CharField(
        max_length=100,
        default="Core Computer Science",
        help_text="Section name, e.g. 'General Aptitude', 'Core Computer Science'"
    )
    order_index = models.PositiveIntegerField(
        default=1,
        help_text="Order in question palette (1 to N)"
    )
    marks = models.FloatField(
        default=1.0,
        help_text="Marks assigned for this question in this test"
    )
    negative_mark = models.FloatField(
        default=0.33,
        help_text="Negative marking penalty for wrong answer"
    )

    class Meta:
        verbose_name = "Mock Test Question"
        verbose_name_plural = "Mock Test Questions"
        ordering = ["mock_test", "order_index"]
        unique_together = [("mock_test", "question"), ("mock_test", "order_index")]

    def __str__(self):
        return f"Q{self.order_index} in {self.mock_test.title} ({self.question.question_type})"


class MockTestAttempt(models.Model):
    """
    Tracks an individual student's examination session.
    Server-side source of truth for start time, submission time, duration, and score.
    """
    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("submitted", "Submitted by Student"),
        ("auto_submitted", "Auto-Submitted (Timer Expired)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="mock_test_attempts"
    )
    mock_test = models.ForeignKey(
        MockTest,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="in_progress"
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Server-recorded exam start timestamp"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Server-recorded completion timestamp"
    )
    time_spent_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Total active time in seconds spent in the test"
    )
    score_obtained = models.FloatField(
        default=0.0,
        help_text="Total score achieved after evaluating positive and negative marks"
    )
    total_possible_marks = models.FloatField(
        default=0.0,
        help_text="Total possible marks for this exam"
    )
    accuracy_percentage = models.FloatField(
        default=0.0,
        help_text="Percentage of attempted questions answered correctly"
    )
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    unattempted_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Mock Test Attempt"
        verbose_name_plural = "Mock Test Attempts"
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.student.full_name} - {self.mock_test.title} ({self.status}: {self.score_obtained} marks)"


class MockTestAnswer(models.Model):
    """
    Tracks student response, review flag, and evaluation for each question inside a test session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        MockTestAttempt,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.CASCADE,
        related_name="mock_test_answers"
    )
    selected_answer = models.JSONField(
        null=True,
        blank=True,
        help_text="Selected option index (MCQ), list of indices (MSQ), or numeric value (NAT)"
    )
    is_answered = models.BooleanField(
        default=False,
        help_text="True if student has chosen an answer"
    )
    is_marked_for_review = models.BooleanField(
        default=False,
        help_text="True if student flagged this question for review in the palette"
    )
    is_correct = models.BooleanField(
        default=False,
        help_text="Server-evaluated correctness (computed at test submission)"
    )
    marks_awarded = models.FloatField(
        default=0.0,
        help_text="Marks awarded after applying test marking scheme and negative penalties"
    )
    time_spent_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Active seconds spent on this question"
    )

    class Meta:
        verbose_name = "Mock Test Answer"
        verbose_name_plural = "Mock Test Answers"
        unique_together = [("attempt", "question")]

    def __str__(self):
        status = "Answered" if self.is_answered else "Unanswered"
        review = " [Review]" if self.is_marked_for_review else ""
        return f"Attempt {self.attempt.id} - Q {self.question.id}: {status}{review}"

