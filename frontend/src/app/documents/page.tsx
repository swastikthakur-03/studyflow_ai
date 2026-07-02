"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { UploadZone } from "@/components/shared/UploadZone";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/useDocuments";

export default function DocumentsPage() {
  const { documents, loading, uploading, uploadDocument, deleteDocument } = useDocuments();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteDocument(id);
    setDeletingId(null);
  }

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload your study materials — they&apos;ll be processed for AI chat, quizzes, and flashcards
          </p>
        </div>

        <UploadZone onUpload={uploadDocument} uploading={uploading} />

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={40} className="text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground/70">
                Upload a PDF above to get started with AI-powered studying
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
