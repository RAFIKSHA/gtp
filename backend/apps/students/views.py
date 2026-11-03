from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.students.models import StudentProfile
from apps.students.serializers import StudentProfileSerializer
from apps.academics.models import GatePaper

User = get_user_model()


def _get_current_student_profile(request) -> StudentProfile:
    """
    Helper to resolve the student profile for the current user.
    In development / pending SSO verification, automatically provides a default student profile.
    """
    if request.user.is_authenticated:
        user = request.user
    else:
        # Dev fallback student identity (pending CodexPetra live SSO handoff)
        user, _ = User.objects.get_or_create(
            username="student_aspirant",
            defaults={
                "email": "student@codexpetra.com",
                "first_name": "Student",
                "last_name": "Aspirant",
            }
        )

    # Ensure student profile exists
    cs_paper = GatePaper.objects.filter(code="CS").first()
    profile, _ = StudentProfile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "target_gate_year": 2026,
            "primary_paper": cs_paper,
            "qualification": "B.Tech / B.E.",
            "academic_year": "3rd Year",
            "prep_level": "Beginner",
            "daily_prep_hours": "2-3 Hours",
            "preferred_learning_method": "Concept First + PYQs",
            "is_onboarded": False,
        }
    )
    return profile


@api_view(["GET"])
@permission_classes([AllowAny])
def get_student_profile(request):
    """
    Retrieves the current student's preparation profile and onboarding state.
    """
    profile = _get_current_student_profile(request)
    serializer = StudentProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_student_onboarding(request):
    """
    Receives and validates student onboarding confirmation / check-in data.
    Saves the information in the dedicated GATE database and marks is_onboarded = True.
    """
    profile = _get_current_student_profile(request)
    serializer = StudentProfileSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        updated_profile = serializer.save(is_onboarded=True)
        return Response(
            {
                "success": True,
                "message": "Student onboarding check-in confirmed successfully.",
                "profile": StudentProfileSerializer(updated_profile).data,
            },
            status=status.HTTP_200_OK
        )

    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST
    )

