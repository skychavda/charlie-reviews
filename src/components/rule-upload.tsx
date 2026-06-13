"use client";

import { useCallback, useState } from "react";

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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="text-sm text-muted-foreground">
        Drag & drop <code>.md</code> files here to add as rules
      </p>
      <input
        type="file"
        accept=".md"
        multiple
        className="hidden"
        id="rule-upload"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <label htmlFor="rule-upload" className="text-sm text-blue-500 hover:underline cursor-pointer mt-2 inline-block">
        or click to browse
      </label>
    </div>
  );
}
