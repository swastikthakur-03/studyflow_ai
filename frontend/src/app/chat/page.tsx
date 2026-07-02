"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, FileText, ChevronDown, ChevronUp } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { messages, loading, sendMessage } = useChat();
  const { documents } = useDocuments();
  const [input, setInput] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<number | undefined>(undefined);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input, selectedDoc);
    setInput("");
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Chat with Notes</h1>
            <p className="text-muted-foreground text-sm mt-1">Ask questions, get answers with citations</p>
          </div>

          {documents.length > 0 && (
            <select
              value={selectedDoc ?? ""}
              onChange={(e) => setSelectedDoc(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border border-input rounded-lg px-3 py-2 bg-background"
            >
              <option value="">All documents</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageSquare size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Ask anything about your uploaded notes</p>
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Upload a document first to start chatting
                </p>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <button
                      onClick={() => setExpandedSources(expandedSources === i ? null : i)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <FileText size={12} />
                      {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""}
                      {expandedSources === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {expandedSources === i && (
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((src, j) => (
                          <div key={j} className="text-xs bg-muted/50 rounded-lg p-2">
                            <p className="font-medium text-muted-foreground">Page {src.page_number}</p>
                            <p className="text-muted-foreground/80 mt-0.5">{src.preview}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your notes..."
            disabled={loading || documents.length === 0}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </div>
    </ProtectedLayout>
  );
}
