import { NextRequest, NextResponse } from "next/server";
import { listReviews, createReview } from "@/lib/db/queries/reviews";
import { runReview } from "@/lib/engine/reviewer";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const reviews = listReviews(projectId);
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));
  const selectedFiles: string[] | undefined = Array.isArray(body.files) ? body.files : undefined;
  const branchName: string | undefined = typeof body.branch_name === "string" ? body.branch_name : undefined;
  const review = createReview(projectId, branchName, selectedFiles);

  // Fire-and-forget — client will poll for status
  runReview(review.id, projectId, selectedFiles).catch(console.error);

  return NextResponse.json(review, { status: 201 });
}
