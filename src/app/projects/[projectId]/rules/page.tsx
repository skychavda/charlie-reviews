"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      <Link href={`/projects/${projectId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft data-icon="inline-start" className="size-4" />
          Back to Project
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define rules to guide the AI reviewer
        </p>
      </div>

      {/* Rule Editor */}
      <RuleEditor
        key={selected?.id || "new"}
        projectId={projectId}
        onSaved={() => { fetchRules(); setSelected(null); }}
        initial={selected ? { id: selected.id, title: selected.title, content: selected.content } : undefined}
      />

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* File Upload */}
      <RuleUpload projectId={projectId} onUploaded={fetchRules} />

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Rules Grid */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight mb-4">Rules ({rules.length})</h3>
        <RuleList
          rules={rules}
          selectedId={selected?.id}
          projectId={projectId}
          onSelect={setSelected}
          onRefresh={() => { fetchRules(); setSelected(null); }}
        />
      </div>
    </div>
  );
}
