from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.students.views import _get_current_student_profile
from apps.analytics.services import AnalyticsEngine


@api_view(["GET"])
@permission_classes([AllowAny])
def analytics_dashboard(request):
    """
    Returns unified performance analytics, subject-wise metrics, and actionable recommendations
    derived directly from verified student submissions in Supabase PostgreSQL.
    """
    student_profile = _get_current_student_profile(request)
    engine = AnalyticsEngine(student_profile)

    payload = {
        "student_name": student_profile.full_name,
        "target_year": student_profile.target_gate_year,
        "primary_paper": student_profile.primary_paper.code if student_profile.primary_paper else "CS",
        "overview": engine.get_overview_metrics(),
        "subjects": engine.get_subject_performance(),
        "recommendations": engine.get_recommendations(),
        "test_history": engine.get_test_history(),
    }

    return Response(payload, status=status.HTTP_200_OK)

