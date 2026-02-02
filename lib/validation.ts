import { z } from "zod";
import { IntakeSection } from "@/types/editor";

export function generateSchema(sections: IntakeSection[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  sections.forEach((section) => {
    section.blocks.forEach((block) => {
        if (block.type === "context") return;

        let fieldSchema: z.ZodTypeAny;

        switch (block.inputType) {
            case "short":
            case "long":
            case "select":
            case "date":
            case "file":
                fieldSchema = z.string();
                if (block.required) {
                    fieldSchema = (fieldSchema as z.ZodString).min(1, { message: `${block.label} is required` });
                } else {
                    fieldSchema = (fieldSchema as z.ZodString).optional();
                }
                break;
            case "multi": // Array of strings?
                fieldSchema = z.array(z.string());
                if (block.required) {
                    fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, { message: `Select at least one option for ${block.label}` });
                }
                 else {
                    fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).optional();
                }
                break;
            case "slider":
                // Assuming string or number, let's say number for now but input range returns string usually unless controlled
                fieldSchema = z.coerce.number(); // force number
                 if (block.required) {
                    // 0 might be valid, so just check type
                }
                break;
            default:
                fieldSchema = z.any();
        }

        schemaShape[block.id] = fieldSchema;
    });
  });

  return z.object(schemaShape);
}
