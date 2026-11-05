from django.contrib import admin
from apps.academics.models import GatePaper, Branch, BranchGatePaper, Subject, Topic, TopicProgress


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "gate_paper", "display_order", "is_active", "is_published", "created_at")
    list_filter = ("is_active", "is_published", "gate_paper")
    search_fields = ("code", "name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BranchGatePaper)
class BranchGatePaperAdmin(admin.ModelAdmin):
    list_display = ("branch", "gate_paper", "is_primary", "is_active", "created_at")
    list_filter = ("is_primary", "is_active", "gate_paper", "branch")
    search_fields = ("branch__name", "branch__code", "gate_paper__name", "gate_paper__code")




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

