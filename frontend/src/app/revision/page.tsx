"use client";

import { useState } from "react";
import { BookOpen, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useDocuments } from "@/hooks/useDocuments";
import { api, getErrorMessage } from "@/lib/api";
import { RevisionResponse, RevisionType } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REVISION_TABS: { value: RevisionType; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "formulas", label: "Formulas" },
  { value: "key_concepts", label: "Key Concepts" },
  { value: "exam_notes", label: "Exam Notes" },
];

export default function RevisionPage() {
  const { documents } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<RevisionType>("summary");
  const [content, setContent] = useState<RevisionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(type: RevisionType) {
    if (!selectedDoc) {
      toast.error("Please select a document first");
      return;
    }
    setActiveTab(type);
    setLoading(true);
    try {
      const { data } = await api.post<RevisionResponse>("/revision/generate", {
        document_id: selectedDoc,
        revision_type: type,
      });
      setContent(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!content) return;
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Revision Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Generate exam-ready summaries, formulas, and key concepts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex flex-wrap gap-2">
              {REVISION_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => generate(tab.value)}
                  disabled={loading}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Generating {REVISION_TABS.find((t) => t.value === activeTab)?.label.toLowerCase()}...
            </CardContent>
          </Card>
        )}

        {!loading && content && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {REVISION_TABS.find((t) => t.value === content.revision_type)?.label} —{" "}
                {content.document_name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{content.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !content && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={36} className="text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              Select a document and revision type above to get started
            </p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
