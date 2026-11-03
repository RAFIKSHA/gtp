/**
 * TypeScript Data Contracts for Performance Analytics & Recommendation Engine
 */

export interface AnalyticsOverview {
  total_questions_attempted: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: number;
  negative_marks_incurred: number;
  tests_completed_count: number;
  average_test_score: number | null;
  best_test_score: number | null;
  completed_topics_count: number;
  total_topics_count: number;
  syllabus_progress_percentage: number;
}

export interface SubjectAnalyticsItem {
  subject_id: number;
  subject_name: string;
  slug: string;
  total_topics: number;
  questions_attempted: number;
  correct_count: number;
  net_marks: number;
  accuracy_percentage: number;
  status_tag: "Strong" | "Needs Revision" | "Moderate" | "Developing" | "Unattempted";
}

export interface RecommendationItem {
  topic_id: number;
  topic_name: string;
  subject_name: string;
  subject_slug: string;
  type: "weak_topic" | "pending_concept" | "practice_needed" | "strength";
  priority: "High" | "Medium" | "Low";
  badge: string;
  reason: string;
  attempts: number;
  accuracy: number;
}

export interface TestHistoryItem {
  attempt_id: string;
  test_id: string;
  test_title: string;
  test_type: string;
  score_obtained: number;
  total_marks: number;
  accuracy_percentage: number;
  time_spent_seconds: number;
  completed_at: string | null;
  is_qualified: boolean;
}

export interface AnalyticsDashboardResponse {
  student_name: string;
  target_year: number;
  primary_paper: string;
  overview: AnalyticsOverview;
  subjects: SubjectAnalyticsItem[];
  recommendations: RecommendationItem[];
  test_history: TestHistoryItem[];
}

