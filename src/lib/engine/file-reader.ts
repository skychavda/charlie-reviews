import { glob } from "glob";
import fs from "fs";
import path from "path";
import { isBinaryFile, isFileTooLarge } from "./file-filter";

export interface FileEntry {
  relativePath: string;
  content: string;
  size: number;
}

/**
 * Split a comma-separated pattern string, respecting brace groups.
 * e.g. "**\/*.{ts,tsx},src/**" → ["**\/*.{ts,tsx}", "src/**"]
 */
function splitPatterns(input: string): string[] {
  const results: string[] = [];
  let current = "";
  let braceDepth = 0;
  for (const ch of input) {
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth--;
    if (ch === "," && braceDepth === 0) {
      results.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results.filter(Boolean);
}

export async function readProjectFiles(
  directory: string,
  includePatterns: string,
  ignorePatterns: string
): Promise<FileEntry[]> {
  const patterns = splitPatterns(includePatterns);
  const ignores = splitPatterns(ignorePatterns);

  const files: FileEntry[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: directory,
      nodir: true,
      ignore: ignores,
      absolute: false,
    });
    for (const match of matches) {
      const absPath = path.join(directory, match);
      if (isBinaryFile(match)) continue;

      try {
        const stat = fs.statSync(absPath);
        if (isFileTooLarge(stat.size)) continue;

        const content = fs.readFileSync(absPath, "utf-8");
        files.push({ relativePath: match, content, size: stat.size });
      } catch {
        // skip unreadable files
      }
    }
  }

  // Deduplicate by path
  const seen = new Set<string>();
  return files.filter((f) => {
    if (seen.has(f.relativePath)) return false;
    seen.add(f.relativePath);
    return true;
  });
}

/**
 * Read specific files by their relative paths, bypassing glob patterns.
 * Used when the user explicitly selects files (e.g. from git changed files).
 */
export function readSelectedFiles(directory: string, relativePaths: string[]): FileEntry[] {
  const files: FileEntry[] = [];
  console.log('Line----82 file-reader.ts', relativePaths)
  for (const relPath of relativePaths) {
    const absPath = path.join(directory, relPath);
    console.log('Line----85 file-reader.ts', absPath)
    if (isBinaryFile(relPath)) continue;
    try {
      const stat = fs.statSync(absPath);
      console.log('Line----88 file-reader.ts stat.size', stat.size)
      if (isFileTooLarge(stat.size)) continue;
      const content = fs.readFileSync(absPath, "utf-8");
      files.push({ relativePath: relPath, content, size: stat.size });
    } catch (e) {
      console.log('Line----94 file-reader.ts error====', e)
      // skip unreadable files
    }
  }
  return files;
}
