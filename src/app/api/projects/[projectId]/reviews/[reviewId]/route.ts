import { NextRequest, NextResponse } from "next/server";
import { getReview, getReviewItems, updateReview, deleteReview, resetReview } from "@/lib/db/queries/reviews";
import { cancelReview, runReview } from "@/lib/engine/reviewer";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = getReview(reviewId);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = getReviewItems(reviewId);
  return NextResponse.json({ ...review, items });
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = getReview(reviewId);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.status !== "pending" && review.status !== "running") {
    return NextResponse.json({ error: "Review is not cancellable" }, { status: 400 });
  }
  // Abort any in-flight OpenRouter API calls
  cancelReview(reviewId);
  updateReview(reviewId, { status: "failed", error_message: "Cancelled by user", completed_at: new Date().toISOString() });
  return NextResponse.json(getReview(reviewId));
}

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ projectId: string; reviewId: string }> }) {
  const { projectId, reviewId } = await params;
  const review = getReview(reviewId);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.status === "pending" || review.status === "running") {
    return NextResponse.json({ error: "Review is already in progress" }, { status: 400 });
  }
  // Parse stored selected files for re-run
  const selectedFiles: string[] | undefined = review.selected_files
    ? JSON.parse(review.selected_files)
    : undefined;
  const reset = resetReview(reviewId);
  // Fire-and-forget — client will poll for status
  runReview(reviewId, projectId, selectedFiles).catch(console.error);
  return NextResponse.json(reset);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = getReview(reviewId);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  deleteReview(reviewId);
  return NextResponse.json({ success: true });
}
