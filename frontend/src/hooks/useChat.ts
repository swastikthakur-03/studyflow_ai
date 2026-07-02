/**
 * hooks/useChat.ts
 * -----------------
 * Manages the RAG chat conversation: sending questions,
 * tracking message history, and loading state.
 */

"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { ChatMessage, ChatResponse } from "@/types";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(question: string, documentId?: number) {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await api.post<ChatResponse>("/chat/message", {
        question,
        document_id: documentId,
        conversation_history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(getErrorMessage(error));
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return { messages, loading, sendMessage, clearChat };
}
