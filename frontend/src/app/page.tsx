"use client";

import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">AI Tutor</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-800 mb-3">
              Chào mừng đến với AI Tutor
            </h2>
            <p className="text-stone-500 text-lg">
              Nền tảng học tập thông minh - tóm tắt tài liệu, tạo quiz và hỏi đáp với AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
              onClick={() => router.push("/teacher")}
            >
              <CardHeader className="items-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-center">Giáo viên</CardTitle>
                <CardDescription className="text-center mt-2">
                  Tạo lớp học, quản lý buổi học và upload tài liệu cho học sinh
                </CardDescription>
                <Button variant="outline" className="mt-4">
                  Vào trang giáo viên
                </Button>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-green-300 transition-all group"
              onClick={() => router.push("/student")}
            >
              <CardHeader className="items-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-center">Học sinh</CardTitle>
                <CardDescription className="text-center mt-2">
                  Tham gia lớp học, xem tài liệu và học tập cùng AI
                </CardDescription>
                <Button variant="outline" className="mt-4">
                  Vào trang học sinh
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
