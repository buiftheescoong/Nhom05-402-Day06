import { create } from "zustand";
import type {
  Notebook,
  DocumentSource,
  SummaryData,
  QuizData,
  ChatMessage,
} from "@/types";
import { api } from "@/lib/api";

interface NotebookStore {
  notebook: Notebook | null;
  documents: DocumentSource[];
  chatMessages: ChatMessage[];
  summary: SummaryData | null;
  quiz: QuizData | null;
  activePanel: "summary" | "quiz" | null;
  loading: {
    documents: boolean;
    summary: boolean;
    quiz: boolean;
    chat: boolean;
    upload: boolean;
  };

  setNotebook: (nb: Notebook) => void;
  loadDocuments: (notebookId: string) => Promise<void>;
  uploadDocument: (notebookId: string, file: File) => Promise<void>;
  deleteDocument: (docId: string, notebookId: string) => Promise<void>;
  generateSummary: (notebookId: string, docId?: string) => Promise<void>;
  generateQuiz: (notebookId: string, opts?: any) => Promise<void>;
  sendChat: (notebookId: string, message: string) => Promise<void>;
  loadChatHistory: (notebookId: string) => Promise<void>;
  setActivePanel: (panel: "summary" | "quiz" | null) => void;
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  notebook: null,
  documents: [],
  chatMessages: [],
  summary: null,
  quiz: null,
  activePanel: null,
  loading: {
    documents: false,
    summary: false,
    quiz: false,
    chat: false,
    upload: false,
  },

  setNotebook: (nb) => set({ notebook: nb }),

  loadDocuments: async (notebookId) => {
    set((s) => ({ loading: { ...s.loading, documents: true } }));
    try {
      const docs = await api.documents.list(notebookId);
      set({ documents: docs });
    } finally {
      set((s) => ({ loading: { ...s.loading, documents: false } }));
    }
  },

  uploadDocument: async (notebookId, file) => {
    set((s) => ({ loading: { ...s.loading, upload: true } }));
    try {
      await api.documents.upload(notebookId, file);
      await get().loadDocuments(notebookId);
    } finally {
      set((s) => ({ loading: { ...s.loading, upload: false } }));
    }
  },

  deleteDocument: async (docId, notebookId) => {
    await api.documents.delete(docId);
    await get().loadDocuments(notebookId);
  },

  generateSummary: async (notebookId, docId) => {
    set((s) => ({
      loading: { ...s.loading, summary: true },
      activePanel: "summary",
    }));
    try {
      const result = await api.summary.generate(notebookId, docId);
      set({ summary: result });
    } finally {
      set((s) => ({ loading: { ...s.loading, summary: false } }));
    }
  },

  generateQuiz: async (notebookId, opts) => {
    set((s) => ({
      loading: { ...s.loading, quiz: true },
      activePanel: "quiz",
    }));
    try {
      const result = await api.quiz.generate(notebookId, opts);
      set({ quiz: result });
    } finally {
      set((s) => ({ loading: { ...s.loading, quiz: false } }));
    }
  },

  sendChat: async (notebookId, message) => {
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      sources: [],
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      chatMessages: [...s.chatMessages, userMsg],
      loading: { ...s.loading, chat: true },
    }));
    try {
      const aiMsg = await api.chat.send(notebookId, message);
      set((s) => ({
        chatMessages: [...s.chatMessages, aiMsg],
      }));
    } finally {
      set((s) => ({ loading: { ...s.loading, chat: false } }));
    }
  },

  loadChatHistory: async (notebookId) => {
    try {
      const messages = await api.chat.history(notebookId);
      set({ chatMessages: messages });
    } catch {
      set({ chatMessages: [] });
    }
  },

  setActivePanel: (panel) => set({ activePanel: panel }),
}));
