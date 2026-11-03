from django.apps import AppConfig


class MockTestsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.mock_tests"
    verbose_name = "GATE Mock Tests & Examinations"

