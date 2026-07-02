"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait one tick for the persisted Zustand store to hydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
      }
      setChecked(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // Avoid flashing protected content before the auth check resolves
  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
