"use client";

import { useState, useEffect, useRef } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Flag,
  Check,
  X,
  Loader2,
  Send,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSessionStore } from "@/hooks/useSession";

type FeedbackType = "like" | "dislike" | "report";

const REPORT_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  chat: {
    label: "Phản hồi chat",
    types: [
      "Nội dung không chính xác",
      "Không liên quan tài liệu",
      "Khó hiểu",
      "Thiếu thông tin",
      "Khác",
    ],
  },
  summary: {
    label: "Phản hồi tóm tắt",
    types: [
      "Tóm tắt không chính xác",
      "Thiếu nội dung quan trọng",
      "Quá dài / Quá ngắn",
      "Khó hiểu",
      "Khác",
    ],
  },
  quiz: {
    label: "Phản hồi quiz",
    types: [
      "Câu hỏi không rõ ràng",
      "Đáp án sai",
      "Chấm điểm không chính xác",
      "Không phù hợp độ khó",
      "Khác",
    ],
  },
  quiz_question: {
    label: "Phản hồi câu hỏi",
    types: [
      "Câu hỏi không rõ ràng",
      "Đáp án sai",
      "Chấm điểm không chính xác",
      "Không phù hợp độ khó",
      "Khác",
    ],
  },
};

interface FeedbackWidgetProps {
  targetType: string;
  targetId: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function FeedbackWidget({
  targetType,
  targetId,
  compact = false,
  showLabel = false,
}: FeedbackWidgetProps) {
  const studentId = useSessionStore((s) => s.studentId);

  const [selected, setSelected] = useState<FeedbackType | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studentId || !targetId) return;
    api.feedback
      .check(targetType, targetId, studentId)
      .then((res) => {
        if (res.feedback_type) setSelected(res.feedback_type);
        if (res.has_report) setReportSent(true);
      })
      .catch(() => {});
  }, [targetType, targetId, studentId]);

  useEffect(() => {
    if (!showReport) return;
    const handler = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setShowReport(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReport]);

  const handleLikeDislike = async (type: "like" | "dislike") => {
    const newType = selected === type ? null : type;
    setSelected(newType);
    setThankYou(true);
    setTimeout(() => setThankYou(false), 2000);

    if (newType) {
      api.feedback
        .submit(targetType, targetId, newType, { studentId: studentId || undefined })
        .catch(() => {});
    }
  };

  const handleSubmitReport = async () => {
    if (!reportCategory) return;
    setSubmittingReport(true);
    try {
      await api.feedback.submit(targetType, targetId, "report", {
        studentId: studentId || undefined,
        category: reportCategory,
        userNote: reportNote,
      });
      setReportSent(true);
      setShowReport(false);
      setReportCategory("");
      setReportNote("");
    } catch {
      /* ignore */
    } finally {
      setSubmittingReport(false);
    }
  };

  const categories = REPORT_CATEGORIES[targetType]?.types || REPORT_CATEGORIES.chat.types;

  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const btnSize = compact ? "h-6 w-6" : "h-7 w-7";

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {/* Like */}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnSize} transition-all ${
          selected === "like"
            ? "text-green-500 bg-green-50 hover:bg-green-100 hover:text-green-600"
            : "text-stone-300 hover:text-green-500 hover:bg-green-50"
        }`}
        onClick={() => handleLikeDislike("like")}
        title="Hữu ích"
      >
        <ThumbsUp className={`${iconSize} ${selected === "like" ? "fill-current" : ""}`} />
      </Button>

      {/* Dislike */}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnSize} transition-all ${
          selected === "dislike"
            ? "text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600"
            : "text-stone-300 hover:text-red-500 hover:bg-red-50"
        }`}
        onClick={() => handleLikeDislike("dislike")}
        title="Không hữu ích"
      >
        <ThumbsDown className={`${iconSize} ${selected === "dislike" ? "fill-current" : ""}`} />
      </Button>

      {/* Report */}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnSize} transition-all ${
          reportSent
            ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
            : "text-stone-300 hover:text-amber-500 hover:bg-amber-50"
        }`}
        onClick={() => {
          if (!reportSent) setShowReport(!showReport);
        }}
        title={reportSent ? "Đã báo cáo" : "Báo cáo vấn đề"}
      >
        {reportSent ? (
          <Check className={iconSize} />
        ) : (
          <Flag className={iconSize} />
        )}
      </Button>

      {/* Thank-you toast */}
      {thankYou && (selected === "like" || selected === "dislike") && (
        <span className="text-[10px] text-stone-400 ml-1 animate-in fade-in">
          Cảm ơn!
        </span>
      )}

      {showLabel && !thankYou && !showReport && (
        <span className="text-[10px] text-stone-400 ml-0.5">
          {reportSent ? "Đã báo cáo" : "Phản hồi"}
        </span>
      )}

      {/* Report dropdown */}
      {showReport && (
        <div
          ref={reportRef}
          className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-2 bg-stone-50 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">
              Báo cáo vấn đề
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-stone-400 hover:text-stone-600"
              onClick={() => setShowReport(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <p className="text-[11px] font-medium text-stone-600 mb-1.5">
                Chọn loại vấn đề
              </p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      reportCategory === cat
                        ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                        : "border-stone-200 text-stone-500 hover:border-amber-200 hover:text-amber-600"
                    }`}
                    onClick={() => setReportCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-stone-600 mb-1.5">
                Ghi chú thêm (tùy chọn)
              </p>
              <textarea
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 resize-none outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 placeholder:text-stone-400"
                placeholder="Mô tả vấn đề bạn gặp phải..."
                rows={3}
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setShowReport(false)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 gap-1.5 bg-amber-500 hover:bg-amber-600"
                onClick={handleSubmitReport}
                disabled={!reportCategory || submittingReport}
              >
                {submittingReport ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Gửi báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
