"use client";

import { useEffect, useState, useCallback, use } from "react";
import { RuleEditor } from "@/components/rule-editor";
import { RuleUpload } from "@/components/rule-upload";
import { RuleList } from "@/components/rule-list";
import type { Rule } from "@/types";

export default function RulesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selected, setSelected] = useState<Rule | null>(null);

  const fetchRules = useCallback(() => {
    fetch(`/api/projects/${projectId}/rules`).then((r) => r.json()).then(setRules);
  }, [projectId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define rules to guide the AI reviewer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Rules ({rules.length})</h3>
          </div>
          <RuleList
            rules={rules}
            selectedId={selected?.id}
            projectId={projectId}
            onSelect={setSelected}
            onRefresh={() => { fetchRules(); setSelected(null); }}
          />
          <div className="border-t border-border/60 pt-5">
            <RuleUpload projectId={projectId} onUploaded={fetchRules} />
          </div>
        </div>

        {/* Right editor */}
        <div>
          <RuleEditor
            key={selected?.id || "new"}
            projectId={projectId}
            onSaved={() => { fetchRules(); setSelected(null); }}
            initial={selected ? { id: selected.id, title: selected.title, content: selected.content } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
