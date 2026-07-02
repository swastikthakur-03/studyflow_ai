"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { GraduationCap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap size={28} />
      </div>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
