import { readProjectFiles, readSelectedFiles } from "./file-reader";
import { chunkFiles } from "./chunker";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";
import { parseResponse, type ParsedItem } from "./response-parser";
import { callOpenRouter } from "../openrouter/client";
import { getActiveRules } from "../db/queries/rules";
import { updateReview, insertReviewItems, getReview } from "../db/queries/reviews";
import { getProject } from "../db/queries/projects";
import { DEFAULT_FILE_PATTERNS, DEFAULT_IGNORE_PATTERNS } from "../constants";

// Track active review AbortControllers so cancel can abort in-flight API calls
const activeReviews = new Map<string, AbortController>();

export function cancelReview(reviewId: string) {
  const controller = activeReviews.get(reviewId);
  if (controller) {
    controller.abort();
    activeReviews.delete(reviewId);
  }
}

export async function runReview(reviewId: string, projectId: string, selectedFiles?: string[]) {
  const controller = new AbortController();
  activeReviews.set(reviewId, controller);

  try {
    updateReview(reviewId, { status: "running" });

    const project = getProject(projectId);
    if (!project) throw new Error("Project not found");

    const rules = getActiveRules(projectId);
    const filePatterns = project.file_patterns || DEFAULT_FILE_PATTERNS;
    const ignorePatterns = project.ignore_patterns || DEFAULT_IGNORE_PATTERNS;

    let files;
    if (selectedFiles && selectedFiles.length > 0) {
      files = readSelectedFiles(project.directory_path, selectedFiles);
    } else {
      files = await readProjectFiles(project.directory_path, filePatterns, ignorePatterns);
    }
    updateReview(reviewId, { files_scanned: files.length });

    if (files.length === 0) {
      updateReview(reviewId, { status: "completed", total_items: 0, completed_at: new Date().toISOString() });
      return;
    }

    const chunks = chunkFiles(files);
    const systemPrompt = buildSystemPrompt(rules);
    const allItems: ParsedItem[] = [];

    for (const chunk of chunks) {
      // Check if cancelled before starting next chunk
      if (controller.signal.aborted) break;

      const userPrompt = buildUserPrompt(chunk);
      const response = await callOpenRouter([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], controller.signal);

      try {
        const items = parseResponse(response);
        allItems.push(...items);
      } catch (e) {
        console.error("Failed to parse chunk response:", e);
      }
    }

    // Don't overwrite status if already cancelled
    if (controller.signal.aborted) return;

    if (allItems.length > 0) {
      insertReviewItems(
        allItems.map((item) => ({
          review_id: reviewId,
          file_path: item.file_path,
          line_start: item.line_start ?? null,
          line_end: item.line_end ?? null,
          severity: item.severity,
          title: item.title,
          description: item.description,
          code_snippet: item.code_snippet ?? null,
          suggestion: item.suggestion ?? null,
          suggested_code: item.suggested_code ?? null,
          ai_prompt: item.ai_prompt ?? null,
          rule_reference: item.rule_reference ?? null,
        }))
      );
    }

    updateReview(reviewId, {
      status: "completed",
      total_items: allItems.length,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't overwrite if already cancelled
    if (controller.signal.aborted) return;

    const message = error instanceof Error ? error.message : "Unknown error";
    updateReview(reviewId, {
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    });
  } finally {
    activeReviews.delete(reviewId);
  }
}
