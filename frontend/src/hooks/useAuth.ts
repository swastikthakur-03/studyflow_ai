/**
 * hooks/useAuth.ts
 * -----------------
 * Wraps auth API calls and the auth store into one convenient hook.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LoginPayload, RegisterPayload, TokenResponse } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const { setAuth, logout: clearAuth, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function login(payload: LoginPayload) {
    setLoading(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/login", payload);
      setAuth(data.access_token, data.refresh_token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signup(payload: RegisterPayload) {
    setLoading(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/register", payload);
      setAuth(data.access_token, data.refresh_token, data.user);
      toast.success(`Welcome to StudyFlow AI, ${data.user.name}!`);
      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuth();
    toast.success("Logged out successfully");
    router.push("/login");
  }

  return { login, signup, logout, user, isAuthenticated, loading };
}
