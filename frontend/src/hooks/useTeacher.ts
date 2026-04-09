import { create } from "zustand";
import type { CourseTeacher, Session, DocumentSource } from "@/types";
import { api } from "@/lib/api";

interface TeacherStore {
  course: CourseTeacher | null;
  sessions: Session[];
  selectedSessionId: string | null;
  documents: DocumentSource[];
  loading: {
    sessions: boolean;
    documents: boolean;
    upload: boolean;
  };

  setCourse: (c: CourseTeacher) => void;
  loadSessions: (courseId: string) => Promise<void>;
  selectSession: (sessionId: string | null) => void;
  loadDocuments: (sessionId: string) => Promise<void>;
  uploadDocument: (sessionId: string, file: File) => Promise<void>;
  reset: () => void;
}

export const useTeacherStore = create<TeacherStore>((set, get) => ({
  course: null,
  sessions: [],
  selectedSessionId: null,
  documents: [],
  loading: {
    sessions: false,
    documents: false,
    upload: false,
  },

  setCourse: (c) => set({ course: c }),

  loadSessions: async (courseId) => {
    set((s) => ({ loading: { ...s.loading, sessions: true } }));
    try {
      const sessions = await api.teacher.listSessions(courseId);
      set({ sessions });
    } finally {
      set((s) => ({ loading: { ...s.loading, sessions: false } }));
    }
  },

  selectSession: (sessionId) => {
    set({ selectedSessionId: sessionId, documents: [] });
    if (sessionId) {
      get().loadDocuments(sessionId);
    }
  },

  loadDocuments: async (sessionId) => {
    set((s) => ({ loading: { ...s.loading, documents: true } }));
    try {
      const docs = await api.teacher.listDocuments(sessionId);
      set({ documents: docs });
    } finally {
      set((s) => ({ loading: { ...s.loading, documents: false } }));
    }
  },

  uploadDocument: async (sessionId, file) => {
    set((s) => ({ loading: { ...s.loading, upload: true } }));
    try {
      await api.teacher.uploadDocument(sessionId, file);
      await get().loadDocuments(sessionId);
    } finally {
      set((s) => ({ loading: { ...s.loading, upload: false } }));
    }
  },

  reset: () =>
    set({
      course: null,
      sessions: [],
      selectedSessionId: null,
      documents: [],
    }),
}));
