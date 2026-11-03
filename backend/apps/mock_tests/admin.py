from django.contrib import admin
from apps.mock_tests.models import (
    MockTest,
    MockTestQuestion,
    MockTestAttempt,
    MockTestAnswer,
)


class MockTestQuestionInline(admin.TabularInline):
    model = MockTestQuestion
    extra = 1
    raw_id_fields = ("question",)


class MockTestAnswerInline(admin.TabularInline):
    model = MockTestAnswer
    extra = 0
    readonly_fields = ("question", "selected_answer", "is_answered", "is_correct", "marks_awarded")


@admin.register(MockTest)
class MockTestAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "paper",
        "test_type",
        "duration_minutes",
        "total_marks",
        "total_questions",
        "is_published",
        "created_at",
    )
    list_filter = ("paper", "test_type", "is_published")
    search_fields = ("title", "instructions")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [MockTestQuestionInline]


@admin.register(MockTestAttempt)
class MockTestAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "mock_test",
        "status",
        "score_obtained",
        "total_possible_marks",
        "accuracy_percentage",
        "started_at",
        "completed_at",
    )
    list_filter = ("status", "mock_test")
    search_fields = ("student__full_name", "mock_test__title")
    readonly_fields = ("id", "started_at")
    inlines = [MockTestAnswerInline]


@admin.register(MockTestQuestion)
class MockTestQuestionAdmin(admin.ModelAdmin):
    list_display = ("mock_test", "order_index", "section_name", "question", "marks", "negative_mark")
    list_filter = ("mock_test", "section_name")

