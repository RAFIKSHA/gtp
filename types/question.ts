/**
 * Question and Academics Data Contracts
 */

export type QuestionType = "MCQ" | "MSQ" | "NAT";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface QuestionListItem {
  id: string;
  subject_name: string;
  subject_slug: string;
  topic_name: string;
  topic_slug: string;
  question_type: QuestionType;
  statement: string;
  options: string[] | null;
  marks: number;
  negative_mark: number;
  is_pyq: boolean;
  pyq_year: number | null;
  difficulty: Difficulty;
  is_bookmarked: boolean;
  created_at: string;
}

export interface EvaluationResult {
  success: boolean;
  is_correct: boolean;
  marks_awarded: number;
  correct_answer: any;
  detailed_explanation: string;
  message: string;
  attempt_id: string;
}

export interface TopicItem {
  id: number;
  name: string;
  slug: string;
  order_index: number;
  concept_notes: string;
  is_active: boolean;
  questions_count: number;
  is_completed?: boolean;
}

export interface SubjectItem {
  id: number;
  name: string;
  slug: string;
  order_index: number;
  description: string;
  icon_name: string;
  topics_count: number;
  topics: TopicItem[];
}

export interface BookmarkItem {
  id: string;
  question: QuestionListItem;
  created_at: string;
}

