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
      You are an expert form designer. Create a professional client intake form based on the following requirements.

      Business Description: ${description}
      Intake Type: ${type || "General Intake"}

      Your goal is to generate a JSON object representing the structure of the intake form.
      
      STRICT RULES:
      1. Output ONLY valid JSON.
      2. The JSON must strictly follow the schema defined below.
      3. Create 3-6 distinct sections with clear titles.
      4. Ensure every section has at least 2 blocks.
      5. Use a mix of block types: 
         - 'context' for instructions or section intros
         - 'question' for user inputs (mix different inputTypes thoughtfully)
         - 'image_choice' ONLY if visual preference is relevant (max 1-2 per form)
      6. For 'question' blocks, select the most appropriate 'inputType':
         - 'short' for names, emails, single lines
         - 'long' for descriptions, feedback
         - 'select' or 'multi' for distinct choices (MUST provide at least 2 options)
         - 'slider' for range/scale questions (e.g. budget, priority). You MAY provide 2 options for Min/Max labels (e.g. ["Low", "High"]).
         - 'date' for timelines
         - 'file' for attachments
      7. For 'image_choice' blocks:
         - MUST include at least 2 options
         - Use valid placeholder image URLs (e.g. "https://placehold.co/400?text=Option+1")
      8. Ensure all IDs are non-empty strings (generate random short strings like "sec_1", "blk_a").
      9. Keep the tone professional, clear, and neutral. Avoid jargon unless implied by the description.

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
                "options": ["Option 1", "Option 2"] // REQUIRED for select/multi, OPTIONAL for slider (min/max labels), FORBIDDEN otherwise
              },
              {
                "type": "image_choice",
                "id": "string",
                "label": "Label",
                "multi": boolean,
                "options": [
                  {
                    "id": "string",
                    "imageUrl": "https://...",
                    "label": "Option Label"
                  }
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
