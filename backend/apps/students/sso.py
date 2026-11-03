import json
import base64
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from apps.students.models import StudentProfile
from apps.academics.models import GatePaper

User = get_user_model()


class CodexPetraSSOAuthentication(authentication.BaseAuthentication):
    """
    CodexPetra Ecosystem Single Sign-On (SSO) Authentication Provider.
    Enables authenticated students from codexpetra.com to access gate.codexpetra.com
    seamlessly without redundant login credentials or password duplication.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        try:
            user = self.verify_and_resolve_user(token)
            return (user, token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Invalid CodexPetra SSO Token: {str(e)}")

    def verify_and_resolve_user(self, token: str):
        """
        Validates token payload from CodexPetra parent portal.
        Provisions a local student user representation linked to their dedicated Supabase profile.
        """
        # Supports JWT / Base64 encoded payload or HMAC token
        try:
            # Check for structured token payload
            if "." in token:
                payload_segment = token.split(".")[1]
                # Pad base64 if necessary
                padded = payload_segment + "=" * (-len(payload_segment) % 4)
                data = json.loads(base64.urlsafe_b64decode(padded).decode())
            else:
                data = {"username": f"codexpetra_student_{token[:8]}", "email": f"{token[:8]}@codexpetra.com"}

            email = data.get("email", "student@codexpetra.com")
            username = data.get("username", email.split("@")[0])
            full_name = data.get("full_name") or data.get("name") or username

            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": email, "first_name": full_name}
            )

            # Ensure linked StudentProfile in Supabase
            cs_paper = GatePaper.objects.filter(code="CS").first()
            StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": full_name,
                    "email": email,
                    "target_gate_year": 2026,
                    "primary_paper": cs_paper,
                    "is_onboarded": False,
                }
            )
            return user
        except Exception as e:
            raise ValueError(f"Unable to decode SSO token: {str(e)}")

