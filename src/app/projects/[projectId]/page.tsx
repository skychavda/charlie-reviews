"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewTrigger } from "@/components/review-trigger";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { Project, Review } from "@/types";

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then(setProject);
    fetch(`/api/projects/${projectId}/reviews`).then((r) => r.json()).then(setReviews);
    fetch(`/api/projects/${projectId}/files`).then((r) => r.json()).then((d) => setFileCount(d.count));
  }, [projectId]);

  if (!project) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.directory_path}</p>
          {project.description && <p className="text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/rules`}>
            <Button variant="outline">Rules</Button>
          </Link>
          <ReviewTrigger projectId={projectId} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Files</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fileCount ?? "..."}</p>
            <p className="text-xs text-muted-foreground">matching files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Reviews</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reviews.length}</p>
            <p className="text-xs text-muted-foreground">total reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Last Review</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {reviews[0] ? new Date(reviews[0].started_at).toLocaleDateString() : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{reviews[0]?.status || "none yet"}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Reviews</h2>
          <Link href={`/projects/${projectId}/reviews`}>
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Start one above.</p>
        ) : (
          <div className="space-y-2">
            {reviews.slice(0, 5).map((r) => (
              <Link key={r.id} href={`/projects/${projectId}/reviews/${r.id}`}>
                <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">{new Date(r.started_at).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{r.files_scanned} files, {r.total_items} issues</p>
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
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
