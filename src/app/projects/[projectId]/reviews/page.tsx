"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { Review } from "@/types";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Review History</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Link key={r.id} href={`/projects/${projectId}/reviews/${r.id}`}>
              <div className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/50">
                <div>
                  <p className="font-medium">{new Date(r.started_at).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.files_scanned} files scanned &middot; {r.total_items} issues
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.branch_name && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                      {r.branch_name}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    r.status === "completed" ? "bg-green-100 text-green-700" :
                    r.status === "failed" ? "bg-red-100 text-red-700" :
                    r.status === "running" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {r.status}
                  </span>
                  <button
                    onClick={(e) => promptDelete(e, r.id)}
                    className="text-xs text-muted-foreground hover:text-red-600 px-1.5 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete review"
                  >
                    ✕
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
