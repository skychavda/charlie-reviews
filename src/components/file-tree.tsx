"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";

interface FileTreeProps {
  files: string[];
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  onToggleAll: (paths: string[]) => void;
}

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map(), isFile: false };

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: fullPath,
          children: new Map(),
          isFile,
        });
      }
      current = current.children.get(part)!;
    }
  }

  return root;
}

function getFilesUnder(node: TreeNode): string[] {
  if (node.isFile) return [node.path];
  const files: string[] = [];
  for (const child of node.children.values()) {
    files.push(...getFilesUnder(child));
  }
  return files;
}

function FolderNode({
  node,
  selectedFiles,
  onToggleFile,
  onToggleAll,
  depth,
}: {
  node: TreeNode;
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  onToggleAll: (paths: string[]) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  const filesUnder = useMemo(() => getFilesUnder(node), [node]);
  const selectedCount = filesUnder.filter((f) => selectedFiles.has(f)).length;
  const allSelected = selectedCount === filesUnder.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const sortedChildren = useMemo(() => {
    const entries = Array.from(node.children.values());
    // Folders first, then files, alphabetical within each group
    return entries.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [node.children]);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-accent/40 cursor-pointer transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-0.5"
        >
          {expanded ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </button>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={() => onToggleAll(filesUnder)}
          className="accent-primary shrink-0 rounded"
        />
        <Folder className="size-3.5 text-primary/70 shrink-0" />
        <span
          className="text-xs font-medium truncate flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          {node.name}
        </span>
        <span className="text-[10px] text-muted-foreground/60 shrink-0 pr-1">
          {selectedCount}/{filesUnder.length}
        </span>
      </div>
      {expanded && (
        <div>
          {sortedChildren.map((child) =>
            child.isFile ? (
              <FileNode
                key={child.path}
                node={child}
                selectedFiles={selectedFiles}
                onToggleFile={onToggleFile}
                depth={depth + 1}
              />
            ) : (
              <FolderNode
                key={child.path}
                node={child}
                selectedFiles={selectedFiles}
                onToggleFile={onToggleFile}
                onToggleAll={onToggleAll}
                depth={depth + 1}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function FileNode({
  node,
  selectedFiles,
  onToggleFile,
  depth,
}: {
  node: TreeNode;
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  depth: number;
}) {
  const checked = selectedFiles.has(node.path);

  return (
    <label
      className="flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-accent/40 cursor-pointer transition-colors"
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggleFile(node.path)}
        className="accent-primary shrink-0 rounded"
      />
      <FileText className="size-3.5 text-muted-foreground/60 shrink-0" />
      <span className="text-xs font-mono truncate">{node.name}</span>
    </label>
  );
}

export function FileTree({ files, selectedFiles, onToggleFile, onToggleAll }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  const sortedRootChildren = useMemo(() => {
    const entries = Array.from(tree.children.values());
    return entries.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [tree.children]);

  if (files.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">No files available.</p>
    );
  }

  return (
    <div className="flex flex-col gap-px">
      {sortedRootChildren.map((child) =>
        child.isFile ? (
          <FileNode
            key={child.path}
            node={child}
            selectedFiles={selectedFiles}
            onToggleFile={onToggleFile}
            depth={0}
          />
        ) : (
          <FolderNode
            key={child.path}
            node={child}
            selectedFiles={selectedFiles}
            onToggleFile={onToggleFile}
            onToggleAll={onToggleAll}
            depth={0}
          />
        )
      )}
    </div>
  );
}
