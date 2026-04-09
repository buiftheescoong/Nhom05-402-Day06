"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardList,
  ChevronRight,
  Headphones,
  Presentation,
  Brain,
  BarChart3,
  CreditCard,
  Map,
  Table,
  StickyNote,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSessionStore } from "@/hooks/useSession";
import { SummaryView } from "./SummaryView";
import { QuizView } from "./QuizView";

const STUDIO_BUTTONS = [
  { icon: Headphones, label: "Tổng quan bằng âm thanh", enabled: false },
  { icon: Presentation, label: "Bản trình bày", enabled: false },
  { icon: FileText, label: "Tổng quan bằng văn bản", enabled: true, action: "summary" as const },
  { icon: Brain, label: "Bản đồ tư duy", enabled: false },
  { icon: BarChart3, label: "Báo cáo", enabled: false },
  { icon: CreditCard, label: "Thẻ ghi nhớ", enabled: false },
  { icon: ClipboardList, label: "Bài kiểm tra", enabled: true, action: "quiz" as const },
  { icon: Map, label: "Bản đồ thông tin", enabled: false },
  { icon: Table, label: "Bảng dữ liệu", enabled: false },
];

export function StudioPanel({ sessionId }: { sessionId: string }) {
  const { activePanel, setActivePanel, generateSummary, generateQuiz, loading, documents } = useSessionStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleAction = async (action: "summary" | "quiz") => {
    if (documents.length === 0) return;

    if (action === "summary") {
      await generateSummary(sessionId);
    } else {
      await generateQuiz(sessionId);
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 border-l bg-white flex flex-col items-center pt-3">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="h-8 w-8">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-white flex flex-col shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-stone-800 text-sm">Studio</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        {activePanel === null ? (
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {STUDIO_BUTTONS.map((btn, i) => {
                const Icon = btn.icon;
                const isLoading =
                  (btn.action === "summary" && loading.summary) ||
                  (btn.action === "quiz" && loading.quiz);

                return (
                  <button
                    key={i}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                      btn.enabled && documents.length > 0
                        ? "hover:bg-blue-50 hover:border-blue-200 cursor-pointer border-stone-200"
                        : "opacity-40 cursor-not-allowed border-stone-100"
                    }`}
                    disabled={!btn.enabled || documents.length === 0 || isLoading}
                    onClick={() => btn.action && handleAction(btn.action)}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-stone-500" />
                    )}
                    <span className="text-[10px] text-stone-600 leading-tight">{btn.label}</span>
                  </button>
                );
              })}
            </div>

            <Separator className="my-3" />

            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 mb-3">
                <StickyNote className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-xs text-stone-400 max-w-[200px] mx-auto">
                Chọn Tổng quan bằng văn bản hoặc Bài kiểm tra để bắt đầu học tập với AI
              </p>
            </div>
          </div>
        ) : activePanel === "summary" ? (
          <SummaryView onBack={() => setActivePanel(null)} />
        ) : (
          <QuizView sessionId={sessionId} onBack={() => setActivePanel(null)} />
        )}
      </ScrollArea>
    </div>
  );
}
