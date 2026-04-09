"use client";

import { useState } from "react";
import { FileText, FileIcon, ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSessionStore } from "@/hooks/useSession";

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  docx: <FileIcon className="w-4 h-4 text-blue-500" />,
  txt: <FileText className="w-4 h-4 text-stone-500" />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  processing: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
  ready: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
};

export function SourcePanel({ sessionId }: { sessionId: string }) {
  const { documents } = useSessionStore();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-12 border-r bg-white flex flex-col items-center pt-3">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-r bg-white flex flex-col shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-stone-800 text-sm">Tài liệu buổi học</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {documents.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-6 px-3">
              Chưa có tài liệu nào cho buổi học này.
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-stone-50"
                >
                  {FILE_ICONS[doc.file_type] || <FileText className="w-4 h-4 text-stone-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">{doc.filename}</p>
                    <div className="flex items-center gap-1">
                      {STATUS_ICONS[doc.status]}
                      <span className="text-[10px] text-stone-400">
                        {doc.status === "processing" ? "Đang xử lý" : doc.status === "ready" ? "Sẵn sàng" : "Lỗi"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
