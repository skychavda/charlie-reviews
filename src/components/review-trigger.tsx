"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FileEntry = { path: string; size: number };

interface GitCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

interface GitInfo {
  isGitRepo: boolean;
  branch: string | null;
  changedFiles: string[];
  commits: GitCommit[];
}

export function ReviewTrigger({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "select-files" | "select-changed">("choose");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [loadingGit, setLoadingGit] = useState(false);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [commitFiles, setCommitFiles] = useState<Record<string, string[]>>({});
  const [loadingCommitFiles, setLoadingCommitFiles] = useState<string | null>(null);

  function handleOpen() {
    setMode("choose");
    setSelectedFiles(new Set());
    setGitInfo(null);
    setExpandedCommit(null);
    setCommitFiles({});
    setOpen(true);
    setLoadingGit(true);
    fetch(`/api/projects/${projectId}/git`)
      .then((r) => r.json())
      .then(setGitInfo)
      .catch(() => setGitInfo(null))
      .finally(() => setLoadingGit(false));
  }

  async function startReview(filePaths?: string[], branchName?: string) {
    setLoading(true);
    setOpen(false);
    const body: Record<string, unknown> = {};
    if (filePaths) body.files = filePaths;
    if (branchName) body.branch_name = branchName;
    const res = await fetch(`/api/projects/${projectId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const review = await res.json();
    router.push(`/projects/${projectId}/reviews/${review.id}`);
  }

  async function loadFiles() {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      const data = await res.json();
      setFiles(data.files);
      setMode("select-files");
    } finally {
      setLoadingFiles(false);
    }
  }

  function showChangedFiles() {
    if (!gitInfo) return;
    setSelectedFiles(new Set(gitInfo.changedFiles));
    setMode("select-changed");
  }

  async function toggleCommitExpand(sha: string) {
    if (expandedCommit === sha) {
      setExpandedCommit(null);
      return;
    }
    setExpandedCommit(sha);
    if (!commitFiles[sha]) {
      setLoadingCommitFiles(sha);
      try {
        const res = await fetch(`/api/projects/${projectId}/git?commit=${sha}`);
        const data = await res.json();
        setCommitFiles((prev) => ({ ...prev, [sha]: data.files }));
      } catch {
        setCommitFiles((prev) => ({ ...prev, [sha]: [] }));
      } finally {
        setLoadingCommitFiles(null);
      }
    }
  }

  function addCommitFiles(files: string[]) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      for (const f of files) next.add(f);
      return next;
    });
  }

  function removeCommitFiles(files: string[]) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      for (const f of files) next.delete(f);
      return next;
    });
  }

  function toggleFile(path: string) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleAll(fileList: string[]) {
    if (selectedFiles.size === fileList.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(fileList));
    }
  }

  const isSelectingFiles = mode === "select-files" || mode === "select-changed";
  const currentFileList = mode === "select-changed"
    ? Array.from(selectedFiles).sort()
    : files.map((f) => f.path);

  return (
    <>
      <Button onClick={handleOpen} disabled={loading} size="lg">
        {loading ? "Starting Review..." : "Start Review"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={isSelectingFiles ? "sm:max-w-lg overflow-hidden" : undefined}>
          <DialogHeader>
            <DialogTitle>Review Scope</DialogTitle>
            <DialogDescription>
              Choose what to include in this review.
            </DialogDescription>
          </DialogHeader>

          {mode === "choose" && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => startReview()} variant="outline" className="justify-start h-auto py-3 px-4">
                <div className="text-left">
                  <div className="font-medium">Review Whole Directory</div>
                  <div className="text-xs text-muted-foreground">Scan all files matching project patterns</div>
                </div>
              </Button>
              <Button onClick={loadFiles} variant="outline" disabled={loadingFiles} className="justify-start h-auto py-3 px-4">
                <div className="text-left">
                  <div className="font-medium">
                    {loadingFiles ? "Loading files..." : "Review Specific Files"}
                  </div>
                  <div className="text-xs text-muted-foreground">Pick which files to include</div>
                </div>
              </Button>
              {loadingGit && (
                <Button variant="outline" disabled className="justify-start h-auto py-3 px-4">
                  <div className="text-left">
                    <div className="font-medium">Checking git status...</div>
                    <div className="text-xs text-muted-foreground">Detecting uncommitted changes</div>
                  </div>
                </Button>
              )}
              {gitInfo?.isGitRepo && gitInfo.changedFiles.length > 0 && (
                <Button onClick={showChangedFiles} variant="outline" className="justify-start h-auto py-3 px-4">
                  <div className="text-left">
                    <div className="font-medium">
                      Review Changed Files
                      <span className="ml-1.5 text-xs font-normal bg-accent px-1.5 py-0.5 rounded">{gitInfo.branch}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {gitInfo.changedFiles.length} uncommitted file{gitInfo.changedFiles.length !== 1 ? "s" : ""} on this branch
                    </div>
                  </div>
                </Button>
              )}
              {gitInfo?.isGitRepo && gitInfo.changedFiles.length === 0 && (
                <div className="text-xs text-muted-foreground px-4 py-2">
                  Git repo detected ({gitInfo.branch}) but no uncommitted changes found.
                </div>
              )}
            </div>
          )}

          {isSelectingFiles && (
            <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
              {mode === "select-changed" && gitInfo?.branch && (
                <div className="text-xs text-muted-foreground shrink-0">
                  Branch: <code className="bg-accent px-1 py-0.5 rounded">{gitInfo.branch}</code>
                </div>
              )}

              {/* Commits section — only in select-changed mode */}
              {mode === "select-changed" && gitInfo?.commits && gitInfo.commits.length > 0 && (
                <div className="space-y-1 min-h-0 shrink-0">
                  <p className="text-xs font-medium text-muted-foreground">Commits on this branch</p>
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {gitInfo.commits.map((commit) => {
                      const isExpanded = expandedCommit === commit.sha;
                      const cFiles = commitFiles[commit.sha] ?? [];
                      const isLoading = loadingCommitFiles === commit.sha;
                      const allSelected = cFiles.length > 0 && cFiles.every((f) => selectedFiles.has(f));

                      return (
                        <div key={commit.sha} className="border-b last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleCommitExpand(commit.sha)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted text-sm min-w-0"
                          >
                            <span className="text-xs shrink-0">{isExpanded ? "▼" : "▶"}</span>
                            <code className="text-xs text-muted-foreground shrink-0">{commit.sha.slice(0, 7)}</code>
                            <span className="truncate min-w-0">{commit.message}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-2 pl-8 space-y-1 overflow-hidden">
                              {isLoading ? (
                                <p className="text-xs text-muted-foreground">Loading files...</p>
                              ) : cFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No files in this commit.</p>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => allSelected ? removeCommitFiles(cFiles) : addCommitFiles(cFiles)}
                                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                  >
                                    {allSelected ? "Remove all from selection" : "Add all to selection"}
                                  </button>
                                  {cFiles.map((f) => (
                                    <label key={f} className="flex items-center gap-2 text-xs hover:bg-muted rounded px-1 py-0.5 cursor-pointer min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={selectedFiles.has(f)}
                                        onChange={() => toggleFile(f)}
                                        className="accent-primary shrink-0"
                                      />
                                      <span className="truncate min-w-0">{f}</span>
                                    </label>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected files list */}
              <div className="flex items-center justify-between text-sm text-muted-foreground shrink-0">
                {mode === "select-files" ? (
                  <button type="button" onClick={() => toggleAll(currentFileList)} className="hover:text-foreground underline underline-offset-2">
                    {selectedFiles.size === currentFileList.length ? "Deselect all" : "Select all"}
                  </button>
                ) : (
                  <span className="text-xs font-medium">Selected files</span>
                )}
                <span>{selectedFiles.size} selected</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border p-2 flex flex-col gap-1 min-h-0">
                {(mode === "select-files" ? currentFileList : Array.from(selectedFiles).sort()).map((filePath) => (
                  <label key={filePath} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(filePath)}
                      onChange={() => toggleFile(filePath)}
                      className="accent-primary shrink-0"
                    />
                    <span className="truncate min-w-0">{filePath}</span>
                  </label>
                ))}
                {mode === "select-changed" && selectedFiles.size === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No files selected. Expand a commit above to add files.</p>
                )}
              </div>
              <DialogFooter className="shrink-0">
                <Button variant="outline" onClick={() => setMode("choose")}>
                  Back
                </Button>
                <Button
                  onClick={() => startReview(
                    Array.from(selectedFiles),
                    mode === "select-changed" ? gitInfo?.branch ?? undefined : undefined,
                  )}
                  disabled={selectedFiles.size === 0}
                >
                  Review {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
