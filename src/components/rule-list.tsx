"use client";

import type { Rule } from "@/types";
import { Trash2, FileText } from "lucide-react";

interface Props {
  rules: Rule[];
  selectedId?: string;
  projectId: string;
  onSelect: (rule: Rule) => void;
  onRefresh: () => void;
}

export function RuleList({ rules, selectedId, projectId, onSelect, onRefresh }: Props) {
  async function toggleActive(rule: Rule) {
    await fetch(`/api/projects/${projectId}/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: rule.is_active ? 0 : 1 }),
    });
    onRefresh();
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/projects/${projectId}/rules/${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">No rules yet. Add one using the editor or upload a .md file.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-200 border ${
            selectedId === rule.id
              ? "bg-primary/10 border-primary/20 shadow-sm"
              : "bg-card border-border/60 hover:bg-accent/50 hover:border-primary/20"
          }`}
          onClick={() => onSelect(rule)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(rule); }}
            className={`size-2.5 rounded-full flex-shrink-0 transition-colors duration-200 ring-2 ring-offset-2 ring-offset-card ${
              rule.is_active
                ? "bg-emerald-500 ring-emerald-500/30"
                : "bg-muted-foreground/30 ring-muted-foreground/10"
            }`}
            title={rule.is_active ? "Active -- click to disable" : "Inactive -- click to enable"}
          />
          <FileText className="size-3.5 text-muted-foreground/60 shrink-0" />
          <span className="font-medium truncate max-w-[180px]">{rule.title}</span>
          <span className="text-[10px] text-muted-foreground/50 shrink-0 uppercase tracking-wider">{rule.source}</span>
          <button
            className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => handleDelete(e, rule.id)}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
