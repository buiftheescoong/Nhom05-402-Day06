"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-stone-50">
      <p className="text-stone-400 text-sm">Đang chuyển hướng...</p>
    </div>
  );
}
