"""
URL configuration for CodexPetra GATE Preparation Portal backend.
"""

from django.contrib import admin
from django.urls import path
from config.views import health_check
from apps.academics.views import (
    gate_papers_list,
    subject_list,
    subject_detail,
    toggle_topic_completion,
    learning_branches_list,
)
from apps.students.views import get_student_profile, submit_student_onboarding
from apps.questions.views import (
    practice_questions_list,
    submit_question_answer,
    toggle_bookmark,
    student_bookmarks_list,
)
from apps.mock_tests.views import (
    mock_tests_list,
    mock_test_detail,
    start_mock_test,
    autosave_mock_test_answer,
    submit_mock_test,
    get_mock_test_results,
)
from apps.analytics.views import analytics_dashboard
from apps.administration.views import (
    admin_overview,
    admin_branches_list_create,
    admin_branch_detail,
    admin_branch_toggle_status,
    admin_gate_papers_list,
    admin_branch_gate_mappings_list_create,
    admin_branch_gate_mapping_detail,
    admin_branch_gate_mapping_toggle_primary,
    admin_branch_gate_mapping_toggle_active,
    admin_subjects_list_create,
    admin_subject_detail,
    admin_topics_list_create,
    admin_topic_detail,
    admin_questions_list_create,
    admin_question_detail,
    admin_mock_tests_list_create,
    admin_mock_test_detail,
    admin_assign_test_questions,
    admin_students_list,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # System Health Check
    path("api/v1/health/", health_check, name="health-check"),

    # Academics & Syllabus Endpoints
    path("api/v1/academics/papers/", gate_papers_list, name="gate-papers-list"),
    path("api/v1/academics/subjects/", subject_list, name="subject-list"),
    path("api/v1/academics/subjects/<slug:slug>/", subject_detail, name="subject-detail"),
    path("api/v1/academics/topics/<int:topic_id>/toggle-completion/", toggle_topic_completion, name="toggle-topic-completion"),
    path("api/v1/learning/branches/", learning_branches_list, name="learning-branches-list"),
    path("api/v1/learning/subjects/", subject_list, name="learning-subjects-list"),

    # Student Profile & Onboarding
    path("api/v1/students/profile/", get_student_profile, name="student-profile"),
    path("api/v1/students/onboarding/", submit_student_onboarding, name="student-onboarding"),

    # Questions, Practice & Evaluation
    path("api/v1/questions/practice/", practice_questions_list, name="practice-questions-list"),
    path("api/v1/questions/<uuid:question_id>/submit/", submit_question_answer, name="submit-question-answer"),
    path("api/v1/questions/<uuid:question_id>/bookmark/", toggle_bookmark, name="toggle-bookmark"),
    path("api/v1/questions/bookmarks/", student_bookmarks_list, name="student-bookmarks-list"),

    # Mock Test Series & Examination Engine
    path("api/v1/mock-tests/", mock_tests_list, name="mock-tests-list"),
    path("api/v1/mock-tests/<slug:slug>/", mock_test_detail, name="mock-test-detail"),
    path("api/v1/mock-tests/<uuid:test_id>/start/", start_mock_test, name="start-mock-test"),
    path("api/v1/mock-tests/attempts/<uuid:attempt_id>/autosave/", autosave_mock_test_answer, name="autosave-mock-test-answer"),
    path("api/v1/mock-tests/attempts/<uuid:attempt_id>/submit/", submit_mock_test, name="submit-mock-test"),
    path("api/v1/mock-tests/attempts/<uuid:attempt_id>/results/", get_mock_test_results, name="get-mock-test-results"),

    # Performance Analytics & Recommendations
    path("api/v1/analytics/dashboard/", analytics_dashboard, name="analytics-dashboard"),

    # Administration & Platform Management (Role Protected)
    path("api/v1/admin/overview/", admin_overview, name="admin-overview"),
    path("api/v1/admin/branches/", admin_branches_list_create, name="admin-branches-list-create"),
    path("api/v1/admin/branches/<uuid:branch_id>/", admin_branch_detail, name="admin-branch-detail"),
    path("api/v1/admin/branches/<uuid:branch_id>/toggle-status/", admin_branch_toggle_status, name="admin-branch-toggle-status"),
    path("api/v1/admin/gate-papers/", admin_gate_papers_list, name="admin-gate-papers-list"),
    path("api/v1/admin/branch-gate-mappings/", admin_branch_gate_mappings_list_create, name="admin-branch-gate-mappings-list-create"),
    path("api/v1/admin/branch-gate-mappings/<uuid:mapping_id>/", admin_branch_gate_mapping_detail, name="admin-branch-gate-mapping-detail"),
    path("api/v1/admin/branch-gate-mappings/<uuid:mapping_id>/toggle-primary/", admin_branch_gate_mapping_toggle_primary, name="admin-branch-gate-mapping-toggle-primary"),
    path("api/v1/admin/branch-gate-mappings/<uuid:mapping_id>/toggle-active/", admin_branch_gate_mapping_toggle_active, name="admin-branch-gate-mapping-toggle-active"),
    path("api/v1/admin/subjects/", admin_subjects_list_create, name="admin-subjects-list-create"),
    path("api/v1/admin/subjects/<int:subject_id>/", admin_subject_detail, name="admin-subject-detail"),
    path("api/v1/admin/topics/", admin_topics_list_create, name="admin-topics-list-create"),
    path("api/v1/admin/topics/<int:topic_id>/", admin_topic_detail, name="admin-topic-detail"),
    path("api/v1/admin/questions/", admin_questions_list_create, name="admin-questions-list-create"),
    path("api/v1/admin/questions/<uuid:question_id>/", admin_question_detail, name="admin-question-detail"),
    path("api/v1/admin/mock-tests/", admin_mock_tests_list_create, name="admin-mock-tests-list-create"),
    path("api/v1/admin/mock-tests/<uuid:test_id>/", admin_mock_test_detail, name="admin-mock-test-detail"),
    path("api/v1/admin/mock-tests/<uuid:test_id>/assign-questions/", admin_assign_test_questions, name="admin-assign-test-questions"),
    path("api/v1/admin/students/", admin_students_list, name="admin-students-list"),
]
