import { z } from "zod";

export const inputTypeSchema = z.enum([
  "short",
  "long",
  "select",
  "multi",
  "slider",
  "date",
  "file",
]);

export const blockTypeSchema = z.enum(["context", "question", "image_choice", "image_moodboard", "this_not_this", "link_preview", "book_call"]);

export const baseBlockSchema = z.object({
  id: z.string(),
  type: blockTypeSchema,
});

export const contextBlockSchema = baseBlockSchema.extend({
  type: z.literal("context"),
  text: z.string(),
});

export const questionBlockSchema = baseBlockSchema.extend({
  type: z.literal("question"),
  label: z.string(),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
  inputType: inputTypeSchema,
  options: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.inputType === "select" || data.inputType === "multi") {
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Options are required and must have at least 2 items for select/multi inputs",
        path: ["options"],
      });
    }
  } else if (data.inputType === "slider") {
    // Slider allows options for min/max labels (optional)
  } else {
    if (data.options && data.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Options are not allowed for this input type",
        path: ["options"],
      });
    }
  }
});

export const imageChoiceOptionSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  label: z.string().optional(),
});

export const imageChoiceBlockSchema = baseBlockSchema.extend({
  type: z.literal("image_choice"),
  label: z.string(),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
  multi: z.boolean().optional(),
  options: z.array(imageChoiceOptionSchema).min(2),
});

export const imageMoodboardItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  caption: z.string().optional(),
});

export const imageMoodboardBlockSchema = baseBlockSchema.extend({
  type: z.literal("image_moodboard"),
  label: z.string(),
  helperText: z.string().optional(),
  items: z.array(imageMoodboardItemSchema),
});

export const thisNotThisItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  caption: z.string().optional(),
});

export const thisNotThisBlockSchema = baseBlockSchema.extend({
  type: z.literal("this_not_this"),
  label: z.string(),
  helperText: z.string().optional(),
  items: z.array(thisNotThisItemSchema),
});

export const linkPreviewBlockSchema = baseBlockSchema.extend({
  type: z.literal("link_preview"),
  label: z.string(),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
  maxItems: z.number().optional(),
});

export const bookCallBlockSchema = baseBlockSchema.extend({
  type: z.literal("book_call"),
  title: z.string().optional(),
  text: z.string().optional(),
  bookingUrl: z.string(),
  buttonLabel: z.string().optional(),
  openInNewTab: z.boolean().optional(),
  requiredToContinue: z.boolean().optional(),
});

export const intakeBlockSchema = z.discriminatedUnion("type", [
  contextBlockSchema,
  questionBlockSchema,
  imageChoiceBlockSchema,
  imageMoodboardBlockSchema,
  thisNotThisBlockSchema,
  linkPreviewBlockSchema,
  bookCallBlockSchema,
]);

export const sectionRouteRuleSchema = z.object({
  id: z.string(),
  fromBlockId: z.string().optional(),
  operator: z.enum(["equals", "any"]),
  value: z.string().optional(),
  nextSectionId: z.string(),
});

export const intakeSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  blocks: z.array(intakeBlockSchema),
  routing: z.array(sectionRouteRuleSchema).optional(),
});

export const intakeThemeSchema = z.object({
  accentColor: z.string().optional(),
  background: z.object({
    type: z.enum(["none", "color", "image", "video"]),
    color: z.string().optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    overlayOpacity: z.number().optional(),
    overlayColor: z.string().optional(),
    blurPx: z.number().optional(),
  }).optional(),
}).optional();

export const intakeMetadataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  completionText: z.string().optional(),
  mode: z.enum(["guided", "document"]).optional(),
  theme: intakeThemeSchema,
});

export const generateIntakeSchema = z.object({
  metadata: intakeMetadataSchema,
  sections: z.array(intakeSectionSchema),
});

export type GenerateIntakeResponse = z.infer<typeof generateIntakeSchema>;
