import { Clock, CheckCircle2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { formatDate, priorityColor, cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}

export function TaskCard({ task, onToggleStatus, onDelete }: TaskCardProps) {
  const isDone = task.status === "done";
  const isMissed = task.status === "missed";

  return (
    <Card className={cn(isDone && "opacity-60")}>
      <CardContent className="p-4 flex items-center gap-3">
        <button
          onClick={() => onToggleStatus(task.id, isDone ? "pending" : "done")}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            isDone ? "bg-primary border-primary" : "border-muted-foreground/40"
          )}
        >
          {isDone && <CheckCircle2 size={14} className="text-primary-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm", isDone && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{task.subject}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {task.duration}h
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatDate(task.deadline)}</span>
          </div>
        </div>

        <Badge className={priorityColor(task.priority)}>{task.priority}</Badge>
        {isMissed && <Badge variant="destructive">Missed</Badge>}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </Button>
      </CardContent>
    </Card>
  );
}
