/**
 * hooks/useDocuments.ts
 * ----------------------
 * Handles PDF upload, listing, and deletion with loading/error states.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Document, DocumentListResponse } from "@/types";
import { toast } from "sonner";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<DocumentListResponse>("/documents");
      setDocuments(data.documents);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function uploadDocument(file: File): Promise<void> {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<Document>(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setDocuments((prev) => [data, ...prev]);

      toast.success(`"${file.name}" uploaded and processed successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id: number): Promise<void> {
    try {
      await api.delete(`/documents/${id}`);

      setDocuments((prev) => prev.filter((d) => d.id !== id));

      toast.success("Document deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}