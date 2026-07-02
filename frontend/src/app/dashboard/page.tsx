"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ClipboardList, TrendingUp, Layers, Calendar } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import { DashboardStats } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your learning progress at a glance</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Documents"
              value={stats?.total_documents ?? 0}
              icon={FileText}
              colorClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            />
            <StatsCard
              label="Quizzes Taken"
              value={stats?.total_quizzes ?? 0}
              icon={ClipboardList}
              colorClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
            />
            <StatsCard
              label="Average Score"
              value={stats?.average_quiz_score != null ? `${stats.average_quiz_score}%` : "—"}
              icon={TrendingUp}
              colorClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            />
            <StatsCard
              label="Flashcards"
              value={stats?.total_flashcards ?? 0}
              icon={Layers}
              colorClass="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              ) : stats && stats.recent_quizzes.length > 0 ? (
                stats.recent_quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(q.date)}</p>
                    </div>
                    <Badge variant={q.score && q.score >= 70 ? "success" : "warning"}>
                      {q.score != null ? `${q.score}%` : "Pending"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No quizzes yet.{" "}
                  <Link href="/quiz" className="text-primary hover:underline">
                    Generate one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              ) : stats && stats.recent_documents.length > 0 ? (
                stats.recent_documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <FileText size={16} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.upload_date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No documents yet.{" "}
                  <Link href="/documents" className="text-primary hover:underline">
                    Upload one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task summary */}
        {!loading && stats && (stats.pending_tasks > 0 || stats.completed_tasks > 0) && (
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="text-primary" size={24} />
              <div>
                <p className="font-medium">
                  {stats.pending_tasks} pending task{stats.pending_tasks !== 1 ? "s" : ""},{" "}
                  {stats.completed_tasks} completed
                </p>
                <Link href="/planner" className="text-sm text-primary hover:underline">
                  View study planner →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
