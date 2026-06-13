"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FolderOpen className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{project.name}</CardTitle>
              <CardDescription className="truncate text-xs mt-1 font-mono">
                {project.directory_path}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description || "No description"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
