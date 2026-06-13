import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/queries/projects";
import { readProjectFiles } from "@/lib/engine/file-reader";
import { DEFAULT_FILE_PATTERNS, DEFAULT_IGNORE_PATTERNS } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files = await readProjectFiles(
    project.directory_path,
    project.file_patterns || DEFAULT_FILE_PATTERNS,
    project.ignore_patterns || DEFAULT_IGNORE_PATTERNS
  );

  return NextResponse.json({
    count: files.length,
    files: files.map((f) => ({ path: f.relativePath, size: f.size })),
  });
}
