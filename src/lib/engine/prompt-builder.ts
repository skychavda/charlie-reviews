import type { Rule } from "@/types";
import type { FileChunk } from "./chunker";

export function buildSystemPrompt(rules: Rule[]): string {
  const rulesSection = rules.length > 0
    ? rules.map((r, i) => `### Rule ${i + 1}: ${r.title}\n${r.content}`).join("\n\n")
    : "No specific rules provided. Use general best practices for code review.";

  return `You are a senior code reviewer. Review the provided source code files and return structured feedback.

## Review Rules
${rulesSection}

## Output Format
Return ONLY valid JSON (no markdown fences, no extra text). Use this exact structure:
{
  "items": [
    {
      "file_path": "relative/path/to/file.ts",
      "line_start": 10,
      "line_end": 15,
      "severity": "critical" | "warning" | "suggestion" | "info",
      "title": "Short issue title",
      "description": "Detailed explanation of the issue",
      "code_snippet": "the problematic code (optional)",
      "suggestion": "suggested fix or improvement (optional)",
      "suggested_code": "the exact corrected code that should replace the code_snippet (optional, provide when suggestion involves a code change)",
      "ai_prompt": "a ready-to-use prompt the user can copy and give to an AI coding agent (like Claude Code, Cursor, Codex) to apply this fix automatically",
      "rule_reference": "Which rule this relates to (optional)"
    }
  ]
}

## Field Details
- **code_snippet**: The exact problematic code from the file
- **suggested_code**: The corrected version of code_snippet — what the code should look like after the fix. Must be complete and ready to replace code_snippet directly
- **ai_prompt**: A self-contained instruction prompt that an AI coding agent can execute. Include the file path, what to change, and why. Example: "In src/utils/auth.ts, replace the plaintext password comparison on lines 10-12 with bcrypt.compare(). The current code is vulnerable to timing attacks."

## Severity Levels
- **critical**: Security vulnerabilities, data loss risks, crashes
- **warning**: Bugs, performance issues, bad patterns
- **suggestion**: Code quality, readability, maintainability improvements
- **info**: Minor style, documentation, or informational notes

## Guidelines
- Be specific: include exact file paths and line numbers
- Be actionable: always explain why something is an issue and how to fix it
- Focus on the rules provided; don't nitpick unrelated issues
- If a file looks fine, don't force issues — it's OK to return fewer items
- Return an empty items array if there are no issues`;
}

export function buildUserPrompt(chunk: FileChunk): string {
  const filesContent = chunk.files
    .map((f) => `=== FILE: ${f.relativePath} ===\n${f.content}`)
    .join("\n\n");

  return `Review the following ${chunk.files.length} file(s):\n\n${filesContent}`;
}
