import { CHUNK_TOKEN_LIMIT, CHARS_PER_TOKEN } from "../constants";
import type { FileEntry } from "./file-reader";

export interface FileChunk {
  files: FileEntry[];
  estimatedTokens: number;
}

export function chunkFiles(files: FileEntry[]): FileChunk[] {
  const maxChars = CHUNK_TOKEN_LIMIT * CHARS_PER_TOKEN;
  const chunks: FileChunk[] = [];
  let current: FileEntry[] = [];
  let currentSize = 0;

  for (const file of files) {
    const fileChars = file.content.length + file.relativePath.length + 20; // overhead for formatting
    if (currentSize + fileChars > maxChars && current.length > 0) {
      chunks.push({ files: current, estimatedTokens: Math.ceil(currentSize / CHARS_PER_TOKEN) });
      current = [];
      currentSize = 0;
    }
    current.push(file);
    currentSize += fileChars;
  }

  if (current.length > 0) {
    chunks.push({ files: current, estimatedTokens: Math.ceil(currentSize / CHARS_PER_TOKEN) });
  }

  return chunks;
}
