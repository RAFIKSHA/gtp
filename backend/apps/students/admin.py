from django.contrib import admin
from apps.students.models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "primary_paper",
        "secondary_paper",
        "target_gate_year",
        "prep_level",
        "is_onboarded",
        "created_at",
    )
    list_filter = ("primary_paper", "target_gate_year", "prep_level", "is_onboarded")
    search_fields = ("full_name", "email", "college_name", "user__username")
    readonly_fields = ("id", "created_at", "updated_at")

