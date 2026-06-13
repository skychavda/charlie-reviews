import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export interface GitCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    await exec("git", ["rev-parse", "--is-inside-work-tree"], { cwd: dirPath });
    return true;
  } catch {
    return false;
  }
}

export async function getGitBranch(dirPath: string): Promise<string | null> {
  try {
    const { stdout } = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dirPath });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getUncommittedFiles(dirPath: string): Promise<string[]> {
  try {
    const [modified, untracked] = await Promise.all([
      exec("git", ["diff", "--name-only", "HEAD"], { cwd: dirPath }).then((r) => r.stdout).catch(() => ""),
      exec("git", ["ls-files", "--others", "--exclude-standard"], { cwd: dirPath }).then((r) => r.stdout).catch(() => ""),
    ]);
    const files = new Set<string>();
    for (const line of (modified + "\n" + untracked).split("\n")) {
      const trimmed = line.trim();
      if (trimmed) files.add(trimmed);
    }
    return Array.from(files).sort();
  } catch {
    return [];
  }
}

export async function getBranchCommits(dirPath: string, maxCount = 30): Promise<GitCommit[]> {
  try {
    // Try to find the merge-base with common default branches
    let baseRef: string | null = null;
    for (const candidate of ["main", "master", "develop"]) {
      try {
        await exec("git", ["rev-parse", "--verify", candidate], { cwd: dirPath });
        baseRef = candidate;
        break;
      } catch {
        // branch doesn't exist
      }
    }

    const args = ["log", "--format=%H%x00%s%x00%aI%x00%aN", `--max-count=${maxCount}`];
    if (baseRef) {
      // Only commits on this branch since diverging from base
      const { stdout: head } = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dirPath });
      if (head.trim() !== baseRef) {
        args.push(`${baseRef}..HEAD`);
      }
    }

    const { stdout } = await exec("git", args, { cwd: dirPath });
    if (!stdout.trim()) return [];

    return stdout.trim().split("\n").map((line) => {
      const [sha, message, date, author] = line.split("\0");
      return { sha, message, date, author };
    });
  } catch {
    return [];
  }
}

export async function getCommitFiles(dirPath: string, sha: string): Promise<string[]> {
  try {
    const { stdout } = await exec("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", sha], { cwd: dirPath });
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
