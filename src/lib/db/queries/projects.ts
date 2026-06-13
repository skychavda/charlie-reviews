import { getDb } from "..";
import type { Project } from "@/types";
import crypto from "crypto";

export function listProjects(): Project[] {
  return getDb().prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Project[];
}

export function getProject(id: string): Project | undefined {
  return getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

export function createProject(data: { name: string; description?: string; directory_path: string; file_patterns?: string; ignore_patterns?: string }): Project {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO projects (id, name, description, directory_path, file_patterns, ignore_patterns) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.name, data.description || "", data.directory_path, data.file_patterns || "", data.ignore_patterns || "");
  return getProject(id)!;
}

export function updateProject(id: string, data: Partial<Pick<Project, "name" | "description" | "directory_path" | "file_patterns" | "ignore_patterns">>): Project | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return getProject(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getProject(id);
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}
