from django.contrib import admin
from apps.questions.models import Question, StudentAttempt, Bookmark


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "question_type",
        "topic",
        "marks",
        "negative_mark",
        "is_pyq",
        "pyq_year",
        "difficulty",
        "created_at",
    )
    list_filter = ("question_type", "marks", "is_pyq", "pyq_year", "difficulty", "topic__subject")
    search_fields = ("statement", "detailed_explanation")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(StudentAttempt)
class StudentAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "question",
        "is_correct",
        "marks_awarded",
        "time_taken_seconds",
        "attempted_at",
    )
    list_filter = ("is_correct", "attempted_at")
    search_fields = ("student__full_name", "question__statement")
    readonly_fields = ("id", "attempted_at")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("student", "question", "created_at")
    search_fields = ("student__full_name",)
    readonly_fields = ("id", "created_at")

