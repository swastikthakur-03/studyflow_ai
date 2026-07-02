// ── Auth ─────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// ── Documents ────────────────────────────────────────────────

export interface Document {
  id: number;
  user_id: number;
  file_name: string;
  file_size: number;
  page_count: number;
  upload_date: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

// ── Chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  timestamp?: string;
}

export interface SourceCitation {
  document_id: number;
  page_number: number;
  preview: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  has_context: boolean;
}

// ── Flashcards ───────────────────────────────────────────────

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  topic: string | null;
  created_at: string;
}

export interface FlashcardListResponse {
  flashcards: Flashcard[];
  total: number;
}

// ── Quiz ─────────────────────────────────────────────────────

export type QuizType = "mcq" | "short_answer";

export interface QuizQuestion {
  id: number;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  user_answer: string | null;
  is_correct: number | null;
}

export interface Quiz {
  id: number;
  title: string;
  quiz_type: QuizType;
  score: number | null;
  total_questions: number;
  date: string;
  questions: QuizQuestion[];
}

export interface QuizHistoryItem {
  id: number;
  title: string;
  quiz_type: QuizType;
  score: number | null;
  total_questions: number;
  date: string;
}

// ── Revision ─────────────────────────────────────────────────

export type RevisionType = "summary" | "formulas" | "key_concepts" | "exam_notes";

export interface RevisionResponse {
  revision_type: RevisionType;
  content: string;
  document_name: string;
}

// ── Planner ──────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "done" | "missed";

export interface Task {
  id: number;
  title: string;
  subject: string;
  priority: Priority;
  deadline: string;
  duration: number;
  status: TaskStatus;
  created_at: string;
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  total_documents: number;
  total_quizzes: number;
  average_quiz_score: number | null;
  total_flashcards: number;
  pending_tasks: number;
  completed_tasks: number;
  recent_quizzes: { id: number; title: string; score: number | null; date: string }[];
  recent_documents: { id: number; file_name: string; upload_date: string }[];
}

// ── API Error ────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}
