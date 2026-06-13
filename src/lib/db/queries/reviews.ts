import { getDb } from "..";
import type { Review, ReviewItem } from "@/types";
import crypto from "crypto";

export function listReviews(projectId: string): Review[] {
  return getDb().prepare("SELECT * FROM reviews WHERE project_id = ? ORDER BY started_at DESC").all(projectId) as Review[];
}

export function getReview(id: string): Review | undefined {
  return getDb().prepare("SELECT * FROM reviews WHERE id = ?").get(id) as Review | undefined;
}

export function createReview(projectId: string, branchName?: string, selectedFiles?: string[]): Review {
  const id = crypto.randomUUID();
  const filesJson = selectedFiles && selectedFiles.length > 0 ? JSON.stringify(selectedFiles) : null;
  getDb().prepare(`INSERT INTO reviews (id, project_id, status, branch_name, selected_files) VALUES (?, ?, 'pending', ?, ?)`).run(id, projectId, branchName ?? null, filesJson);
  return getReview(id)!;
}

export function updateReview(id: string, data: Partial<Pick<Review, "status" | "files_scanned" | "total_items" | "error_message" | "completed_at">>): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE reviews SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function resetReview(id: string): Review | undefined {
  const db = getDb();
  db.prepare("DELETE FROM review_items WHERE review_id = ?").run(id);
  db.prepare(`UPDATE reviews SET status = 'pending', files_scanned = 0, total_items = 0, error_message = NULL, completed_at = NULL, started_at = datetime('now') WHERE id = ?`).run(id);
  return getReview(id);
}

export function deleteReview(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM review_items WHERE review_id = ?").run(id);
  db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
}

export function getReviewItems(reviewId: string): ReviewItem[] {
  return getDb().prepare("SELECT * FROM review_items WHERE review_id = ? ORDER BY file_path, line_start").all(reviewId) as ReviewItem[];
}

export function insertReviewItems(items: Omit<ReviewItem, "id">[]): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO review_items (id, review_id, file_path, line_start, line_end, severity, title, description, code_snippet, suggestion, suggested_code, ai_prompt, rule_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((rows: Omit<ReviewItem, "id">[]) => {
    for (const r of rows) {
      insert.run(crypto.randomUUID(), r.review_id, r.file_path, r.line_start, r.line_end, r.severity, r.title, r.description, r.code_snippet, r.suggestion, r.suggested_code, r.ai_prompt, r.rule_reference);
    }
  });
  tx(items);
}
