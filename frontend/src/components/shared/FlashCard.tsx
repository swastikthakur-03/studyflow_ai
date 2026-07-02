"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  question: string;
  answer: string;
}

export function FlashCard({ question, answer }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={cn("flip-card w-full h-64 cursor-pointer", flipped && "flipped")}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-card text-center shadow-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Question</span>
          <p className="font-medium text-lg leading-snug">{question}</p>
          <span className="text-xs text-muted-foreground mt-4">Click to reveal answer</span>
        </div>
        <div className="flip-card-back flex flex-col items-center justify-center p-6 rounded-2xl border border-primary bg-primary/5 text-center shadow-sm">
          <span className="text-xs uppercase tracking-wide text-primary mb-3">Answer</span>
          <p className="font-medium text-lg leading-snug">{answer}</p>
          <span className="text-xs text-muted-foreground mt-4">Click to flip back</span>
        </div>
      </div>
    </div>
  );
}
