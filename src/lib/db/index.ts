import Database from "better-sqlite3";
import path from "path";
import { initSchema } from "./schema";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "charlie.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);

    // Migrations: add columns if missing
    const migrations = [
      `ALTER TABLE reviews ADD COLUMN branch_name TEXT`,
      `ALTER TABLE reviews ADD COLUMN selected_files TEXT`,
      `ALTER TABLE review_items ADD COLUMN suggested_code TEXT`,
      `ALTER TABLE review_items ADD COLUMN ai_prompt TEXT`,
    ];
    for (const sql of migrations) {
      try { db.exec(sql); } catch { /* column already exists */ }
    }
  }
  return db;
}
