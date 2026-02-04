import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateIntakeSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { description, type } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `
      You are an expert form designer creating a "Guided Experience" intake flow.
      This intake will be presented as a sequence of sections (screens).
      
      Business Description: ${description}
      Intake Type: ${type || "General Intake"}

      Your goal is to generate a JSON object representing the structure of this guided intake.
      
      CRITICAL DESIGN INSTRUCTION:
      - Design this as a "Branch-Ready" flow.
      - Include 1 conditional/alternative path based on a key decision.
      - Do NOT create routing rules, edges, or connections. The user will connect nodes visually in the editor.
      - Instead, create SECTIONS that imply the branching structure through their Titles and Context.

      BRANCHING PATTERN TO USE:
      1. Create a "Decision Section" early in the flow (Section 2 or 3).
         - Must contain a single-choice question (inputType: 'select') that determines the path.
         - Example: "How clear is your vision?" -> Options: ["Very clear", "I need inspiration"]
      2. Create 2 alternative follow-up sections immediately after.
         - Title them clearly to indicate their purpose (e.g. "Path A: Vision Details", "Path B: Exploration").
         - Use a 'context' block at the start of these sections to explain who this section is for (e.g. "Since you have a clear vision, let's get specifics...").
      
      STRICT RULES:
      1. Output ONLY valid JSON.
      2. The JSON must strictly follow the schema defined below.
      3. Create 4-6 distinct sections total.
      4. Ensure every section has at least 1 context block + 1-3 interactive blocks.
      5. Use a mix of block types: 
         - 'context' for instructions or section intros (CRITICAL for flow context)
         - 'question' for user inputs
         - 'image_choice' for visual preference (good for "Exploration" paths)
         - 'this_not_this' for sorting visual likes/dislikes (excellent for "Exploration" paths)
         - 'image_moodboard' for curation (excellent for "Vision Details" paths)
      6. For 'question' blocks, select the most appropriate 'inputType':
         - 'short', 'long', 'date', 'file'
         - 'select' or 'multi' (MUST provide at least 2 options)
         - 'slider' (MAY provide 2 options for Min/Max labels e.g. ["Low", "High"])
      7. For visual blocks (image_choice, this_not_this, image_moodboard):
         - MUST include at least 2-4 items/options
         - Use valid placeholder image URLs (e.g. "https://placehold.co/400?text=Style+1")
      8. Ensure all IDs are non-empty strings (generate random short strings like "sec_1", "blk_a").
      9. NO routing fields, NO edges keys. Purely linear JSON structure.

      SCHEMA STRUCTURE:
      {
        "metadata": {
          "title": "Form Title",
          "description": "Welcome message / Introduction",
          "completionText": "Thank you message",
          "mode": "guided"
        },
        "sections": [
          {
            "id": "string",
            "title": "Section Title",
            "description": "Optional section description",
            "blocks": [
              {
                "type": "context",
                "id": "string",
                "text": "Instructional text"
              },
              {
                "type": "question",
                "id": "string",
                "label": "Question text",
                "helperText": "Optional helper text",
                "required": boolean,
                "inputType": "short" | "long" | "select" | "multi" | "slider" | "date" | "file",
                "options": ["Option 1", "Option 2"]
              },
              {
                "type": "image_choice",
                "id": "string",
                "label": "Label",
                "multi": boolean,
                "options": [
                  { "id": "string", "imageUrl": "https://...", "label": "Option Label" }
                ]
              },
              {
                "type": "image_moodboard",
                "id": "string",
                "label": "Moodboard",
                "items": [
                   { "id": "string", "imageUrl": "https://...", "caption": "Caption" }
                ]
              },
              {
                "type": "this_not_this",
                "id": "string",
                "label": "This / Not This",
                "items": [
                   { "id": "string", "imageUrl": "https://...", "caption": "Caption" }
                ]
              }
            ]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates JSON for a form builder.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error("No content received from OpenAI");
    }

    // OpenAI JSON mode guarantees valid JSON, but let's be safe
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Validate against Zod schema
    const validation = generateIntakeSchema.safeParse(parsedData);

    if (!validation.success) {
      console.error("Schema Validation Error:", validation.error);
      return NextResponse.json(
        { error: "Generated intake did not match expected structure", details: validation.error },
        { status: 422 }
      );
    }
    
    return NextResponse.json(validation.data);

  } catch (error) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate intake" },
      { status: 500 }
    );
  }
}
