import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateIntakeSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { description, type, complexity } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Map complexity to structural guidance
    const complexityMap: Record<string, { sections: string; blocks: string; decisionPoints: string; paths: string; terminals: string; branchGuide: string }> = {
      simple: {
        sections: "2-3",
        blocks: "1-2 interactive blocks per section",
        decisionPoints: "0-1",
        paths: "1-2",
        terminals: "1",
        branchGuide: "Keep the flow mostly linear. You MAY include one optional fork with 2 paths that reconverge into a single ending.",
      },
      medium: {
        sections: "4-6",
        blocks: "1-3 interactive blocks per section",
        decisionPoints: "1-2",
        paths: "2-3",
        terminals: "1-2",
        branchGuide: "Include 1-2 decision points. The first fork should split into 2-3 paths. Paths may reconverge OR lead to different terminal sections. You may include a second decision point inside one of the paths for depth.",
      },
      detailed: {
        sections: "7-12",
        blocks: "2-4 interactive blocks per section",
        decisionPoints: "2-3",
        paths: "3-5",
        terminals: "2-3",
        branchGuide: "Create a rich multi-path flow. Include 2-3 decision points. The first fork should split into 3+ paths. At least one path should contain a nested decision point that further branches. Create 2-3 distinct terminal sections representing different outcomes (e.g. 'Final: Full Package', 'Final: Quick Start', 'Final: Consultation'). NOT all paths should converge to the same ending.",
      },
    };
    const guide = complexityMap[complexity] || complexityMap.medium;

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
      Complexity: ${complexity || "medium"} (target ${guide.sections} sections, ${guide.blocks})

      Your goal is to generate a JSON object representing the structure of this guided intake.
      
      STRUCTURAL TARGETS:
      - Decision points: ${guide.decisionPoints}
      - Distinct paths: ${guide.paths}
      - Terminal sections (sections with no routing that end the flow): ${guide.terminals}
      - ${guide.branchGuide}

      BRANCHING GUIDELINES:
      1. Decision points are sections containing a single-choice question (inputType: 'select' or an 'image_choice' block) whose answer determines which section comes next.
      2. Each decision point can branch into 2, 3, or even 4 paths -- NOT always just 2.
         - Create one routing rule per option value, each pointing to a DIFFERENT nextSectionId.
      3. Paths can themselves contain further decision points (nested branching). This creates depth.
      4. Terminal sections are sections with NO routing rules. The flow ends there and the user sees the completion screen.
         - For medium/detailed complexity, create MULTIPLE terminal sections representing different outcomes.
         - Name terminal sections clearly, e.g. "Wrap-Up: Full Service", "Wrap-Up: Quick Start".
      5. Some branches MAY reconverge into a shared section, but this is OPTIONAL -- do NOT force all paths to merge.
      6. Use a 'context' block at the start of branched sections to orient the user (e.g. "Since you selected X, let's dive into...").

      EXAMPLE FLOW STRUCTURE (for detailed complexity):
      Section 1 (Welcome) -> routing: any -> Section 2
      Section 2 (Decision A: 3 options) -> routing: equals ->
        Option 1 -> Section 3 (Path A)
        Option 2 -> Section 4 (Path B)
        Option 3 -> Section 5 (Path C)
      Section 3 (Path A) -> routing: any -> Section 8 (Terminal: Full)
      Section 4 (Path B) -> routing: any -> Section 6 (Decision B)
      Section 5 (Path C) -> routing: any -> Section 7 (Terminal: Quick)
      Section 6 (Decision B: 2 options) -> routing: equals ->
        Option X -> Section 8 (Terminal: Full)
        Option Y -> Section 7 (Terminal: Quick)
      Section 7 (Terminal: Quick) -- NO routing, flow ends
      Section 8 (Terminal: Full) -- NO routing, flow ends

      STRICT RULES:
      1. Output ONLY valid JSON.
      2. The JSON must strictly follow the schema defined below.
      3. Create ${guide.sections} distinct sections total.
      4. Ensure every section has at least 1 context block + ${guide.blocks}.
      5. Use a mix of block types: 
         - 'context' for instructions or section intros (CRITICAL for flow context)
         - 'question' for user inputs
         - 'image_choice' for visual preference
         - 'this_not_this' for sorting visual likes/dislikes
         - 'image_moodboard' for curation
      6. For 'question' blocks, select the most appropriate 'inputType':
         - 'short', 'long', 'date', 'file'
         - 'select' or 'multi' (MUST provide at least 2 options)
         - 'slider' (MAY provide 2 options for Min/Max labels e.g. ["Low", "High"])
      7. For visual blocks (image_choice, this_not_this, image_moodboard):
         - MUST include at least 2-4 items/options
         - Use valid placeholder image URLs (e.g. "https://placehold.co/400?text=Style+1")
      8. Ensure all IDs are non-empty strings (generate random short strings like "sec_1", "blk_a").

      ROUTING RULES (CRITICAL -- read carefully):
      - Every section MUST have a "routing" array (can be empty [] for terminal sections).
      - Each routing rule: { "id": "rule_X", "operator": "equals" | "any", "fromBlockId": "block id (for equals)", "value": "option value (for equals)", "nextSectionId": "target section id" }
      - Use "equals" when a select question or image_choice block drives the branch:
        * "fromBlockId" must reference the block id of the select/image_choice question in that section.
        * "value" must be an EXACT option string (for select) or option id (for image_choice).
        * Create ONE "equals" rule PER option value, each pointing to a DIFFERENT nextSectionId when you want multi-way branching.
      - Use "any" as a fallback/unconditional route to the next section (omit fromBlockId and value). Use this for linear connections.
      - At most ONE "any" rule per section.
      - Terminal sections (flow endpoints) should have an EMPTY routing array: "routing": [].
      - Every NON-terminal section MUST have at least one routing rule.
      - Do NOT route every path back to the same final section unless the flow is truly simple.

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
            ],
            "routing": [
              {
                "id": "rule_1",
                "operator": "equals",
                "fromBlockId": "block_id_of_select_question",
                "value": "Option 1",
                "nextSectionId": "target_section_id"
              },
              {
                "id": "rule_2",
                "operator": "equals",
                "fromBlockId": "block_id_of_select_question",
                "value": "Option 2",
                "nextSectionId": "another_section_id"
              },
              {
                "id": "rule_3",
                "operator": "any",
                "nextSectionId": "fallback_section_id"
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
