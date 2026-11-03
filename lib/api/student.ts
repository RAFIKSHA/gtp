import { apiClient } from "./client";
import type { GatePaper, StudentProfile, OnboardingResponse } from "@/types/student";

/**
 * Fetch list of all active GATE examination papers and their allowed combinations.
 */
export async function fetchGatePapers(): Promise<GatePaper[]> {
  return apiClient<GatePaper[]>("/api/v1/academics/papers/", {
    cache: "no-store",
  });
}

/**
 * Fetch the current student's preparation profile and onboarding state.
 */
export async function fetchStudentProfile(): Promise<StudentProfile> {
  return apiClient<StudentProfile>("/api/v1/students/profile/", {
    cache: "no-store",
  });
}

/**
 * Submit onboarding confirmation / check-in data to the Django backend.
 */
export async function submitStudentOnboarding(
  payload: Partial<StudentProfile>
): Promise<OnboardingResponse> {
  return apiClient<OnboardingResponse>("/api/v1/students/onboarding/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

