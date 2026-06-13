"use client";

import { use } from "react";
import { ReviewResult } from "@/components/review-result";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReviewDetailPage({ params }: { params: Promise<{ projectId: string; reviewId: string }> }) {
  const { projectId, reviewId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft data-icon="inline-start" className="size-4" />
            Back to Project
          </Button>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-lg font-semibold tracking-tight">Review Results</h1>
      </div>
      <ReviewResult projectId={projectId} reviewId={reviewId} />
    </div>
  );
}
