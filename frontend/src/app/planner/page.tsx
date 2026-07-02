"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar as CalendarIcon, Plus } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { TaskCard } from "@/components/shared/TaskCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getErrorMessage } from "@/lib/api";
import { Task } from "@/types";
import { toast } from "sonner";

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // AI generator form
  const [subjects, setSubjects] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dailyHours, setDailyHours] = useState(3);

  // Manual task form
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualDeadline, setManualDeadline] = useState("");
  const [manualDuration, setManualDuration] = useState(1);
  const [manualPriority, setManualPriority] = useState("medium");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const { data } = await api.get<Task[]>("/planner/tasks");
      setTasks(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSchedule() {
    if (!subjects.trim() || !deadline) {
      toast.error("Please enter subjects and a deadline");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post<Task[]>("/planner/generate", {
        subjects: subjects.split(",").map((s) => s.trim()),
        deadline: new Date(deadline).toISOString(),
        daily_hours: dailyHours,
      });
      setTasks((prev) => [...data, ...prev]);
      toast.success(`Generated ${data.length} study tasks`);
      setSubjects("");
      setDeadline("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddManualTask() {
    if (!manualTitle.trim() || !manualSubject.trim() || !manualDeadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const { data } = await api.post<Task>("/planner/tasks", {
        title: manualTitle,
        subject: manualSubject,
        priority: manualPriority,
        deadline: new Date(manualDeadline).toISOString(),
        duration: manualDuration,
      });
      setTasks((prev) => [data, ...prev]);
      toast.success("Task added");
      setManualTitle("");
      setManualSubject("");
      setManualDeadline("");
      setShowManualForm(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleToggleStatus(id: number, status: string) {
    try {
      const { data } = await api.patch<Task>(`/planner/tasks/${id}`, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/planner/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated schedules and task tracking for your studies
          </p>
        </div>

        {/* AI Schedule Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={16} /> Generate a Study Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Subjects (comma-separated)</Label>
                <Input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Biology, Chemistry, Math"
                />
              </div>
              <div className="space-y-2">
                <Label>Daily hours</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <Button onClick={handleGenerateSchedule} disabled={generating}>
              {generating ? "Generating Schedule..." : "Generate Schedule"}
            </Button>
          </CardContent>
        </Card>

        {/* Manual task add */}
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowManualForm((s) => !s)}>
            <Plus size={14} className="mr-1" /> Add Task Manually
          </Button>

          {showManualForm && (
            <Card className="mt-3">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Task title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Subject"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    type="datetime-local"
                    value={manualDeadline}
                    onChange={(e) => setManualDeadline(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Hours"
                    min={0.5}
                    step={0.5}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                  />
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value)}
                    className="h-10 text-sm border border-input rounded-lg px-3 bg-background"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <Button onClick={handleAddManualTask} size="sm">
                  Add Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon size={36} className="text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No tasks yet. Generate a schedule above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Pending ({pendingTasks.length})
                </h2>
                <div className="space-y-2">
                  {pendingTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Completed ({completedTasks.length})
                </h2>
                <div className="space-y-2">
                  {completedTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
