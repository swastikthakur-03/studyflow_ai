import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, colorClass }: StatsCardProps) {
  return (
    <Card className="animate-slide-up">
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-xl shrink-0",
            colorClass || "bg-primary/10 text-primary"
          )}
        >
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}
