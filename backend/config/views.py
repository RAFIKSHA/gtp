from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify backend service status and database connectivity.
    Called by Next.js and deployment platforms (Render, Vercel health checks).
    """
    db_connected = False
    db_engine = "unknown"
    try:
        connection.ensure_connection()
        db_connected = True
        db_engine = connection.vendor  # 'postgresql' or 'sqlite'
    except Exception as e:
        db_engine = str(e)

    payload = {
        "status": "healthy" if db_connected else "degraded",
        "service": "CodexPetra GATE Preparation Portal API",
        "version": "1.0.0",
        "database": {
            "connected": db_connected,
            "engine": db_engine,
        },
        "timestamp": timezone.now().isoformat(),
    }

    response_status = (
        status.HTTP_200_OK
        if db_connected
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return Response(payload, status=response_status)

