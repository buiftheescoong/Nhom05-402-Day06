"use client";

import { User, Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const isTempId = message.id.startsWith("temp-");

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-stone-100 text-stone-800 rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm prose-stone max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 rounded-full px-2 py-0.5"
              >
                Nguồn {src.index}
              </span>
            ))}
          </div>
        )}

        {!isUser && !isTempId && (
          <div className="mt-1.5">
            <FeedbackWidget targetType="chat" targetId={message.id} compact />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-stone-600" />
        </div>
      )}
    </div>
  );
}
