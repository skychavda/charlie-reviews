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
    // Response was likely truncated — try to recover valid items
    parsed = repairTruncatedJson(cleaned);
  }

  const result = ResponseSchema.parse(parsed);
  return result.items;
}

function repairTruncatedJson(raw: string): unknown {
  // Find the last complete object in the items array by looking for the
  // last "}," or "}" that closes a valid item before the truncation point.
  // Strategy: progressively trim from the end and try to close the JSON.

  // Ensure we start with the items array
  const itemsIdx = raw.indexOf('"items"');
  if (itemsIdx === -1) throw new Error("Cannot repair: no items array found");

  // Find last complete object boundary — look for "},\n" or "}\n" patterns
  // that likely end a complete review item
  let lastGoodEnd = -1;
  const closingPattern = /\}\s*,/g;
  let match: RegExpExecArray | null;
  while ((match = closingPattern.exec(raw)) !== null) {
    lastGoodEnd = match.index + 1; // position after the "}"
  }

  if (lastGoodEnd === -1) {
    // Try to find at least one complete object ending with "}"
    const singleClose = raw.lastIndexOf("}");
    if (singleClose > itemsIdx) {
      lastGoodEnd = singleClose + 1;
    } else {
      throw new Error("Cannot repair: no complete items found");
    }
  }

  // Truncate after the last complete item, close the array and object
  const truncated = raw.slice(0, lastGoodEnd);
  const repaired = truncated + "\n]}";

  try {
    return JSON.parse(repaired);
  } catch {
    // One more attempt: maybe we cut inside a string, try one level up
    const prevEnd = raw.lastIndexOf("},", lastGoodEnd - 2);
    if (prevEnd > itemsIdx) {
      const repaired2 = raw.slice(0, prevEnd + 1) + "\n]}";
      return JSON.parse(repaired2);
    }
    throw new Error("Cannot repair truncated JSON");
  }
}
