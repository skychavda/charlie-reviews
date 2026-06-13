"use client";

import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types";

const config: Record<Severity, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  warning: {
    label: "Warning",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  suggestion: {
    label: "Suggestion",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  info: {
    label: "Info",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = config[severity];
  return <Badge className={c.className} variant="outline">{c.label}</Badge>;
}
