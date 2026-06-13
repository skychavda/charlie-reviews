"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/project-form";
import { Plus } from "lucide-react";
import type { Project } from "@/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your code review projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create a project to start reviewing code
          </p>
          <CreateProjectDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
