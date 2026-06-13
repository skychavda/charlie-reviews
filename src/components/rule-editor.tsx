"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  projectId: string;
  onSaved: () => void;
  initial?: { id?: string; title: string; content: string };
}

export function RuleEditor({ projectId, onSaved, initial }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    const isEdit = !!initial?.id;
    const url = isEdit
      ? `/api/projects/${projectId}/rules/${initial.id}`
      : `/api/projects/${projectId}/rules`;

    await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, source: "editor" }),
    });

    setSaving(false);
    if (!isEdit) {
      setTitle("");
      setContent("");
    }
    onSaved();
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Rule Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., No console.log in production" />
        </div>

        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your review rule in Markdown..."
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 border border-border/60 rounded-lg bg-background">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*No content*"}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
          <Save data-icon="inline-start" className="size-4" />
          {saving ? "Saving..." : initial?.id ? "Update Rule" : "Add Rule"}
        </Button>
      </CardContent>
    </Card>
  );
}
