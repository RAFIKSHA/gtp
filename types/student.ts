/**
 * Student and Academics TypeScript Data Contracts
 */

export interface GatePaper {
  code: string;
  name: string;
  is_active: boolean;
  allowed_secondary_papers: string[];
}

export type PrepLevel = "Beginner" | "Intermediate" | "Advanced";

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  qualification: string;
  academic_year: string;
  college_name: string;
  graduation_year: number | null;
  target_gate_year: number;
  enrolled_branch?: string | null;
  enrolled_branch_name?: string | null;
  enrolled_branch_code?: string | null;
  primary_paper: string | null;
  secondary_paper: string | null;
  primary_paper_details?: GatePaper | null;
  secondary_paper_details?: GatePaper | null;
  previous_attempt_score: number | null;
  prep_level: PrepLevel;
  daily_prep_hours: string;
  preferred_learning_method: string;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  profile: StudentProfile;
}

