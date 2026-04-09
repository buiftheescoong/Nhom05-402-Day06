"use client";

import { useRef, useEffect, useState } from "react";
import {
  Bot,
  BookOpen,
  MessageSquare,
  FileText,
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/useSession";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SummaryView } from "@/components/studio/SummaryView";
import { QuizView } from "@/components/studio/QuizView";

type TutorTab = "chat" | "summary" | "quiz";

const TOOL_BUTTONS = [
  { id: "summary" as const, icon: FileText, label: "Tóm tắt", color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { id: "quiz" as const, icon: ClipboardList, label: "Kiểm tra", color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
];

interface AITutorPanelProps {
  sessionId: string;
}

export function AITutorPanel({ sessionId }: AITutorPanelProps) {
  const {
    session,
    chatMessages,
    documents,
    loading,
    sendChat,
    generateSummary,
    generateQuiz,
    activePanel,
    setActivePanel,
    studentName,
  } = useSessionStore();

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TutorTab>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && activeTab === "chat") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    if (activePanel === "summary") setActiveTab("summary");
    else if (activePanel === "quiz") setActiveTab("quiz");
  }, [activePanel]);

  const handleSend = async (message: string) => {
    setActiveTab("chat");
    setActivePanel(null);
    await sendChat(sessionId, message);
  };

  const handleToolAction = async (action: "summary" | "quiz") => {
    if (documents.length === 0) return;
    setActiveTab(action);
    if (action === "summary") {
      await generateSummary(sessionId);
    } else {
      await generateQuiz(sessionId);
    }
  };

  const handleBackToChat = () => {
    setActiveTab("chat");
    setActivePanel(null);
  };

  if (collapsed) {
    return (
      <div className="w-12 border-l bg-slate-900 flex flex-col items-center pt-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="mt-4">
          <Bot className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-[380px] border-l bg-slate-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            AI Tutor
          </h3>
          <p className="text-[10px] text-slate-400">
            {documents.length} tài liệu · Hỏi đáp & học tập
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setCollapsed(true)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tool buttons */}
      <div className="px-3 py-2 flex gap-2 shrink-0 border-b border-slate-800">
        {TOOL_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;
          const isLoading =
            (btn.id === "summary" && loading.summary) ||
            (btn.id === "quiz" && loading.quiz);

          return (
            <button
              key={btn.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? btn.color
                  : "text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800"
              }`}
              onClick={() => handleToolAction(btn.id)}
              disabled={documents.length === 0 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {btn.label}
            </button>
          );
        })}

        {activeTab !== "chat" && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 border border-blue-800 hover:bg-blue-900/50 transition-all ml-auto"
            onClick={handleBackToChat}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
        )}
      </div>

      {/* Content area */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {chatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-base font-semibold text-white">
                Xin chào{studentName ? `, ${studentName}` : ""}!
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 text-center max-w-xs">
                Hỏi AI về nội dung tài liệu, hoặc dùng các công cụ Tóm tắt / Kiểm tra ở trên.
              </p>

              {documents.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5 justify-center max-w-xs">
                  {["Tóm tắt nội dung chính", "Giải thích khái niệm quan trọng", "Cho ví dụ minh họa"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition-colors border border-slate-700"
                        onClick={() => handleSend(suggestion)}
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              )}

              {documents.length === 0 && (
                <div className="mt-5 bg-amber-900/30 border border-amber-800/50 rounded-lg px-3 py-2 max-w-xs">
                  <p className="text-[11px] text-amber-400 text-center">
                    Chưa có tài liệu. Hãy đợi giáo viên upload.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3" ref={scrollRef}>
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {loading.chat && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang suy nghĩ...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-slate-800">
            <ChatInput
              onSend={handleSend}
              disabled={loading.chat || documents.length === 0}
              sourceCount={documents.length}
              dark
            />
          </div>
        </div>
      ) : activeTab === "summary" ? (
        <ScrollArea className="flex-1">
          <div className="bg-white rounded-lg m-2">
            <SummaryView onBack={handleBackToChat} />
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="bg-white rounded-lg m-2">
            <QuizView sessionId={sessionId} onBack={handleBackToChat} />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
