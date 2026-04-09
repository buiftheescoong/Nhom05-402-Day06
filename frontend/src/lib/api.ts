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
    getDocumentFileUrl: (docId: string) =>
      `${API_BASE}/api/student/documents/${docId}/file`,
  },

  // --------------- AI Features ---------------
  summary: {
    generate: (sessionId: string, studentId?: string, documentId?: string, scope = "full", refresh = false) =>
      request<any>(`/api/summary/generate${refresh ? "?refresh=true" : ""}`, {
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
      } = {},
      refresh = false
    ) =>
      request<any>(`/api/quiz/generate${refresh ? "?refresh=true" : ""}`, {
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
    sendStream: async (
      sessionId: string,
      message: string,
      studentId: string | undefined,
      onChunk: (chunk: string) => void
    ) => {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          message,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let finalSources = [];
      let fullContent = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
               try {
                   const data = JSON.parse(line.slice(6));
                   if (data.content !== undefined) {
                       fullContent += data.content;
                       onChunk(fullContent);
                   }
                   if (data.sources) finalSources = data.sources;
               } catch (e) {}
            }
          }
        }
      }
      return { content: fullContent, sources: finalSources };
    },
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
      opts: { studentId?: string; category?: string; userNote?: string } = {}
    ) =>
      request<any>("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          feedback_type: feedbackType,
          student_id: opts.studentId,
          category: opts.category || "",
          user_note: opts.userNote || "",
        }),
      }),
    check: (targetType: string, targetId: string, studentId: string) =>
      request<{
        has_like: boolean;
        has_dislike: boolean;
        has_report: boolean;
        feedback_type: "like" | "dislike" | null;
      }>(
        `/api/feedback/check?target_type=${targetType}&target_id=${targetId}&student_id=${studentId}`
      ),
    stats: (targetType: string, targetId: string) =>
      request<{
        likes: number;
        dislikes: number;
        reports: number;
        total: number;
      }>(`/api/feedback/stats/${targetType}/${targetId}`),
  },
};
