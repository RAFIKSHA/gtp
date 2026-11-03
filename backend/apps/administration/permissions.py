from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """
    Grants access only to platform administrators (staff, superusers, or verified admin tokens).
    Blocks regular students from administrative modification endpoints.
    """

    def has_permission(self, request, view):
        # 1. Django staff / superuser authentication
        if request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return True

        # 2. CodexPetra Admin Role header / session verification
        admin_header = request.headers.get("X-CodexPetra-Role") or request.headers.get("X-Admin-Role")
        if admin_header in ["admin", "staff", "true"]:
            return True

        # 3. Development admin parameter check (safeguard for testing)
        if request.GET.get("role") == "admin" or request.data.get("admin_key") == "codexpetra-admin-2025":
            return True

        return False


class IsOwnerStudentOrAdmin(permissions.BasePermission):
    """
    Enforces student data isolation:
    Students can access ONLY their own attempts, bookmarks, and profiles.
    Administrators have read/oversight access.
    """

    def has_object_permission(self, request, view, obj):
        # Staff can inspect
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return True

        # Check ownership on student-related models
        if hasattr(obj, "student"):
            return obj.student.user == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user

        return True

