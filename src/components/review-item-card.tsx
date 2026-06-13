"use client";

import { useState } from "react";
import type { ReviewItem } from "@/types";
import { SeverityBadge } from "./severity-badge";

export function ReviewItemCard({ item }: { item: ReviewItem }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-start gap-2">
        <SeverityBadge severity={item.severity} />
        <div className="flex-1">
          <p className="font-medium text-sm">{item.title}</p>
          {item.line_start && (
            <p className="text-xs text-muted-foreground">
              Line {item.line_start}{item.line_end && item.line_end !== item.line_start ? `–${item.line_end}` : ""}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{item.description}</p>

      {item.code_snippet && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-red-500">Current Code</p>
          <pre className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-2 rounded overflow-x-auto">
            <code>{item.code_snippet}</code>
          </pre>
        </div>
      )}

      {item.suggested_code && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-600">Suggested Fix</p>
            <button
              onClick={() => copyToClipboard(item.suggested_code!, "code")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedField === "code" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-2 rounded overflow-x-auto">
            <code>{item.suggested_code}</code>
          </pre>
        </div>
      )}

      {item.suggestion && (
        <div className="text-sm">
          <span className="font-medium text-green-600">Suggestion: </span>
          {item.suggestion}
        </div>
      )}

      {item.ai_prompt && (
        <div className="space-y-1 border border-blue-200 dark:border-blue-900 rounded-md p-3 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-600">AI Agent Prompt</p>
            <button
              onClick={() => copyToClipboard(item.ai_prompt!, "prompt")}
              className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {copiedField === "prompt" ? "Copied!" : "Copy Prompt"}
            </button>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{item.ai_prompt}</p>
          <p className="text-xs text-muted-foreground">
            Paste this into Claude Code, Cursor, Codex, or any AI coding agent to apply this fix.
          </p>
        </div>
      )}

      {item.rule_reference && (
        <p className="text-xs text-muted-foreground">Rule: {item.rule_reference}</p>
      )}
    </div>
  );
}
