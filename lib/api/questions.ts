import { apiClient } from "./client";
import type {
  QuestionListItem,
  EvaluationResult,
  SubjectItem,
  BookmarkItem,
} from "@/types/question";

export interface LearningBranch {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  icon_name: string;
  is_primary?: boolean;
  subjects_count?: number;
  gate_paper_code?: string;
  gate_paper_name?: string;
}

/**
 * Fetch active academic branches, optionally filtered by GATE paper.
 */
export async function fetchLearningBranches(paperCode?: string): Promise<LearningBranch[]> {
  const params: Record<string, string> = {};
  if (paperCode) params.paper_code = paperCode;
  return apiClient<LearningBranch[]>("/api/v1/learning/branches/", {
    params,
    cache: "no-store",
  });
}

/**
 * Fetch all syllabus subjects with nested topics and counts.
 * Supports filtering by paper and/or branch.
 */
export async function fetchSubjects(paper: string = "CS", branch?: string): Promise<SubjectItem[]> {
  const params: Record<string, string> = {};
  if (paper) params.paper = paper;
  if (branch) params.branch = branch;
  return apiClient<SubjectItem[]>("/api/v1/learning/subjects/", {
    params,
    cache: "no-store",
  });
}

/**
 * Fetch single subject details including all concept notes.
 */
export async function fetchSubjectDetail(slug: string): Promise<SubjectItem> {
  return apiClient<SubjectItem>(`/api/v1/academics/subjects/${slug}/`, {
    cache: "no-store",
  });
}

/**
 * Toggle completion check for a syllabus topic.
 */
export async function toggleTopicCompletion(
  topicId: number
): Promise<{ success: boolean; is_completed: boolean }> {
  return apiClient<{ success: boolean; is_completed: boolean }>(
    `/api/v1/academics/topics/${topicId}/toggle-completion/`,
    {
      method: "POST",
    }
  );
}

/**
 * Fetch questions for practice with optional filters.
 */
export async function fetchPracticeQuestions(params: {
  subject?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  is_pyq?: boolean;
  year?: number;
} = {}): Promise<QuestionListItem[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.subject) queryParams.subject = params.subject;
  if (params.topic) queryParams.topic = params.topic;
  if (params.type && params.type !== "ALL") queryParams.type = params.type;
  if (params.difficulty && params.difficulty !== "ALL") queryParams.difficulty = params.difficulty;
  if (params.is_pyq !== undefined) queryParams.is_pyq = params.is_pyq;
  if (params.year) queryParams.year = params.year;

  return apiClient<QuestionListItem[]>("/api/v1/questions/practice/", {
    params: queryParams,
    cache: "no-store",
  });
}

/**
 * Submit student answer to Django for server-side evaluation.
 */
export async function submitQuestionAnswer(
  questionId: string,
  selectedAnswer: unknown,
  timeTakenSeconds: number = 0
): Promise<EvaluationResult> {
  return apiClient<EvaluationResult>(`/api/v1/questions/${questionId}/submit/`, {
    method: "POST",
    body: JSON.stringify({
      selected_answer: selectedAnswer,
      time_taken_seconds: timeTakenSeconds,
    }),
  });
}

/**
 * Toggle bookmark on a question.
 */
export async function toggleQuestionBookmark(
  questionId: string
): Promise<{ success: boolean; is_bookmarked: boolean }> {
  return apiClient<{ success: boolean; is_bookmarked: boolean }>(
    `/api/v1/questions/${questionId}/bookmark/`,
    {
      method: "POST",
    }
  );
}

/**
 * Fetch all bookmarked questions saved by the student.
 */
export async function fetchBookmarkedQuestions(): Promise<BookmarkItem[]> {
  return apiClient<BookmarkItem[]>("/api/v1/questions/bookmarks/", {
    cache: "no-store",
  });
}

