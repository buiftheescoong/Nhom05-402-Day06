"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useNotebookStore } from "@/hooks/useNotebook";
import { SourcePanel } from "@/components/sources/SourcePanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { StudioPanel } from "@/components/studio/StudioPanel";
import type { Notebook } from "@/types";

export default function NotebookPage() {
  const params = useParams();
  const notebookId = params.id as string;
  const { setNotebook, loadDocuments, loadChatHistory } = useNotebookStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!notebookId) return;
    Promise.all([
      api.notebooks.get(notebookId).then((nb: Notebook) => setNotebook(nb)),
      loadDocuments(notebookId),
      loadChatHistory(notebookId),
    ]).finally(() => setReady(true));
  }, [notebookId, setNotebook, loadDocuments, loadChatHistory]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Đang tải notebook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      <div className="flex-1 flex overflow-hidden">
        <SourcePanel notebookId={notebookId} />
        <ChatPanel notebookId={notebookId} />
        <StudioPanel notebookId={notebookId} />
      </div>
    </div>
  );
}
