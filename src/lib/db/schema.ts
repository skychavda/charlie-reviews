import type Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      directory_path TEXT NOT NULL,
      file_patterns TEXT NOT NULL DEFAULT '**/*.{ts,tsx,js,jsx,py,go,rs,java,rb,php,css,html,md}',
      ignore_patterns TEXT NOT NULL DEFAULT 'node_modules/**,dist/**,build/**,.next/**,.git/**,*.lock,package-lock.json',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('editor', 'upload')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
      files_scanned INTEGER NOT NULL DEFAULT 0,
      total_items INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      branch_name TEXT,
      selected_files TEXT
    );

    CREATE TABLE IF NOT EXISTS review_items (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      line_start INTEGER,
      line_end INTEGER,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'suggestion', 'info')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      code_snippet TEXT,
      suggestion TEXT,
      suggested_code TEXT,
      ai_prompt TEXT,
      rule_reference TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_rules_project ON rules(project_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);
    CREATE INDEX IF NOT EXISTS idx_review_items_review ON review_items(review_id);
  `);
}
