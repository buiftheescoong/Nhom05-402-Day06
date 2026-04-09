"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Enrollment } from "@/types";

function getSavedStudent(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("student");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStudent(id: string, name: string) {
  localStorage.setItem("student", JSON.stringify({ id, name }));
}

export default function StudentPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "join" | "rejoin">("choose");
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const s = getSavedStudent();
    if (s) {
      setSaved(s);
      setName(s.name);
    }
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim() || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const enrollment: Enrollment = await api.student.join(
        joinCode.trim().toUpperCase(),
        name.trim()
      );
      saveStudent(enrollment.student_id, enrollment.student_name);
      router.push(`/student/course/${enrollment.course_id}`);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("Đã tham gia")) {
        setError("Bạn đã tham gia lớp này rồi. Hãy dùng 'Vào lại lớp'.");
      } else {
        setError(msg.includes("không đúng") ? "Mã lớp không đúng" : "Lỗi khi tham gia");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = async () => {
    if (!joinCode.trim() || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const enrollment: Enrollment = await api.student.rejoin(
        joinCode.trim().toUpperCase(),
        name.trim()
      );
      saveStudent(enrollment.student_id, enrollment.student_name);
      router.push(`/student/course/${enrollment.course_id}`);
    } catch (e: any) {
      setError("Không tìm thấy. Kiểm tra lại mã lớp và tên.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Học sinh</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        {mode === "choose" ? (
          <div className="w-full max-w-lg space-y-4">
            <h2 className="text-2xl font-bold text-stone-800 text-center mb-6">
              Tham gia lớp học
            </h2>

            <Card
              className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
              onClick={() => setMode("join")}
            >
              <CardHeader className="flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Tham gia lớp mới</CardTitle>
                  <CardDescription>Nhập mã lớp từ giáo viên để tham gia lần đầu</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => setMode("rejoin")}
            >
              <CardHeader className="flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <LogIn className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Vào lại lớp</CardTitle>
                  <CardDescription>Đã tham gia trước đó? Nhập lại mã lớp và tên</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {mode === "join" ? "Tham gia lớp mới" : "Vào lại lớp"}
              </CardTitle>
              <CardDescription>
                {mode === "join"
                  ? "Nhập mã lớp và tên của bạn"
                  : "Nhập mã lớp và đúng tên bạn đã dùng trước đó"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Mã lớp (6 ký tự)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />
              <Input
                placeholder="Tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (mode === "join" ? handleJoin() : handleRejoin())
                }
              />
              {saved && mode === "rejoin" && (
                <p className="text-xs text-stone-400">
                  Lần trước bạn đăng nhập với tên: <strong>{saved.name}</strong>
                </p>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                  Quay lại
                </Button>
                <Button
                  onClick={mode === "join" ? handleJoin : handleRejoin}
                  disabled={!joinCode.trim() || !name.trim() || loading}
                  className="flex-1"
                >
                  {loading
                    ? "Đang xử lý..."
                    : mode === "join"
                    ? "Tham gia"
                    : "Vào lớp"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
