"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Trash2, GitBranch, ArrowLeft } from "lucide-react";
import type { Review } from "@/types";

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    running: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    pending: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export default function ReviewsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/reviews`).then((r) => r.json()).then(setReviews);
  }, [projectId]);

  function promptDelete(e: React.MouseEvent, reviewId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(reviewId);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/projects/${projectId}/reviews/${deleteTarget}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== deleteTarget));
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-8">
      <Link href={`/projects/${projectId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft data-icon="inline-start" className="size-4" />
          Back to Project
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <Link key={r.id} href={`/projects/${projectId}/reviews/${r.id}`}>
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-border/60 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{new Date(r.started_at).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {r.files_scanned} files scanned &middot; {r.total_items} issues
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.branch_name && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <GitBranch className="size-3" />
                      {r.branch_name}
                    </span>
                  )}
                  <StatusPill status={r.status} />
                  <button
                    onClick={(e) => promptDelete(e, r.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
