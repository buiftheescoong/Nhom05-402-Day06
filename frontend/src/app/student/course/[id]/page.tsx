"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  FileIcon,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionStore } from "@/hooks/useSession";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { AITutorPanel } from "@/components/tutor/AITutorPanel";
import { api } from "@/lib/api";
import type { Session, DocumentSource } from "@/types";

function getSavedStudent(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("student") || "null");
  } catch {
    return null;
  }
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-400" />,
  docx: <FileIcon className="w-4 h-4 text-blue-400" />,
  txt: <FileText className="w-4 h-4 text-stone-400" />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  processing: <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />,
  ready: <CheckCircle2 className="w-3 h-3 text-green-400" />,
  error: <AlertCircle className="w-3 h-3 text-red-400" />,
};

export default function StudentCourseLMS() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const {
    setSession,
    setStudent,
    loadChatHistory,
    studentName,
  } = useSessionStore();

  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courseName, setCourseName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDocs, setSessionDocs] = useState<Record<string, DocumentSource[]>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const student = getSavedStudent();
    if (!student) {
      router.push("/student");
      return;
    }
    setStudent(student.id, student.name);

    api.student
      .listSessions(student.id, courseId)
      .then((s) => {
        setSessions(s);
        if (s.length > 0) {
          setExpandedId(s[0].id);
          handleSelectSession(s[0], student.id);
        }
      })
      .catch(() => router.push("/student"))
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSelectSession = async (session: Session, studentId?: string) => {
    setSelectedSessionId(session.id);
    setSession(session);

    const sid = studentId || getSavedStudent()?.id;

    if (!sessionDocs[session.id]) {
      try {
        const docs = await api.student.getDocuments(session.id);
        setSessionDocs((prev) => ({ ...prev, [session.id]: docs }));
        useSessionStore.setState({ documents: docs });
      } catch {
        useSessionStore.setState({ documents: [] });
      }
    } else {
      useSessionStore.setState({ documents: sessionDocs[session.id] });
    }

    useSessionStore.setState({ chatMessages: [], summary: null, quiz: null, activePanel: null });
    if (sid) {
      loadChatHistory(session.id);
    }
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedId((prev) => (prev === sessionId ? null : sessionId));
  };

  const totalDocs = sessions.reduce((sum, s) => sum + s.document_count, 0);
  const progress = sessions.length > 0 ? Math.round((sessions.length / (sessions.length + 1)) * 100) : 0;

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải lớp học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-stone-50">
      {/* ===== LEFT SIDEBAR (LMS-style) ===== */}
      {!sidebarCollapsed ? (
        <div className="w-72 bg-slate-800 text-white flex flex-col shrink-0">
          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <button
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
              onClick={() => router.push("/student")}
            >
              <ArrowLeft className="w-3 h-3" />
              Quay lại
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-semibold text-white leading-tight">
                {courseName || "Lớp học"}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="mt-3 mb-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>{sessions.length} buổi đang mở</span>
                <span>{totalDocs} tài liệu</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sessions list */}
          <ScrollArea className="flex-1 px-2 pb-4">
            <div className="space-y-0.5 mt-2">
              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">
                    Chưa có buổi học nào được mở
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Giáo viên sẽ mở khi sẵn sàng
                  </p>
                </div>
              ) : (
                sessions.map((session, idx) => {
                  const isExpanded = expandedId === session.id;
                  const isSelected = selectedSessionId === session.id;
                  const docs = sessionDocs[session.id] || [];

                  return (
                    <div key={session.id}>
                      {/* Session header */}
                      <button
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-slate-700/80 text-white"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        }`}
                        onClick={() => {
                          toggleExpand(session.id);
                          handleSelectSession(session);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate flex-1">
                          {idx + 1}. {session.title}
                        </span>
                        {session.document_count > 0 && (
                          <span className="text-[9px] text-slate-500 shrink-0">
                            {session.document_count}
                          </span>
                        )}
                      </button>

                      {/* Documents inside session */}
                      {isExpanded && (
                        <div className="ml-5 pl-3 border-l border-slate-700 space-y-0.5 py-1">
                          {docs.length === 0 && session.document_count > 0 ? (
                            <div className="flex items-center gap-2 px-2 py-1.5">
                              <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                              <span className="text-[11px] text-slate-500">Đang tải...</span>
                            </div>
                          ) : docs.length === 0 ? (
                            <p className="text-[11px] text-slate-500 px-2 py-1">
                              Chưa có tài liệu
                            </p>
                          ) : (
                            docs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-700/30 transition-colors"
                              >
                                {FILE_ICONS[doc.file_type] || (
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span className="text-[11px] text-slate-300 truncate flex-1">
                                  {doc.filename}
                                </span>
                                {STATUS_ICONS[doc.status]}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Student info footer */}
          <div className="border-t border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                {studentName?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{studentName}</p>
                <p className="text-[10px] text-slate-500">Học sinh</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-12 bg-slate-800 flex flex-col items-center pt-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => setSidebarCollapsed(false)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="mt-4 flex flex-col items-center gap-3">
            {sessions.map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-medium"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CENTER: Document Reader + RIGHT: AI Tutor ===== */}
      {selectedSessionId ? (
        <>
          <DocumentViewer sessionId={selectedSessionId} />
          <AITutorPanel sessionId={selectedSessionId} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-stone-500" />
            </div>
            <h2 className="text-xl font-semibold text-stone-800 mb-2">
              Chào mừng đến lớp học
            </h2>
            <p className="text-stone-400 text-sm">
              Chọn buổi học từ thanh bên trái để đọc tài liệu và sử dụng AI Tutor
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
