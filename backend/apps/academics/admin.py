from django.contrib import admin
from apps.academics.models import GatePaper, Subject, Topic, TopicProgress


@admin.register(GatePaper)
class GatePaperAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "created_at")
    search_fields = ("code", "name")
    list_filter = ("is_active",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "paper", "order_index", "slug", "created_at")
    list_filter = ("paper",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "order_index", "is_active", "created_at")
    list_filter = ("subject__paper", "subject", "is_active")
    search_fields = ("name", "concept_notes")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(TopicProgress)
class TopicProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "topic", "is_completed", "completed_at", "updated_at")
    list_filter = ("is_completed",)
    search_fields = ("student__full_name", "topic__name")

