"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      description: form.get("description") as string,
      directory_path: form.get("directory_path") as string,
      file_patterns: form.get("file_patterns") as string,
      ignore_patterns: form.get("ignore_patterns") as string,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to create project");
      setLoading(false);
      return;
    }

    const project = await res.json();
    setOpen(false);
    setLoading(false);
    setError("");
    router.push(`/projects/${project.id}`);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setError("");
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" className="size-4" />
        New Project
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Set up a new project for AI-powered code review
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" required placeholder="My Backend" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of the project" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="directory_path">Directory Path</Label>
              <Input id="directory_path" name="directory_path" required placeholder="/Users/you/projects/my-app" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Absolute path to the local repository</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_patterns">File Patterns</Label>
              <Input id="file_patterns" name="file_patterns" placeholder="**/*.{ts,tsx,js,jsx}" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Comma-separated glob patterns (leave empty for defaults)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ignore_patterns">Ignore Patterns</Label>
              <Input id="ignore_patterns" name="ignore_patterns" placeholder="node_modules/**,dist/**" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Comma-separated glob patterns to exclude</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
