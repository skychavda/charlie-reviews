"use client";

import { useEffect, useState, useCallback, use } from "react";
import { RuleEditor } from "@/components/rule-editor";
import { RuleUpload } from "@/components/rule-upload";
import { RuleList } from "@/components/rule-list";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Review Rules</h1>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Rules ({rules.length})</h3>
          <RuleList
            rules={rules}
            selectedId={selected?.id}
            projectId={projectId}
            onSelect={setSelected}
            onRefresh={() => { fetchRules(); setSelected(null); }}
          />
          <Separator />
          <RuleUpload projectId={projectId} onUploaded={fetchRules} />
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
