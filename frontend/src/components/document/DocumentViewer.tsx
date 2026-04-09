"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  FileIcon,
  BookOpen,
  List,
  Loader2,
  AlertCircle,
  Eye,
  FileCode,
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
  doc: <FileIcon className="w-5 h-5 text-blue-500" />,
  txt: <FileText className="w-5 h-5 text-stone-500" />,
};

interface DocumentViewerProps {
  sessionId: string;
}

type ViewMode = "original" | "text";

export function DocumentViewer({ sessionId }: DocumentViewerProps) {
  const { documents, session, selectedDocId, setSelectedDocId } = useSessionStore();
  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;
  const [docContent, setDocContent] = useState<DocumentContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [docxHtml, setDocxHtml] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDocId(null);
    setDocContent(null);
    setDocxHtml("");
  }, [sessionId, setSelectedDocId]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      const first = documents[0];
      if (first.status === "ready") {
        handleSelectDoc(first);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const loadDocxAsHtml = useCallback(async (docId: string) => {
    try {
      const fileUrl = api.student.getDocumentFileUrl(docId);
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        },
      );
      setDocxHtml(result.value);
    } catch {
      setDocxHtml("");
    }
  }, []);

  const handleSelectDoc = async (doc: DocumentSource) => {
    if (doc.status !== "ready") return;
    setSelectedDocId(doc.id);
    setViewMode("original");
    setDocxHtml("");
    setLoadingContent(true);
    try {
      const content = await api.student.getDocumentContent(doc.id);
      setDocContent(content);

      if (doc.file_type === "docx" || doc.file_type === "doc") {
        await loadDocxAsHtml(doc.id);
      }
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
            Giáo viên chưa upload tài liệu cho buổi học này. Hãy đợi giáo viên
            chuẩn bị nhé.
          </p>
        </div>
      </div>
    );
  }

  const renderOriginalContent = () => {
    if (!selectedDoc || !docContent) return null;

    const fileType = selectedDoc.file_type;

    if (fileType === "pdf") {
      return (
        <iframe
          src={api.student.getDocumentFileUrl(selectedDoc.id)}
          className="flex-1 w-full border-0"
          title={docContent.filename}
        />
      );
    }

    if (fileType === "docx" || fileType === "doc") {
      if (!docxHtml) {
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-stone-400">
                Đang render tài liệu...
              </p>
            </div>
          </div>
        );
      }
      return (
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="mb-4 flex items-center gap-2">
              {FILE_ICONS[fileType]}
              <h2 className="text-lg font-semibold text-stone-800">
                {docContent.filename}
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {fileType.toUpperCase()}
              </Badge>
            </div>
            <Separator className="mb-6" />
            <div
              className="docx-content prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          </div>
        </ScrollArea>
      );
    }

    // TXT and other text-based files
    return (
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="mb-4 flex items-center gap-2">
            {FILE_ICONS[fileType] || <FileText className="w-5 h-5" />}
            <h2 className="text-lg font-semibold text-stone-800">
              {docContent.filename}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {fileType.toUpperCase()}
            </Badge>
          </div>
          <Separator className="mb-6" />
          <pre className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-mono bg-stone-50 rounded-lg p-6 border">
            {docContent.content}
          </pre>
        </div>
      </ScrollArea>
    );
  };

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

        {/* View mode toggle */}
        {selectedDoc && docContent && (
          <div className="flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "original" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setViewMode("original")}
              title="Xem tài liệu gốc"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "text" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setViewMode("text")}
              title="Xem dạng văn bản thuần"
            >
              <FileCode className="w-3.5 h-3.5 text-stone-600" />
            </Button>
          </div>
        )}

        {viewMode === "text" &&
          docContent?.outline &&
          docContent.outline.length > 0 && (
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
              selectedDoc?.id === doc.id
                ? "bg-white shadow-sm text-stone-800 font-medium border border-stone-200"
                : doc.status === "ready"
                  ? "text-stone-500 hover:bg-white/80 hover:text-stone-700"
                  : "text-stone-400 cursor-not-allowed opacity-50"
            }`}
            onClick={() => handleSelectDoc(doc)}
            disabled={doc.status !== "ready"}
          >
            {FILE_ICONS[doc.file_type] || (
              <FileText className="w-3.5 h-3.5" />
            )}
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
        ) : selectedDoc && docContent ? (
          <>
            {viewMode === "original" ? (
              renderOriginalContent()
            ) : (
              <>
                {/* Outline sidebar */}
                {showOutline &&
                  docContent.outline &&
                  docContent.outline.length > 0 && (
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
                              style={{
                                paddingLeft: `${8 + (item.level - 1) * 12}px`,
                              }}
                            >
                              <span className="line-clamp-2">
                                {item.title}
                              </span>
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

                {/* Plain text fallback */}
                <ScrollArea className="flex-1">
                  <div
                    className="max-w-3xl mx-auto px-8 py-6"
                    ref={contentRef}
                  >
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        {FILE_ICONS[docContent.file_type] || (
                          <FileText className="w-5 h-5" />
                        )}
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
                          Nội dung tài liệu đang được xử lý hoặc không khả
                          dụng.
                        </p>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
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

      <style jsx global>{`
        .docx-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #1c1917;
        }
        .docx-content h2 {
          font-size: 1.375rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #292524;
        }
        .docx-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #44403c;
        }
        .docx-content p {
          margin-bottom: 0.5rem;
          line-height: 1.75;
        }
        .docx-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .docx-content th,
        .docx-content td {
          border: 1px solid #d6d3d1;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .docx-content th {
          background-color: #f5f5f4;
          font-weight: 600;
        }
        .docx-content ul,
        .docx-content ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .docx-content li {
          margin-bottom: 0.25rem;
        }
        .docx-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .docx-content strong {
          font-weight: 700;
        }
        .docx-content em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
