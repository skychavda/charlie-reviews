"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewItem, Severity } from "@/types";
import { ReviewItemCard } from "./review-item-card";
import { SeverityBadge } from "./severity-badge";
import { Button } from "@/components/ui/button";
import { REVIEW_POLL_INTERVAL } from "@/lib/constants";

interface ReviewWithItems extends Review {
  items: ReviewItem[];
}

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

  if (!review) return <div className="text-muted-foreground">Loading...</div>;

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
      <div className="text-center py-12 space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">
          {review.status === "pending" ? "Preparing review..." : `Reviewing ${review.files_scanned} files...`}
        </p>
        <Button variant="outline" size="sm" onClick={cancelReview} disabled={cancelling}>
          {cancelling ? "Cancelling..." : "Cancel Review"}
        </Button>
      </div>
    );
  }

  if (review.status === "failed") {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-md p-4 space-y-3">
        <div>
          <p className="font-medium text-red-600">Review Failed</p>
          <p className="text-sm text-red-500 mt-1">{review.error_message}</p>
        </div>
        <Button size="sm" onClick={rerunReview} disabled={rerunning}>
          {rerunning ? "Re-running..." : "Re-run Review"}
        </Button>
      </div>
    );
  }

  const items = review.items || [];
  const filtered = filter === "all" ? items : items.filter((i) => i.severity === filter);

  // Group by file
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
      {/* Summary */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-4 items-center">
          {review.branch_name && (
            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
              {review.branch_name}
            </span>
          )}
          <p className="text-sm text-muted-foreground">{review.files_scanned} files scanned</p>
          <p className="text-sm text-muted-foreground">{items.length} issues found</p>
          <Button variant="outline" size="sm" onClick={rerunReview} disabled={rerunning}>
            {rerunning ? "Re-running..." : "Re-run"}
          </Button>
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "warning", "suggestion", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-2 py-1 rounded ${filter === s ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
            >
              {s === "all" ? `All (${items.length})` : `${s} (${severityCounts[s]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {items.length === 0 ? "No issues found — looking good!" : "No items match the current filter."}
        </p>
      ) : (
        <div className="space-y-2">
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
    <div className="border rounded-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent/50"
      >
        <span className="text-xs">{open ? "▼" : "▶"}</span>
        <code className="text-sm">{filePath}</code>
        <span className="text-xs text-muted-foreground">({items.length})</span>
        <div className="flex gap-1 ml-auto">
          {(["critical", "warning", "suggestion", "info"] as Severity[]).map((s) => {
            const count = items.filter((i) => i.severity === s).length;
            return count > 0 ? <SeverityBadge key={s} severity={s} /> : null;
          })}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-3">
          {items.map((item) => (
            <ReviewItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
