import { z } from "zod";
import { IntakeSection, IntakeBlock } from "@/types/editor";

// ── Presentation blocks that never collect answers ──────────────────
const PRESENTATION_BLOCKS = new Set([
  "context",
  "heading",
  "divider",
  "image_display",
  "video_embed",
  "quote",
]);

// ── Build a Zod schema for a single block ───────────────────────────
function schemaForBlock(block: IntakeBlock): z.ZodTypeAny | null {
  if (PRESENTATION_BLOCKS.has(block.type)) return null;

  switch (block.type) {
    // ── Question blocks ───────────────────────────────────────────
    case "question": {
      const { inputType, required, label } = block;

      switch (inputType) {
        case "short":
        case "long":
        case "date":
        case "file":
        case "select": {
          let s: z.ZodTypeAny = z.string();
          if (required) {
            s = (s as z.ZodString).min(1, { message: `${label} is required` });
          } else {
            s = z.union([s, z.literal(""), z.undefined()]).optional();
          }
          return s;
        }

        case "multi": {
          let s: z.ZodTypeAny = z.array(z.string());
          if (required) {
            s = (s as z.ZodArray<z.ZodString>).min(1, {
              message: `Select at least one option for ${label}`,
            });
          } else {
            s = s.optional();
          }
          return s;
        }

        case "slider": {
          // Sliders may arrive as number or coercible string
          const s = z.coerce.number();
          // 0 is a valid value, so required just means it must be a number (not undefined)
          return required ? s : s.optional();
        }

        default:
          return z.any().optional();
      }
    }

    // ── Image choice ──────────────────────────────────────────────
    case "image_choice": {
      const { multi, required, label } = block;
      if (multi) {
        let s: z.ZodTypeAny = z.array(z.string());
        if (required) {
          s = (s as z.ZodArray<z.ZodString>).min(1, {
            message: `Select at least one option for ${label}`,
          });
        } else {
          s = s.optional();
        }
        return s;
      } else {
        let s: z.ZodTypeAny = z.string();
        if (required) {
          s = (s as z.ZodString).min(1, { message: `${label} is required` });
        } else {
          s = z.union([s, z.literal(""), z.undefined()]).optional();
        }
        return s;
      }
    }

    // ── This-not-this (array of {id, bucket} selections) ─────────
    case "this_not_this":
      return z
        .array(
          z.object({
            id: z.string(),
            bucket: z.enum(["this", "not_this"]),
          })
        )
        .optional();

    // ── Moodboard (array of selected item IDs) ───────────────────
    case "image_moodboard":
      return z.array(z.string()).optional();

    // ── Link preview (array of link objects) ─────────────────────
    case "link_preview": {
      const item = z.object({
        id: z.string(),
        url: z.string().url(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        screenshot: z.string().optional(),
        domain: z.string().optional(),
      });
      let s: z.ZodTypeAny = z.array(item);
      if (block.required) {
        s = (s as z.ZodArray<typeof item>).min(1, {
          message: `${block.label} requires at least one link`,
        });
      } else {
        s = s.optional();
      }
      return s;
    }

    // ── Book call (tracks click) ─────────────────────────────────
    case "book_call":
      return z
        .object({ clicked: z.boolean() })
        .optional();

    default:
      return z.any().optional();
  }
}

// ── Generate a Zod schema from sections ─────────────────────────────
// Used client-side (original function preserved for backwards compat)
export function generateSchema(sections: IntakeSection[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const section of sections) {
    for (const block of section.blocks) {
      const s = schemaForBlock(block);
      if (s) shape[block.id] = s;
    }
  }

  return z.object(shape);
}

// ── Server-side submission validation ───────────────────────────────
export interface ValidationError {
  blockId: string;
  label: string;
  message: string;
}

export interface ServerValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized: Record<string, unknown>;
}

const MAX_STRING_LENGTH = 10_000; // Guard against huge payloads

/**
 * Validate and sanitize a submission against the published intake.
 *
 * @param sections  – The published intake's sections
 * @param answers   – The raw answers object from the client
 * @param visitedSectionIds – Section IDs the user actually visited (from metadata.sectionPath).
 *                            If undefined, all sections are validated (document mode).
 */
export function validateSubmission(
  sections: IntakeSection[],
  answers: Record<string, unknown>,
  visitedSectionIds?: string[]
): ServerValidationResult {
  const errors: ValidationError[] = [];
  const sanitized: Record<string, unknown> = {};

  // Determine which sections to validate
  const sectionsToValidate = visitedSectionIds
    ? sections.filter((s) => visitedSectionIds.includes(s.id))
    : sections;

  // Build a block lookup for label resolution
  const blockLookup = new Map<string, IntakeBlock>();
  for (const section of sectionsToValidate) {
    for (const block of section.blocks) {
      blockLookup.set(block.id, block);
    }
  }

  // Validate each block in the visited sections
  for (const section of sectionsToValidate) {
    for (const block of section.blocks) {
      const schema = schemaForBlock(block);
      if (!schema) continue; // Presentation block, no answer expected

      const raw = answers[block.id];

      // Sanitize strings: trim and cap length
      const value = sanitizeValue(raw);

      const result = schema.safeParse(value);

      if (!result.success) {
        const label =
          ("label" in block ? block.label : undefined) ||
          ("title" in block ? block.title : undefined) ||
          block.id;

        for (const issue of result.error.issues) {
          errors.push({
            blockId: block.id,
            label: label as string,
            message: issue.message,
          });
        }
      } else {
        // Only include in sanitized output if the user provided a value
        if (value !== undefined && value !== null && value !== "") {
          sanitized[block.id] = result.data;
        }
      }
    }
  }

  // Also carry forward any answers for blocks outside validated sections
  // (edge case: user navigated but section wasn't in the path array)
  for (const [key, val] of Object.entries(answers)) {
    if (!(key in sanitized) && val !== undefined && val !== null && val !== "") {
      sanitized[key] = sanitizeValue(val);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > MAX_STRING_LENGTH
      ? trimmed.slice(0, MAX_STRING_LENGTH)
      : trimmed;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = sanitizeValue(v);
    }
    return obj;
  }
  return value;
}
