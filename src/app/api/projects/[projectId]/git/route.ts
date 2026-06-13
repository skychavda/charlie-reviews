import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/queries/projects";
import { isGitRepo, getGitBranch, getUncommittedFiles, getBranchCommits, getCommitFiles } from "@/lib/git";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // If ?commit=<sha> is provided, return files for that commit
  const commitSha = _req.nextUrl.searchParams.get("commit");
  if (commitSha) {
    const files = await getCommitFiles(project.directory_path, commitSha);
    return NextResponse.json({ files });
  }

  const gitRepo = await isGitRepo(project.directory_path);
  if (!gitRepo) {
    return NextResponse.json({ isGitRepo: false, branch: null, changedFiles: [], commits: [] });
  }

  const [branch, changedFiles, commits] = await Promise.all([
    getGitBranch(project.directory_path),
    getUncommittedFiles(project.directory_path),
    getBranchCommits(project.directory_path),
  ]);

  return NextResponse.json({ isGitRepo: true, branch, changedFiles, commits });
}
