import { FileText, Trash2, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document } from "@/types";
import { formatDate, formatFileSize } from "@/lib/utils";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: number) => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  return (
    <Card className="animate-slide-up hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 shrink-0">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" title={document.file_name}>
            {document.file_name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <FileCheck size={12} />
            <span>{document.page_count} pages</span>
            <span>•</span>
            <span>{formatFileSize(document.file_size)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uploaded {formatDate(document.upload_date)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(document.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label={`Delete ${document.file_name}`}
        >
          <Trash2 size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
