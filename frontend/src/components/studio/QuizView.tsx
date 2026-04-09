"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/useSession";
import { QuizQuestion } from "./QuizQuestion";
import type { QuizEvaluation } from "@/types";

export function QuizView({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack: () => void;
}) {
  const { quiz, loading } = useSessionStore();
  const [results, setResults] = useState<Record<string, QuizEvaluation>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading.quiz) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-stone-500">Đang tạo bài kiểm tra...</p>
        <p className="text-xs text-stone-400 mt-1">AI đang phân tích tài liệu</p>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-stone-400">Không thể tạo quiz.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  const allDone = Object.keys(results).length === quiz.questions.length;
  const totalScore = allDone
    ? Object.values(results).reduce((sum, r) => sum + r.score, 0)
    : 0;
  const avgScore = allDone ? totalScore / quiz.questions.length : 0;

  const handleResult = (questionId: string, evaluation: QuizEvaluation) => {
    setResults((prev) => ({ ...prev, [questionId]: evaluation }));
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-stone-700">Bài kiểm tra</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {Object.keys(results).length}/{quiz.questions.length} câu
        </Badge>
      </div>

      <Separator />

      {allDone && (
        <div className="p-4">
          <div className={`rounded-xl p-4 text-center ${avgScore >= 7 ? "bg-green-50" : avgScore >= 5 ? "bg-amber-50" : "bg-red-50"}`}>
            <Trophy className={`w-8 h-8 mx-auto mb-2 ${avgScore >= 7 ? "text-green-500" : avgScore >= 5 ? "text-amber-500" : "text-red-500"}`} />
            <p className="text-2xl font-bold text-stone-800">{avgScore.toFixed(1)}/10</p>
            <p className="text-sm text-stone-500 mt-1">
              {avgScore >= 7 ? "Xuất sắc! Bạn nắm vững kiến thức" : avgScore >= 5 ? "Khá tốt! Cần ôn thêm một số phần" : "Cần ôn tập lại! Đọc kỹ tài liệu nhé"}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {quiz.questions.map((q, i) => (
          <QuizQuestion
            key={q.id}
            question={q}
            index={i}
            isActive={i === currentIndex}
            result={results[q.id]}
            onResult={(eval_) => {
              handleResult(q.id, eval_);
              if (i < quiz.questions.length - 1) {
                setCurrentIndex(i + 1);
              }
            }}
            onFocus={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
