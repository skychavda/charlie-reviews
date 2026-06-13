import { getDb } from "..";
import type { Rule } from "@/types";
import crypto from "crypto";

export function listRules(projectId: string): Rule[] {
  return getDb().prepare("SELECT * FROM rules WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as Rule[];
}

export function getActiveRules(projectId: string): Rule[] {
  return getDb().prepare("SELECT * FROM rules WHERE project_id = ? AND is_active = 1 ORDER BY created_at").all(projectId) as Rule[];
}

export function getRule(id: string): Rule | undefined {
  return getDb().prepare("SELECT * FROM rules WHERE id = ?").get(id) as Rule | undefined;
}

export function createRule(data: { project_id: string; title: string; content: string; source: "editor" | "upload" }): Rule {
  const id = crypto.randomUUID();
  getDb().prepare(
    `INSERT INTO rules (id, project_id, title, content, source) VALUES (?, ?, ?, ?, ?)`
  ).run(id, data.project_id, data.title, data.content, data.source);
  return getRule(id)!;
}

export function updateRule(id: string, data: Partial<Pick<Rule, "title" | "content" | "is_active">>): Rule | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return getRule(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE rules SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getRule(id);
}

export function deleteRule(id: string): boolean {
  const result = getDb().prepare("DELETE FROM rules WHERE id = ?").run(id);
  return result.changes > 0;
}
