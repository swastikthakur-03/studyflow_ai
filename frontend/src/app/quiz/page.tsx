"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, History } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "@/hooks/useDocuments";
import { api, getErrorMessage } from "@/lib/api";
import { Quiz, QuizHistoryItem } from "@/types";
import { formatDate, formatTimer, cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewState = "setup" | "taking" | "results";

export default function QuizPage() {
  const { documents } = useDocuments();
  const [view, setView] = useState<ViewState>("setup");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  // Setup form state
  const [selectedDoc, setSelectedDoc] = useState<number | "">("");
  const [quizType, setQuizType] = useState<"mcq" | "short_answer">("mcq");
  const [count, setCount] = useState(5);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (view !== "taking" || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  async function fetchHistory() {
    try {
      const { data } = await api.get<QuizHistoryItem[]>("/quiz/history");
      setHistory(data);
    } catch {
      // silently ignore — history is non-critical
    }
  }

  async function handleGenerate() {
    if (!selectedDoc) {
      toast.error("Please select a document");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post<Quiz>("/quiz/generate", {
        document_id: selectedDoc,
        quiz_type: quizType,
        count,
      });
      setQuiz(data);
      setAnswers({});
      setTimeLeft(data.total_questions * 60); // 60 seconds per question
      setView("taking");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: quiz.questions.map((q) => ({
          question_id: q.id,
          user_answer: answers[q.id] || "",
        })),
      };
      const { data } = await api.post<Quiz>(`/quiz/${quiz.id}/submit`, payload);
      setQuiz(data);
      setView("results");
      fetchHistory();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function resetToSetup() {
    setView("setup");
    setQuiz(null);
    setAnswers({});
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>

        {view === "setup" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate a Quiz</CardTitle>
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
                    <Label>Quiz Type</Label>
                    <select
                      value={quizType}
                      onChange={(e) => setQuizType(e.target.value as "mcq" | "short_answer")}
                      className="w-full h-10 text-sm border border-input rounded-lg px-3 bg-background"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating Quiz..." : "Start Quiz"}
                </Button>
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History size={16} /> Quiz History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                      </div>
                      <Badge variant={h.score && h.score >= 70 ? "success" : "warning"}>
                        {h.score != null ? `${h.score}%` : "—"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {view === "taking" && quiz && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{quiz.title}</h2>
              <Badge variant={timeLeft < 30 ? "destructive" : "secondary"} className="flex items-center gap-1">
                <Clock size={12} /> {formatTimer(timeLeft)}
              </Badge>
            </div>

            {quiz.questions.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="p-5 space-y-3">
                  <p className="font-medium">
                    {idx + 1}. {q.question_text}
                  </p>
                  {q.options ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm",
                            answers[q.id] === opt
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                            className="accent-primary"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder="Type your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        )}

        {view === "results" && quiz && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                <p className="text-5xl font-bold text-primary">{quiz.score}%</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {quiz.questions.filter((q) => q.is_correct === 1).length} / {quiz.total_questions} correct
                </p>
              </CardContent>
            </Card>

            {quiz.questions.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start gap-2">
                    {q.is_correct === 1 ? (
                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {idx + 1}. {q.question_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your answer: {q.user_answer || "Not answered"}
                      </p>
                      {q.is_correct !== 1 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Correct answer: {q.correct_answer}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={resetToSetup} className="w-full">
              Take Another Quiz
            </Button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
