"use client";

import { useRef, useEffect } from "react";
import { BookOpen, Loader2, Bot } from "lucide-react";
import { useSessionStore } from "@/hooks/useSession";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { session, chatMessages, documents, loading, sendChat, studentName } = useSessionStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async (message: string) => {
    await sendChat(sessionId, message);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-stone-800 truncate">
            AI Tutor {session ? `- ${session.title}` : ""}
          </h3>
          <p className="text-[10px] text-stone-400">
            {documents.length} tài liệu · Hỏi đáp, tóm tắt và tạo quiz
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-lg font-semibold text-stone-800">
              Xin chào{studentName ? `, ${studentName}` : ""}!
            </h1>
            <p className="text-sm text-stone-400 mt-1 text-center max-w-sm">
              Đặt câu hỏi về nội dung buổi học. AI sẽ trả lời dựa trên tài liệu giáo viên đã cung cấp.
            </p>

            {documents.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                {["Tóm tắt nội dung chính", "Giải thích khái niệm quan trọng", "Cho ví dụ minh họa"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      className="text-xs bg-stone-100 hover:bg-blue-50 hover:text-blue-600 text-stone-600 px-3 py-1.5 rounded-full transition-colors"
                      onClick={() => handleSend(suggestion)}
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            )}

            {documents.length === 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-sm">
                <p className="text-xs text-amber-700 text-center">
                  Chưa có tài liệu. Hãy đợi giáo viên upload tài liệu cho buổi học này.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            <div className="max-w-2xl mx-auto space-y-4">
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading.chat && (
                <div className="flex items-center gap-2 text-stone-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang suy nghĩ...
                </div>
              )}
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={loading.chat || documents.length === 0}
          sourceCount={documents.length}
        />
      </div>
    </div>
  );
}
