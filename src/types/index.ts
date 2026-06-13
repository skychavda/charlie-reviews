export interface Project {
  id: string;
  name: string;
  description: string;
  directory_path: string;
  file_patterns: string; // comma-separated globs
  ignore_patterns: string; // comma-separated globs
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  project_id: string;
  title: string;
  content: string; // markdown
  source: "editor" | "upload";
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  project_id: string;
  status: "pending" | "running" | "completed" | "failed";
  files_scanned: number;
  total_items: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  branch_name: string | null;
  selected_files: string | null; // JSON array of file paths, null = whole project
}

export interface ReviewItem {
  id: string;
  review_id: string;
  file_path: string;
  line_start: number | null;
  line_end: number | null;
  severity: "critical" | "warning" | "suggestion" | "info";
  title: string;
  description: string;
  code_snippet: string | null;
  suggestion: string | null;
  suggested_code: string | null;
  ai_prompt: string | null;
  rule_reference: string | null;
}

export type Severity = ReviewItem["severity"];
