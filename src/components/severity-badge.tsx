"use client";

import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types";

const config: Record<Severity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-600 hover:bg-red-700 text-white" },
  warning: { label: "Warning", className: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  suggestion: { label: "Suggestion", className: "bg-blue-500 hover:bg-blue-600 text-white" },
  info: { label: "Info", className: "bg-gray-400 hover:bg-gray-500 text-white" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = config[severity];
  return <Badge className={c.className}>{c.label}</Badge>;
}
