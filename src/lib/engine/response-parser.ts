import { z } from "zod";

const ReviewItemSchema = z.object({
  file_path: z.string(),
  line_start: z.number().nullable().optional().default(null),
  line_end: z.number().nullable().optional().default(null),
  severity: z.enum(["critical", "warning", "suggestion", "info"]),
  title: z.string(),
  description: z.string(),
  code_snippet: z.string().nullable().optional().default(null),
  suggestion: z.string().nullable().optional().default(null),
  suggested_code: z.string().nullable().optional().default(null),
  ai_prompt: z.string().nullable().optional().default(null),
  rule_reference: z.string().nullable().optional().default(null),
});

const ResponseSchema = z.object({
  items: z.array(ReviewItemSchema),
});

export type ParsedItem = z.infer<typeof ReviewItemSchema>;

export function parseResponse(raw: string): ParsedItem[] {
  // Strip code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Response was likely truncated — try to recover valid items.
    // If there's nothing recoverable (e.g. the model returned plain text),
    // skip the chunk silently rather than surfacing a noisy error.
    try {
      parsed = repairTruncatedJson(cleaned);
    } catch {
      return [];
    }
  }

  // Normalise a bare array (no wrapper) into the expected shape.
  if (Array.isArray(parsed)) {
    parsed = { items: parsed };
  }

  const result = ResponseSchema.safeParse(parsed);
  if (!result.success) return [];
  return result.data.items;
}

function repairTruncatedJson(raw: string): unknown {
  // The model can emit two shapes:
  //   A) {"items": [{...}, {... (truncated)
  //   B) [{...}, {... (truncated bare array, no wrapper)
  //
  // Try shape A first; fall back to shape B when "items" is absent.

  const itemsIdx = raw.indexOf('"items"');

  if (itemsIdx !== -1) {
    // Shape A: standard {"items": [...]} wrapper
    const end = findLastCompleteObjectEnd(raw, itemsIdx);
    if (end === -1) throw new Error("Cannot repair: no complete items found");
    return JSON.parse(raw.slice(0, end) + "\n]}");
  }

  // Shape B: bare array — the model skipped the wrapper entirely, or the
  // truncation happened before "items" was written.  Find the first "[" and
  // treat the objects inside it as items.
  const arrayStart = raw.indexOf("[");
  if (arrayStart === -1) throw new Error("Cannot repair: no items array found");

  const end = findLastCompleteObjectEnd(raw, arrayStart);
  if (end === -1) throw new Error("Cannot repair: no complete items found");

  // Wrap the recovered array into the expected shape.
  const repairedArray = raw.slice(0, end) + "\n]";
  return { items: JSON.parse(repairedArray) };
}

/**
 * Walk `raw` starting just after `searchFrom` to find the first "[" that opens
 * the items array, then track brace depth character-by-character (correctly
 * skipping string contents) to return the index immediately after the last
 * fully-closed top-level "{...}" object in that array.
 *
 * Returns -1 if no complete object was found.
 */
function findLastCompleteObjectEnd(raw: string, searchFrom: number): number {
  let lastCompleteItemEnd = -1;
  let depth = 0;
  let inString = false;
  let inItemsArray = false;

  for (let i = searchFrom; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (ch === "\\") {
        i++; // skip escaped character
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "[" && !inItemsArray) {
      inItemsArray = true;
      continue;
    }

    if (!inItemsArray) continue;

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        lastCompleteItemEnd = i + 1;
      }
    }
  }

  return lastCompleteItemEnd;
}

