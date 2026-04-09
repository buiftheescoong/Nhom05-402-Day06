import { create } from "zustand";
import type {
  Session,
  DocumentSource,
  SummaryData,
  QuizData,
  ChatMessage,
} from "@/types";
import { api } from "@/lib/api";

interface SessionStore {
  session: Session | null;
  documents: DocumentSource[];
  selectedDocId: string | null;
  chatMessages: ChatMessage[];
  summary: SummaryData | null;
  quiz: QuizData | null;
  activePanel: "summary" | "quiz" | null;
  studentId: string | null;
  studentName: string | null;
  loading: {
    documents: boolean;
    summary: boolean;
    quiz: boolean;
    chat: boolean;
  };

  setSession: (s: Session) => void;
  setStudent: (id: string, name: string) => void;
  setSelectedDocId: (docId: string | null) => void;
  loadDocuments: (sessionId: string) => Promise<void>;
  generateSummary: (sessionId: string, docId?: string, refresh?: boolean) => Promise<void>;
  generateQuiz: (sessionId: string, opts?: any, refresh?: boolean) => Promise<void>;
  sendChat: (sessionId: string, message: string) => Promise<void>;
  loadChatHistory: (sessionId: string) => Promise<void>;
  setActivePanel: (panel: "summary" | "quiz" | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  documents: [],
  selectedDocId: null,
  chatMessages: [],
  summary: null,
  quiz: null,
  activePanel: null,
  studentId: null,
  studentName: null,
  loading: {
    documents: false,
    summary: false,
    quiz: false,
    chat: false,
  },

  setSession: (s) => set({ session: s }),

  setStudent: (id, name) => set({ studentId: id, studentName: name }),

  setSelectedDocId: (docId) => set({ selectedDocId: docId }),

  loadDocuments: async (sessionId) => {
    set((s) => ({ loading: { ...s.loading, documents: true } }));
    try {
      const docs = await api.student.getDocuments(sessionId);
      const { selectedDocId } = get();
      const stillExists = docs.some((d: DocumentSource) => d.id === selectedDocId);
      set({
        documents: docs,
        selectedDocId: stillExists ? selectedDocId : (docs[0]?.id ?? null),
      });
    } finally {
      set((s) => ({ loading: { ...s.loading, documents: false } }));
    }
  },

  generateSummary: async (sessionId, docId, refresh = false) => {
    set((s) => ({
      loading: { ...s.loading, summary: true },
      activePanel: "summary",
    }));
    try {
      const { studentId, selectedDocId } = get();
      const effectiveDocId = docId ?? selectedDocId ?? undefined;
      const result = await api.summary.generate(sessionId, studentId || undefined, effectiveDocId);
      set({ summary: result });
    } finally {
      set((s) => ({ loading: { ...s.loading, summary: false } }));
    }
  },

  generateQuiz: async (sessionId, opts, refresh = false) => {
    set((s) => ({
      loading: { ...s.loading, quiz: true },
      activePanel: "quiz",
    }));
    try {
      const { studentId, selectedDocId } = get();
      const result = await api.quiz.generate(sessionId, studentId || undefined, {
        ...opts,
        document_id: opts?.document_id ?? selectedDocId ?? undefined,
      });
      set({ quiz: result });
    } finally {
      set((s) => ({ loading: { ...s.loading, quiz: false } }));
    }
  },

  sendChat: async (sessionId, message) => {
    const { studentId, selectedDocId } = get();
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      sources: [],
      created_at: new Date().toISOString(),
    };
    const aiTempId = `temp-ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiTempId,
      role: "assistant",
      content: "",
      sources: [],
      created_at: new Date().toISOString(),
    };
    
    set((s) => ({
      chatMessages: [...s.chatMessages, userMsg, aiMsg],
      loading: { ...s.loading, chat: true },
    }));
    
    try {
      const finalRes = await api.chat.sendStream(
        sessionId,
        message,
        studentId || undefined,
        selectedDocId || undefined,
        (currentChunk) => {
          set((s) => ({
            chatMessages: s.chatMessages.map((msg) =>
              msg.id === aiTempId ? { ...msg, content: currentChunk } : msg
            ),
          }));
        }
      );
      
      set((s) => ({
        chatMessages: s.chatMessages.map((msg) =>
           msg.id === aiTempId ? { ...msg, sources: finalRes.sources } : msg
        ),
      }));
    } catch (e) {
      set((s) => ({
        chatMessages: s.chatMessages.map((msg) =>
          msg.id === aiTempId ? { ...msg, content: "Đã có lỗi kết nối." } : msg
        ),
      }));
    } finally {
      set((s) => ({ loading: { ...s.loading, chat: false } }));
    }
  },

  loadChatHistory: async (sessionId) => {
    const { studentId } = get();
    try {
      const messages = await api.chat.history(sessionId, studentId || undefined);
      set({ chatMessages: messages });
    } catch {
      set({ chatMessages: [] });
    }
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  reset: () =>
    set({
      session: null,
      documents: [],
      selectedDocId: null,
      chatMessages: [],
      summary: null,
      quiz: null,
      activePanel: null,
    }),
}));
