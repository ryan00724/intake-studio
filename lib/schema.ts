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

export const blockTypeSchema = z.enum(["context", "question", "image_choice"]);

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

export const intakeBlockSchema = z.discriminatedUnion("type", [
  contextBlockSchema,
  questionBlockSchema,
  imageChoiceBlockSchema,
]);

export const intakeSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  blocks: z.array(intakeBlockSchema),
});

export const intakeThemeSchema = z.object({
  accentColor: z.string().optional(),
  background: z.object({
    type: z.enum(["none", "color", "image"]),
    color: z.string().optional(),
    imageUrl: z.string().optional(),
    overlayOpacity: z.number().optional(),
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
