"use client";

import type { Rule } from "@/types";
import { Button } from "@/components/ui/button";

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

  async function handleDelete(id: string) {
    await fetch(`/api/projects/${projectId}/rules/${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No rules yet. Add one using the editor or upload a .md file.</p>;
  }

  return (
    <div className="space-y-1">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm ${
            selectedId === rule.id ? "bg-accent" : "hover:bg-accent/50"
          }`}
          onClick={() => onSelect(rule)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(rule); }}
            className={`w-3 h-3 rounded-full flex-shrink-0 ${rule.is_active ? "bg-green-500" : "bg-gray-300"}`}
            title={rule.is_active ? "Active — click to disable" : "Inactive — click to enable"}
          />
          <span className="truncate flex-1">{rule.title}</span>
          <span className="text-xs text-muted-foreground">{rule.source}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}
