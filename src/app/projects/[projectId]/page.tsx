"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewTrigger } from "@/components/review-trigger";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FileText, BarChart3, Clock, BookOpen, ChevronRight, Trash2, GitBranch, ArrowLeft } from "lucide-react";
import type { Project, Review } from "@/types";

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

  if (!project) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft data-icon="inline-start" className="size-4" />
          Dashboard
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1 truncate">{project.directory_path}</p>
          {project.description && <p className="text-sm text-muted-foreground mt-2">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/projects/${projectId}/rules`}>
            <Button variant="outline" size="sm">
              <BookOpen data-icon="inline-start" className="size-4" />
              Rules
            </Button>
          </Link>
          <ReviewTrigger projectId={projectId} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{fileCount ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Matching files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Clock className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {reviews[0] ? new Date(reviews[0].started_at).toLocaleDateString() : "--"}
              </p>
              <p className="text-xs text-muted-foreground">{reviews[0]?.status || "No reviews yet"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Reviews</h2>
          <Link href={`/projects/${projectId}/reviews`}>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight data-icon="inline-end" className="size-4" />
            </Button>
          </Link>
        </div>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <p className="text-sm text-muted-foreground">No reviews yet. Start one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 5).map((r) => (
              <Link key={r.id} href={`/projects/${projectId}/reviews/${r.id}`}>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/60 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{new Date(r.started_at).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.files_scanned} files &middot; {r.total_items} issues
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
