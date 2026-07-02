"use client";

import { useEffect, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Trash2, Layers } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { FlashCard } from "@/components/shared/FlashCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/useDocuments";
import { api, getErrorMessage } from "@/lib/api";
import { Flashcard, FlashcardListResponse } from "@/types";
import { toast } from "sonner";

export default function FlashcardsPage() {
  const { documents } = useDocuments();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedDoc, setSelectedDoc] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    setLoading(true);
    try {
      const { data } = await api.get<FlashcardListResponse>("/flashcards");
      setCards(data.flashcards);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedDoc) {
      toast.error("Please select a document first");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post<FlashcardListResponse>("/flashcards/generate", {
        document_id: selectedDoc,
        count,
        topic: topic || "all topics",
      });
      setCards((prev) => [...data.flashcards, ...prev]);
      toast.success(`Generated ${data.flashcards.length} flashcards`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/flashcards/${id}`);
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Flashcard deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function startReview() {
    if (cards.length === 0) {
      toast.error("No flashcards to review yet");
      return;
    }
    setCurrentIndex(0);
    setReviewMode(true);
  }

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground mt-1">Generate and review AI-powered flashcards</p>
          </div>
          {cards.length > 0 && !reviewMode && (
            <Button onClick={startReview} variant="outline">
              <Layers size={16} className="mr-2" /> Review Mode
            </Button>
          )}
        </div>

        {reviewMode ? (
          <div className="space-y-6">
            <FlashCard question={cards[currentIndex].question} answer={cards[currentIndex].answer} />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} className="mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {cards.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.min(cards.length - 1, i + 1))}
                disabled={currentIndex === cards.length - 1}
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setReviewMode(false)}>
              Exit Review
            </Button>
          </div>
        ) : (
          <>
            {/* Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles size={16} /> Generate Flashcards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Document</Label>
                    <select
                      value={selectedDoc}
                      onChange={(e) => setSelectedDoc(e.target.value ? Number(e.target.value) : "")}
                      className="w-full h-10 text-sm border border-input rounded-lg px-3 bg-background"
                    >
                      <option value="">Select a document</option>
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.file_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic (optional)</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Chapter 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of cards</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating..." : "Generate Flashcards"}
                </Button>
              </CardContent>
            </Card>

            {/* Card list */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No flashcards yet. Generate some above to get started.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.question}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">{c.answer}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
