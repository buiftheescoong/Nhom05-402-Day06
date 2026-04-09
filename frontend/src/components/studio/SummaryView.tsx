"use client";

import { ArrowLeft, ThumbsUp, ThumbsDown, ClipboardList, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSessionStore } from "@/hooks/useSession";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";

export function SummaryView({ onBack }: { onBack: () => void }) {
  const { summary, loading, setActivePanel, generateQuiz, session } = useSessionStore();

  if (loading.summary) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-stone-500">Đang tạo tóm tắt...</p>
        <p className="text-xs text-stone-400 mt-1">Có thể mất 5-10 giây</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-stone-400">Không có tóm tắt nào.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  const confidencePct = Math.round(summary.confidence * 100);
  const isLowConfidence = summary.confidence < 0.75;

  const handleFeedback = (type: "like" | "dislike") => {
    api.feedback.submit("summary", summary.id, type).catch(() => {});
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-stone-700">Tóm tắt</span>
        <Badge
          variant={isLowConfidence ? "destructive" : "secondary"}
          className="ml-auto text-[10px]"
        >
          {confidencePct}% tin cậy
        </Badge>
      </div>

      <Separator />

      <div className="p-4 space-y-4">
        {isLowConfidence && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Phần này mình chưa chắc lắm, bạn kiểm tra lại nhé
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Key Points</h3>
          <ul className="space-y-2">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-stone-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Tóm tắt chi tiết</h3>
          <div className="text-sm text-stone-600 prose prose-sm prose-stone max-w-none">
            <ReactMarkdown>{summary.content}</ReactMarkdown>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback("like")}>
              <ThumbsUp className="w-3.5 h-3.5 text-stone-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback("dislike")}>
              <ThumbsDown className="w-3.5 h-3.5 text-stone-400" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => session && generateQuiz(session.id)}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Tạo quiz từ phần này
          </Button>
        </div>
      </div>
    </div>
  );
}
