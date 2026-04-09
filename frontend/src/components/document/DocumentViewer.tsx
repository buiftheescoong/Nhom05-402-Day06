"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  FileIcon,
  BookOpen,
  List,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/useSession";
import { api } from "@/lib/api";
import type { DocumentSource, DocumentContent } from "@/types";

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  docx: <FileIcon className="w-5 h-5 text-blue-500" />,
  txt: <FileText className="w-5 h-5 text-stone-500" />,
};

interface DocumentViewerProps {
  sessionId: string;
}

export function DocumentViewer({ sessionId }: DocumentViewerProps) {
  const { documents, session } = useSessionStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<DocumentContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDocId(null);
    setDocContent(null);
  }, [sessionId]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      handleSelectDoc(documents[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const handleSelectDoc = async (doc: DocumentSource) => {
    if (doc.status !== "ready") return;
    setSelectedDocId(doc.id);
    setLoadingContent(true);
    try {
      const content = await api.student.getDocumentContent(doc.id);
      setDocContent(content);
    } catch {
      setDocContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700 mb-2">
            Chưa có tài liệu
          </h2>
          <p className="text-stone-400 text-sm">
            Giáo viên chưa upload tài liệu cho buổi học này. Hãy đợi giáo viên chuẩn bị nhé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-stone-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-stone-800 truncate">
            Tài liệu {session ? `- ${session.title}` : ""}
          </h3>
          <p className="text-[10px] text-stone-400">
            {documents.length} tài liệu · Chọn để đọc
          </p>
        </div>
        {docContent?.outline && docContent.outline.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowOutline(!showOutline)}
            title="Mục lục"
          >
            <List className="w-4 h-4 text-stone-500" />
          </Button>
        )}
      </div>

      {/* Document tabs */}
      <div className="px-3 py-2 border-b bg-stone-50/50 flex gap-1 overflow-x-auto shrink-0">
        {documents.map((doc) => (
          <button
            key={doc.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              selectedDocId === doc.id
                ? "bg-white shadow-sm text-stone-800 font-medium border border-stone-200"
                : doc.status === "ready"
                ? "text-stone-500 hover:bg-white/80 hover:text-stone-700"
                : "text-stone-400 cursor-not-allowed opacity-50"
            }`}
            onClick={() => handleSelectDoc(doc)}
            disabled={doc.status !== "ready"}
          >
            {FILE_ICONS[doc.file_type] || <FileText className="w-3.5 h-3.5" />}
            <span className="max-w-[120px] truncate">{doc.filename}</span>
            {doc.status === "processing" && (
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
            )}
            {doc.status === "error" && (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {loadingContent ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-stone-400">Đang tải nội dung...</p>
            </div>
          </div>
        ) : docContent ? (
          <>
            {/* Outline sidebar */}
            {showOutline && docContent.outline && docContent.outline.length > 0 && (
              <div className="w-56 border-r bg-stone-50/50 shrink-0">
                <div className="px-3 py-2 border-b">
                  <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Mục lục
                  </h4>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-0.5">
                    {docContent.outline.map((item, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                        style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
                      >
                        <span className="line-clamp-2">{item.title}</span>
                        {item.page > 0 && (
                          <span className="text-[10px] text-stone-400 ml-1">
                            tr.{item.page}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Main text content */}
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto px-8 py-6" ref={contentRef}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {FILE_ICONS[docContent.file_type] || <FileText className="w-5 h-5" />}
                    <h2 className="text-lg font-semibold text-stone-800">
                      {docContent.filename}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {docContent.file_type.toUpperCase()}
                    </Badge>
                    {docContent.outline.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {docContent.outline.length} mục
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="mb-6" />

                <div className="prose prose-sm prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {docContent.content || (
                    <p className="text-stone-400 italic">
                      Nội dung tài liệu đang được xử lý hoặc không khả dụng.
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm px-8">
              <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-stone-400" />
              </div>
              <p className="text-sm text-stone-500">
                Chọn tài liệu phía trên để bắt đầu đọc
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
