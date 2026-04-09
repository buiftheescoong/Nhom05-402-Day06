"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  sourceCount: number;
  dark?: boolean;
}

export function ChatInput({ onSend, disabled, sourceCount, dark }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`px-3 py-2.5 ${dark ? "" : "border-t bg-white"}`}>
      <div className={`flex items-end gap-2 rounded-xl px-3 py-2 ${
        dark
          ? "bg-slate-800 border border-slate-700"
          : "bg-stone-50 border border-stone-200"
      }`}>
        <textarea
          ref={textareaRef}
          className={`flex-1 bg-transparent text-sm outline-none resize-none min-h-[32px] py-1 ${
            dark
              ? "text-white placeholder:text-slate-500"
              : "placeholder:text-stone-400"
          }`}
          placeholder={sourceCount > 0 ? "Hỏi AI về tài liệu..." : "Đang đợi tài liệu..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <div className="flex items-center gap-1.5 pb-0.5">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 whitespace-nowrap ${
              dark ? "bg-slate-700 text-slate-400 border-0" : ""
            }`}
          >
            {sourceCount} nguồn
          </Badge>
          <Button
            size="icon"
            className="h-7 w-7 rounded-full shrink-0"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
