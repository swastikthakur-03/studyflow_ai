"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        uploading && "opacity-60 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {uploading ? (
          <>
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm font-medium">Uploading and processing PDF...</p>
            <p className="text-xs text-muted-foreground">
              Extracting text, generating embeddings — this may take a moment
            </p>
          </>
        ) : (
          <>
            <UploadCloud size={32} className="text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop your PDF here" : "Drag & drop a PDF, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">PDF files only, max 50MB</p>
          </>
        )}
      </div>
    </div>
  );
}
