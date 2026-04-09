const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

export const api = {
  // --------------- Teacher ---------------
  teacher: {
    createCourse: (name: string) =>
      request<any>("/api/teacher/courses", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    authCourse: (joinCode: string, teacherPin: string) =>
      request<any>("/api/teacher/courses/auth", {
        method: "POST",
        body: JSON.stringify({ join_code: joinCode, teacher_pin: teacherPin }),
      }),
    getCourse: (courseId: string) =>
      request<any>(`/api/teacher/courses/${courseId}`),
    updateCourse: (courseId: string, name: string) =>
      request<any>(`/api/teacher/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
    deleteCourse: (courseId: string) =>
      request<any>(`/api/teacher/courses/${courseId}`, { method: "DELETE" }),

    listSessions: (courseId: string) =>
      request<any[]>(`/api/teacher/courses/${courseId}/sessions`),
    createSession: (courseId: string, title: string, description = "") =>
      request<any>(`/api/teacher/courses/${courseId}/sessions`, {
        method: "POST",
        body: JSON.stringify({ title, description }),
      }),
    updateSession: (sessionId: string, data: { title?: string; description?: string; order?: number }) =>
      request<any>(`/api/teacher/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleSession: (sessionId: string) =>
      request<any>(`/api/teacher/sessions/${sessionId}/toggle`, {
        method: "PUT",
      }),
    deleteSession: (sessionId: string) =>
      request<any>(`/api/teacher/sessions/${sessionId}`, { method: "DELETE" }),

    uploadDocument: async (sessionId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${API_BASE}/api/teacher/sessions/${sessionId}/documents/upload`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    listDocuments: (sessionId: string) =>
      request<any[]>(`/api/teacher/sessions/${sessionId}/documents`),
    deleteDocument: (docId: string) =>
      request<any>(`/api/teacher/documents/${docId}`, { method: "DELETE" }),
  },

  // --------------- Student ---------------
  student: {
    join: (joinCode: string, name: string) =>
      request<any>("/api/student/join", {
        method: "POST",
        body: JSON.stringify({ join_code: joinCode, name }),
      }),
    rejoin: (joinCode: string, name: string) =>
      request<any>("/api/student/rejoin", {
        method: "POST",
        body: JSON.stringify({ join_code: joinCode, name }),
      }),
    get: (studentId: string) =>
      request<any>(`/api/student/${studentId}`),
    listCourses: (studentId: string) =>
      request<any[]>(`/api/student/${studentId}/courses`),
    listSessions: (studentId: string, courseId: string) =>
      request<any[]>(`/api/student/${studentId}/courses/${courseId}/sessions`),
    getDocuments: (sessionId: string) =>
      request<any[]>(`/api/student/sessions/${sessionId}/documents`),
    getDocumentContent: (docId: string) =>
      request<any>(`/api/student/documents/${docId}/content`),
  },

  // --------------- AI Features ---------------
  summary: {
    generate: (sessionId: string, studentId?: string, documentId?: string, scope = "full") =>
      request<any>("/api/summary/generate", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          document_id: documentId,
          scope,
        }),
      }),
  },

  quiz: {
    generate: (
      sessionId: string,
      studentId?: string,
      opts: {
        document_id?: string;
        scope?: string;
        difficulty?: string;
        count?: number;
      } = {}
    ) =>
      request<any>("/api/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          ...opts,
        }),
      }),
    evaluate: (questionId: string, userAnswer: string, studentId?: string) =>
      request<any>("/api/quiz/evaluate", {
        method: "POST",
        body: JSON.stringify({
          question_id: questionId,
          user_answer: userAnswer,
          student_id: studentId,
        }),
      }),
    hint: (questionId: string, currentLevel: number) =>
      request<any>("/api/quiz/hint", {
        method: "POST",
        body: JSON.stringify({
          question_id: questionId,
          current_level: currentLevel,
        }),
      }),
  },

  chat: {
    send: (sessionId: string, message: string, studentId?: string) =>
      request<any>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          message,
        }),
      }),
    history: (sessionId: string, studentId?: string) =>
      request<any[]>(
        `/api/chat/history/${sessionId}${studentId ? `?student_id=${studentId}` : ""}`
      ),
  },

  feedback: {
    submit: (
      targetType: string,
      targetId: string,
      feedbackType: string,
      userNote = ""
    ) =>
      request<any>("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          feedback_type: feedbackType,
          user_note: userNote,
        }),
      }),
  },
};
