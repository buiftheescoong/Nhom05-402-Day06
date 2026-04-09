"use client";

import { useState } from "react";
import { Lightbulb, Send, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useSessionStore } from "@/hooks/useSession";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import type { QuizQuestion as QuizQuestionType, QuizEvaluation, HintData } from "@/types";

interface QuizQuestionProps {
  question: QuizQuestionType;
  index: number;
  isActive: boolean;
  result?: QuizEvaluation;
  onResult: (evaluation: QuizEvaluation) => void;
  onFocus: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const BLOOM_LABELS: Record<string, string> = {
  remember: "Nhận biết",
  understand: "Thông hiểu",
  apply: "Vận dụng",
  analyze: "Phân tích",
};

export function QuizQuestion({ question, index, isActive, result, onResult, onFocus }: QuizQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hints, setHints] = useState<HintData[]>([]);
  const [loadingHint, setLoadingHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const studentId = useSessionStore((s) => s.studentId);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const evaluation = await api.quiz.evaluate(question.id, answer, studentId || undefined);
      onResult(evaluation);
    } catch {
      onResult({ score: 0, feedback: "Lỗi khi chấm bài", model_answer: "", hints_used: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const requestHint = async () => {
    setLoadingHint(true);
    try {
      const hint = await api.quiz.hint(question.id, hints.length);
      setHints((prev) => [...prev, hint]);
    } catch {
      /* ignore */
    } finally {
      setLoadingHint(false);
    }
  };

  const scoreColor = result
    ? result.score >= 7
      ? "text-green-600"
      : result.score >= 5
      ? "text-amber-600"
      : "text-red-600"
    : "";

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        isActive ? "border-blue-200 bg-blue-50/30 shadow-sm" : "border-stone-200"
      } ${result ? "bg-stone-50/50" : ""}`}
      onClick={onFocus}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
            {index + 1}
          </span>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {BLOOM_LABELS[question.bloom_level] || question.bloom_level}
            </Badge>
          </div>
        </div>
        {result && (
          <span className={`text-sm font-semibold ${scoreColor}`}>
            {result.score}/10
          </span>
        )}
      </div>

      {/* Question Text */}
      <p className="text-sm text-stone-800 font-medium mb-3">{question.question}</p>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="space-y-2 mb-3">
          {hints.map((hint, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-600 font-medium">Gợi ý cấp {hint.level} · {hint.score_penalty}</p>
                <p className="text-xs text-amber-800 mt-0.5">{hint.hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Area */}
      {!result ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Viết câu trả lời của bạn..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
            disabled={submitting}
          />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={requestHint}
              disabled={hints.length >= 3 || loadingHint}
            >
              {loadingHint ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Lightbulb className="w-3 h-3" />
              )}
              Gợi ý ({hints.length}/3)
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Nộp bài
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* User's answer */}
          <div className="bg-white border rounded-lg p-3">
            <p className="text-[10px] text-stone-400 mb-1">Câu trả lời của bạn</p>
            <p className="text-sm text-stone-700">{answer}</p>
          </div>

          {/* Feedback */}
          <div className={`rounded-lg p-3 ${result.score >= 7 ? "bg-green-50 border-green-200" : result.score >= 5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"} border`}>
            <div className="flex items-center gap-1.5 mb-1">
              {result.score >= 7 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${scoreColor}`}>
                {result.score >= 7 ? "Tốt lắm!" : result.score >= 5 ? "Khá ổn" : "Cần ôn lại"}
              </span>
            </div>
            <p className="text-xs text-stone-600">{result.feedback}</p>
          </div>

          {/* Model Answer Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs w-full"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? "Ẩn đáp án mẫu" : "Xem đáp án mẫu"}
          </Button>

          {showAnswer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[10px] text-blue-500 mb-1">Đáp án mẫu</p>
              <p className="text-xs text-stone-700">{result.model_answer}</p>
            </div>
          )}

          {/* Feedback */}
          <div className="flex justify-end">
            <FeedbackWidget targetType="quiz_question" targetId={question.id} compact />
          </div>
        </div>
      )}
    </div>
  );
}
