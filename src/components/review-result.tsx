"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewItem, Severity } from "@/types";
import { ReviewItemCard } from "./review-item-card";
import { SeverityBadge } from "./severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { REVIEW_POLL_INTERVAL } from "@/lib/constants";
import { RefreshCw, XCircle, FileText, ChevronDown, ChevronRight, GitBranch, AlertTriangle } from "lucide-react";

interface ReviewWithItems extends Review {
  items: ReviewItem[];
}

const SEVERITY_ORDER: Severity[] = ["critical", "warning", "suggestion", "info"];

export function ReviewResult({ projectId, reviewId }: { projectId: string; reviewId: string }) {
  const router = useRouter();
  const [review, setReview] = useState<ReviewWithItems | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [cancelling, setCancelling] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const fetchReview = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/reviews/${reviewId}`);
    const data = await res.json();
    setReview(data);
    return data.status;
  }, [projectId, reviewId]);

  useEffect(() => {
    fetchReview();
    const interval = setInterval(async () => {
      const status = await fetchReview();
      if (status === "completed" || status === "failed") clearInterval(interval);
    }, REVIEW_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchReview]);

  if (!review) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  async function cancelReview() {
    setCancelling(true);
    await fetch(`/api/projects/${projectId}/reviews/${reviewId}`, { method: "PATCH" });
    router.push(`/projects/${projectId}`);
  }

  async function rerunReview() {
    setRerunning(true);
    await fetch(`/api/projects/${projectId}/reviews/${reviewId}`, { method: "PUT" });
    setFilter("all");
    fetchReview();
    setRerunning(false);
  }

  if (review.status === "pending" || review.status === "running") {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5">
        <div className="relative">
          <div className="animate-spin h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {review.status === "pending" ? "Preparing review..." : "Reviewing files..."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {review.status === "running" ? `${review.files_scanned} files in progress` : "Setting up"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cancelReview} disabled={cancelling}>
          <XCircle data-icon="inline-start" className="size-4" />
          {cancelling ? "Cancelling..." : "Cancel"}
        </Button>
      </div>
    );
  }

  if (review.status === "failed") {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-sm text-destructive">Review Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{review.error_message}</p>
            </div>
          </div>
          <Button size="sm" onClick={rerunReview} disabled={rerunning}>
            <RefreshCw data-icon="inline-start" className="size-4" />
            {rerunning ? "Re-running..." : "Re-run Review"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = review.items || [];
  const filtered = filter === "all" ? items : items.filter((i) => i.severity === filter);

  const grouped = filtered.reduce<Record<string, ReviewItem[]>>((acc, item) => {
    (acc[item.file_path] ||= []).push(item);
    return acc;
  }, {});

  const severityCounts = {
    critical: items.filter((i) => i.severity === "critical").length,
    warning: items.filter((i) => i.severity === "warning").length,
    suggestion: items.filter((i) => i.severity === "suggestion").length,
    info: items.filter((i) => i.severity === "info").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {review.branch_name && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <GitBranch className="size-3" />
                {review.branch_name}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-4" />
              {review.files_scanned} files scanned
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} issues found
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={rerunReview} disabled={rerunning}>
                <RefreshCw data-icon="inline-start" className="size-3.5" />
                {rerunning ? "Re-running..." : "Re-run"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Severity filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", ...SEVERITY_ORDER] as const).map((s) => {
          const isActive = filter === s;
          const count = s === "all" ? items.length : severityCounts[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-accent hover:text-foreground hover:border-primary/20"
              }`}
            >
              <span className="capitalize">{s}</span>
              <span className={`${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "No issues found -- looking good!" : "No items match the current filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([filePath, fileItems]) => (
            <FileGroup key={filePath} filePath={filePath} items={fileItems} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileGroup({ filePath, items }: { filePath: string; items: ReviewItem[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors duration-200"
      >
        {open ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
        <code className="text-sm font-mono font-medium truncate">{filePath}</code>
        <span className="text-xs text-muted-foreground shrink-0">({items.length})</span>
        <div className="flex gap-1.5 ml-auto shrink-0">
          {SEVERITY_ORDER.map((s) => {
            const count = items.filter((i) => i.severity === s).length;
            return count > 0 ? <SeverityBadge key={s} severity={s} /> : null;
          })}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40">
          <div className="pt-3 space-y-3">
            {items.map((item) => (
              <ReviewItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
