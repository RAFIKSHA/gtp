/**
 * TypeScript Data Contracts for Mock Test Series & Examination System
 */

export type MockTestType = "Full-Length" | "Sectional" | "Subject" | "Topic";

export interface StudentAttemptSummary {
  attempt_id: string;
  status: "in_progress" | "submitted" | "auto_submitted";
  started_at: string;
  completed_at?: string;
  score_obtained: number;
  total_possible_marks: number;
  accuracy_percentage: number;
  attempts_count: number;
}

export interface MockTestItem {
  id: string;
  title: string;
  slug: string;
  paper_code: string;
  paper_name: string;
  test_type: MockTestType;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  passing_marks: number;
  instructions: string;
  is_published: boolean;
  student_attempt: StudentAttemptSummary | null;
  created_at: string;
}

export interface MockTestExamQuestion {
  id: string;
  question_id: string;
  order_index: number;
  section_name: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  statement: string;
  options: string[] | null;
  marks: number;
  negative_mark: number;
  subject_name: string;
  topic_name: string;
  selected_answer: any;
  is_answered: boolean;
  is_marked_for_review: boolean;
}

export interface MockTestStartResponse {
  attempt_id: string;
  test: {
    id: string;
    title: string;
    slug: string;
    duration_minutes: number;
    total_marks: number;
    total_questions: number;
    instructions: string;
  };
  server_time: string;
  started_at: string;
  time_remaining_seconds: number;
  questions: MockTestExamQuestion[];
}

export interface SectionBreakdownItem {
  subject: string;
  total_questions: number;
  attempted: number;
  correct: number;
  marks_awarded: number;
  accuracy: number;
}

export interface MockTestAnswerReview {
  id: string;
  question_id: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  statement: string;
  options: string[] | null;
  correct_answer: any;
  detailed_explanation: string;
  selected_answer: any;
  is_answered: boolean;
  is_marked_for_review: boolean;
  is_correct: boolean;
  marks_awarded: number;
  time_spent_seconds: number;
  subject_name: string;
  topic_name: string;
}

export interface MockTestResultResponse {
  id: string;
  test_title: string;
  test_type: string;
  duration_minutes: number;
  passing_marks: number;
  status: "submitted" | "auto_submitted" | "in_progress";
  started_at: string;
  completed_at: string;
  time_spent_seconds: number;
  score_obtained: number;
  total_possible_marks: number;
  accuracy_percentage: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  section_breakdown: SectionBreakdownItem[];
  answers: MockTestAnswerReview[];
}

