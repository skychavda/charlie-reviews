"use client";

import { use } from "react";
import { ReviewResult } from "@/components/review-result";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReviewDetailPage({ params }: { params: Promise<{ projectId: string; reviewId: string }> }) {
  const { projectId, reviewId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">&larr; Back to Project</Button>
        </Link>
        <h1 className="text-2xl font-bold">Review Results</h1>
      </div>
      <ReviewResult projectId={projectId} reviewId={reviewId} />
    </div>
  );
}
