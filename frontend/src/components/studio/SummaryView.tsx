"use client";

import { ArrowLeft, ClipboardList, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSessionStore } from "@/hooks/useSession";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export function SummaryView({ onBack }: { onBack: () => void }) {
  const { summary, loading, generateSummary, generateQuiz, session } = useSessionStore();

  const handleRefresh = async () => {
    if (!session) return;
    await generateSummary(session.id, summary?.document_id || undefined, true);
  };

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

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-stone-700">Tóm tắt</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-stone-400 hover:text-blue-500"
                onClick={handleRefresh}
                disabled={loading.summary}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading.summary ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-[10px]">Tải lại tóm tắt mới (gọi AI)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <FeedbackWidget targetType="summary" targetId={summary.id} compact />
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5 text-stone-500 hover:text-blue-600"
                onClick={handleRefresh}
                disabled={loading.summary}
              >
                <RefreshCw className={`w-3 h-3 ${loading.summary ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 border-dashed border-stone-300 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50"
            onClick={() => session && generateQuiz(session.id)}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Tạo bộ câu hỏi luyện tập từ tóm tắt này
          </Button>
        </div>
      </div>
    </div>
  );
}
