"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  projectId: string;
  onUploaded: () => void;
}

export function RuleUpload({ projectId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (!file.name.endsWith(".md")) continue;
        const content = await file.text();
        const title = file.name.replace(/\.md$/, "");
        await fetch(`/api/projects/${projectId}/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, source: "upload" }),
        });
      }
      onUploaded();
    },
    [projectId, onUploaded]
  );

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:border-primary/30 hover:bg-accent/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="size-5 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        Drag & drop <code className="bg-accent px-1 py-0.5 rounded text-xs">.md</code> files here
      </p>
      <input
        type="file"
        accept=".md"
        multiple
        className="hidden"
        id="rule-upload"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <label htmlFor="rule-upload" className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer mt-2 inline-block transition-colors">
        or click to browse
      </label>
    </div>
  );
}
