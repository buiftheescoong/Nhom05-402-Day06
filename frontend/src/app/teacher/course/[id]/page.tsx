"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  FileText,
  FileIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useTeacherStore } from "@/hooks/useTeacher";
import { api } from "@/lib/api";
import type { Session } from "@/types";

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

export default function TeacherCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const {
    course,
    sessions,
    selectedSessionId,
    documents,
    loading,
    setCourse,
    loadSessions,
    selectSession,
    uploadDocument,
  } = useTeacherStore();

  const [ready, setReady] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!courseId) return;
    api.teacher
      .getCourse(courseId)
      .then((c) => {
        setCourse(c);
        return loadSessions(courseId);
      })
      .finally(() => setReady(true));
  }, [courseId, setCourse, loadSessions]);

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;
    setCreatingSession(true);
    try {
      const session = await api.teacher.createSession(courseId, newSessionTitle.trim());
      setNewSessionTitle("");
      await loadSessions(courseId);
      setExpandedId(session.id);
      selectSession(session.id);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await api.teacher.toggleSession(sessionId);
    await loadSessions(courseId);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Xóa buổi học này? Tất cả tài liệu sẽ bị xóa.")) return;
    await api.teacher.deleteSession(sessionId);
    if (selectedSessionId === sessionId) selectSession(null);
    await loadSessions(courseId);
  };

  const handleSelectSession = (session: Session) => {
    setExpandedId(session.id);
    selectSession(session.id);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedSessionId) return;
    for (const file of Array.from(files)) {
      await uploadDocument(selectedSessionId, file);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    await api.teacher.deleteDocument(docId);
    if (selectedSessionId) {
      const { loadDocuments } = useTeacherStore.getState();
      await loadDocuments(selectedSessionId);
    }
  };

  const copyCode = () => {
    if (course) {
      navigator.clipboard.writeText(course.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải...</p>
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
              onClick={() => router.push("/teacher")}
            >
              <ArrowLeft className="w-3 h-3" />
              Quay lại
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-semibold text-white leading-tight truncate flex-1">
                {course?.name}
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

            {/* Course info bar */}
            <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{course?.student_count || 0} học sinh</span>
              </div>
              <span>·</span>
              <span>{sessions.length} buổi</span>
            </div>

            {/* Join code */}
            <div className="mt-3 bg-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Mã lớp</p>
                <p className="font-mono font-bold text-sm tracking-widest text-blue-400">
                  {course?.join_code}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-600"
                onClick={copyCode}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {/* Add session */}
            <div className="mt-3 flex gap-1.5">
              <Input
                placeholder="Tên buổi mới..."
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
                className="text-xs h-8 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateSession}
                disabled={!newSessionTitle.trim() || creatingSession}
              >
                {creatingSession ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700 mt-2" />

          {/* Sessions list */}
          <ScrollArea className="flex-1 px-2 pb-4">
            <div className="space-y-0.5 mt-2">
              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">
                    Chưa có buổi học nào
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Nhập tên ở trên để tạo buổi đầu tiên
                  </p>
                </div>
              ) : (
                sessions.map((session, idx) => {
                  const isExpanded = expandedId === session.id;
                  const isSelected = selectedSessionId === session.id;

                  return (
                    <div key={session.id}>
                      <button
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                          isSelected
                            ? "bg-slate-700/80 text-white"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        }`}
                        onClick={() => handleSelectSession(session)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate flex-1">
                          {idx + 1}. {session.title}
                        </span>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {session.is_open ? (
                            <Eye className="w-3 h-3 text-green-400" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-slate-600" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-transparent"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </button>

                      {isExpanded && isSelected && documents.length > 0 && (
                        <div className="ml-5 pl-3 border-l border-slate-700 space-y-0.5 py-1">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-700/30 transition-colors group/doc"
                            >
                              {FILE_ICONS[doc.file_type] || (
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="text-[11px] text-slate-300 truncate flex-1">
                                {doc.filename}
                              </span>
                              {STATUS_ICONS[doc.status]}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 opacity-0 group-hover/doc:opacity-100 text-slate-500 hover:text-red-400 hover:bg-transparent"
                                onClick={() => handleDeleteDoc(doc.id)}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                GV
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">Giáo viên</p>
                <p className="text-[10px] text-slate-500">Quản lý lớp</p>
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
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedSession ? (
          <>
            {/* Session header */}
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-stone-800">{selectedSession.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={selectedSession.is_open ? "default" : "secondary"}
                    className="text-[9px] px-1.5 py-0"
                  >
                    {selectedSession.is_open ? "Đang mở" : "Đã đóng"}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    {documents.length} tài liệu
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedSession.is_open ? "outline" : "default"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={async () => {
                    await api.teacher.toggleSession(selectedSession.id);
                    await loadSessions(courseId);
                  }}
                >
                  {selectedSession.is_open ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Đóng buổi
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Mở buổi
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading.upload}
                >
                  {loading.upload ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload tài liệu
                </Button>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.doc"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Document list */}
            <ScrollArea className="flex-1 p-6">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-stone-300" />
                  </div>
                  <p className="text-stone-500 font-medium">Chưa có tài liệu</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Nhấn &quot;Upload tài liệu&quot; để thêm PDF, DOCX hoặc TXT
                  </p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-2">
                  {documents.map((doc, i) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 bg-stone-50 rounded-lg border px-4 py-3 group hover:shadow-sm transition-shadow"
                    >
                      <span className="w-6 h-6 rounded bg-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-500">
                        {i + 1}
                      </span>
                      {FILE_ICONS[doc.file_type] || <FileText className="w-4 h-4 text-stone-400" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700 truncate">{doc.filename}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {STATUS_ICONS[doc.status]}
                          <span className="text-[10px] text-stone-400">
                            {doc.status === "processing"
                              ? "Đang xử lý"
                              : doc.status === "ready"
                              ? "Sẵn sàng"
                              : doc.error_message || "Lỗi"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                        onClick={() => handleDeleteDoc(doc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">
                Quản lý buổi học
              </h2>
              <p className="text-stone-400 text-sm">
                Chọn buổi học từ thanh bên trái hoặc tạo buổi mới để bắt đầu upload tài liệu
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
