// --------------- LMS ---------------

export interface Course {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  updated_at: string;
  session_count: number;
  student_count: number;
}

export interface CourseTeacher extends Course {
  teacher_pin: string;
}

export interface Session {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  is_open: boolean;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  created_at: string;
}

export interface Enrollment {
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  joined_at: string;
}

// --------------- Content ---------------

export interface DocumentSource {
  id: string;
  session_id: string;
  filename: string;
  file_type: string;
  status: "processing" | "ready" | "error";
  outline: OutlineItem[];
  error_message: string;
  created_at: string;
}

export interface DocumentContent {
  id: string;
  filename: string;
  file_type: string;
  content: string;
  outline: OutlineItem[];
}

export interface OutlineItem {
  level: number;
  title: string;
  page: number;
}

export interface SummaryData {
  id: string;
  content: string;
  key_points: string[];
  confidence: number;
  scope: string;
  created_at: string;
}

export interface QuizData {
  id: string;
  scope: string;
  difficulty: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  difficulty: string;
  bloom_level: string;
  source_ref: string;
}

export interface QuizEvaluation {
  score: number;
  feedback: string;
  model_answer: string;
  hints_used: number;
}

export interface HintData {
  hint: string;
  level: number;
  max_level: number;
  score_penalty: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  created_at: string;
}

export interface ChatSource {
  index: number;
  content: string;
  doc_id: string;
}
