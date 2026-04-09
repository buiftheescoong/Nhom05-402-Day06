"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, LogIn, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { CourseTeacher } from "@/types";

export default function TeacherPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "login">("choose");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CourseTeacher | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const course = await api.teacher.createCourse(name.trim());
      setCreated(course);
    } catch (e: any) {
      setError(e.message || "Lỗi khi tạo lớp");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!joinCode.trim() || !pin.trim()) return;
    setLoading(true);
    setError("");
    try {
      const course = await api.teacher.authCourse(joinCode.trim().toUpperCase(), pin.trim());
      router.push(`/teacher/course/${course.id}`);
    } catch (e: any) {
      setError("Mã lớp hoặc PIN không đúng");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (created) {
      navigator.clipboard.writeText(created.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <CardTitle className="text-xl">Tạo lớp thành công!</CardTitle>
            <CardDescription>Chia sẻ mã lớp cho học sinh để tham gia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-stone-50 rounded-xl p-4 text-center">
              <p className="text-xs text-stone-400 mb-1">Tên lớp</p>
              <p className="font-semibold text-stone-800">{created.name}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 mb-1">Mã lớp (chia sẻ cho học sinh)</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold tracking-widest text-blue-700">
                  {created.join_code}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-600 mb-1">PIN giáo viên (giữ bí mật)</p>
              <span className="text-2xl font-bold tracking-widest text-amber-700">
                {created.teacher_pin}
              </span>
            </div>
            <p className="text-xs text-stone-400 text-center">
              Lưu lại mã lớp và PIN để đăng nhập lại sau
            </p>
            <Button
              className="w-full"
              onClick={() => router.push(`/teacher/course/${created.id}`)}
            >
              Vào quản lý lớp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Giáo viên</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        {mode === "choose" ? (
          <div className="w-full max-w-lg space-y-4">
            <h2 className="text-2xl font-bold text-stone-800 text-center mb-6">
              Quản lý lớp học
            </h2>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => setMode("create")}
            >
              <CardHeader className="flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Tạo lớp mới</CardTitle>
                  <CardDescription>Tạo lớp học và nhận mã chia sẻ cho học sinh</CardDescription>
                </div>
              </CardHeader>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
              onClick={() => setMode("login")}
            >
              <CardHeader className="flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <LogIn className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Đăng nhập lớp có sẵn</CardTitle>
                  <CardDescription>Nhập mã lớp và PIN để quản lý</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        ) : mode === "create" ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Tạo lớp học mới</CardTitle>
              <CardDescription>Nhập tên lớp để bắt đầu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="VD: Toán 10A1 - HK2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                  Quay lại
                </Button>
                <Button onClick={handleCreate} disabled={!name.trim() || loading} className="flex-1">
                  {loading ? "Đang tạo..." : "Tạo lớp"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Đăng nhập lớp</CardTitle>
              <CardDescription>Nhập mã lớp và PIN giáo viên</CardDescription>
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
                placeholder="PIN giáo viên (6 số)"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                  Quay lại
                </Button>
                <Button
                  onClick={handleLogin}
                  disabled={!joinCode.trim() || !pin.trim() || loading}
                  className="flex-1"
                >
                  {loading ? "Đang xác thực..." : "Đăng nhập"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
