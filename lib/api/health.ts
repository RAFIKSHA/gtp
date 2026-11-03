import { apiClient } from "./client";
import type { HealthCheckResponse } from "@/types/api";

/**
 * Fetch health status and database connectivity from the Django backend.
 */
export async function getBackendHealth(): Promise<HealthCheckResponse> {
  return apiClient<HealthCheckResponse>("/api/v1/health/", {
    cache: "no-store",
  });
}

