"use client";

import { useState } from "react";
import type { ReviewItem } from "@/types";
import { SeverityBadge } from "./severity-badge";
import { Copy, Check, Sparkles, BookOpen } from "lucide-react";

export function ReviewItemCard({ item }: { item: ReviewItem }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <SeverityBadge severity={item.severity} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{item.title}</p>
          {item.line_start && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Line {item.line_start}{item.line_end && item.line_end !== item.line_start ? `--${item.line_end}` : ""}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>

      {item.code_snippet && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-red-500 dark:text-red-400">Current Code</p>
          <pre className="text-xs bg-red-500/5 border border-red-500/15 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
            <code>{item.code_snippet}</code>
          </pre>
        </div>
      )}

      {item.suggested_code && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Suggested Fix</p>
            <button
              onClick={() => copyToClipboard(item.suggested_code!, "code")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedField === "code" ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copiedField === "code" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-xs bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
            <code>{item.suggested_code}</code>
          </pre>
        </div>
      )}

      {item.suggestion && (
        <div className="text-sm leading-relaxed">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Suggestion: </span>
          {item.suggestion}
        </div>
      )}

      {item.ai_prompt && (
        <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <p className="text-xs font-medium text-primary">AI Agent Prompt</p>
            </div>
            <button
              onClick={() => copyToClipboard(item.ai_prompt!, "prompt")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {copiedField === "prompt" ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copiedField === "prompt" ? "Copied" : "Copy Prompt"}
            </button>
          </div>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{item.ai_prompt}</p>
          <p className="text-xs text-muted-foreground">
            Paste this into Claude Code, Cursor, Codex, or any AI coding agent to apply this fix.
          </p>
        </div>
      )}

      {item.rule_reference && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          Rule: {item.rule_reference}
        </div>
      )}
    </div>
  );
}
