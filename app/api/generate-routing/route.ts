import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateRoutingSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { sections, prompt } = await req.json();

    if (!sections || !Array.isArray(sections) || sections.length < 2) {
      return NextResponse.json(
        { error: "At least 2 sections are required to generate routing." },
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

    // Build a compact representation of sections for the LLM
    const sectionSummary = sections.map((s: any) => {
      const blocks = (s.blocks || []).map((b: any) => {
        if (b.type === "question" && b.inputType === "select") {
          return {
            id: b.id,
            type: "question",
            inputType: "select",
            label: b.label,
            options: b.options || [],
          };
        }
        if (b.type === "image_choice") {
          return {
            id: b.id,
            type: "image_choice",
            label: b.label,
            options: (b.options || []).map((o: any) => ({
              id: o.id,
              label: o.label || "Untitled",
            })),
          };
        }
        return { id: b.id, type: b.type, label: b.label || b.text?.substring(0, 60) || "(content)" };
      });

      return {
        id: s.id,
        title: s.title || "Untitled Section",
        description: s.description || "",
        blocks,
        existingRouting: s.routing || [],
      };
    });

    const systemPrompt = `You are an expert flow designer for guided intake forms. You analyze form sections and create intelligent routing rules that connect them into a logical flow.

IMPORTANT RULES:
1. Output ONLY valid JSON matching the schema below.
2. Every routing rule must reference REAL section IDs and block IDs from the provided data.
3. For "equals" rules, the value MUST be an actual option from the referenced block:
   - For "question" blocks with inputType "select": use the exact option string from the options array.
   - For "image_choice" blocks: use the option "id" (NOT the label) as the value.
4. For "any" rules (fallback): omit fromBlockId and value. Use these when a section should always route to a specific next section (e.g. informational sections, or catch-all after conditional branches).
5. A section should have AT MOST one "any" (fallback) rule.
6. Evaluate conditional ("equals") routes first, then fallback ("any") routes. This is how the runtime works.
7. Do NOT create routing for the last logical section (it leads to completion automatically).
8. Every section (except terminal ones) should have at least one outgoing route.
9. If a section has a select/image_choice question that implies branching, create "equals" rules for each meaningful option.
10. If a section has no select questions, use an "any" rule to connect it to the next logical section.

RESPONSE SCHEMA:
{
  "routing": [
    {
      "sectionId": "id of the source section",
      "rules": [
        {
          "id": "unique rule id (use format: rule_1, rule_2, etc.)",
          "fromBlockId": "block id (required for equals, omit for any)",
          "operator": "equals" | "any",
          "value": "option value (required for equals, omit for any)",
          "nextSectionId": "id of the target section"
        }
      ]
    }
  ],
  "explanation": "Brief explanation of the routing logic you created"
}`;

    const userPrompt = `Here are the sections in the intake flow:

${JSON.stringify(sectionSummary, null, 2)}

${prompt ? `User's routing intent: "${prompt}"` : "Create the most logical routing flow based on the section structure and questions."}

Analyze the sections, their questions and options, and generate routing rules that create a coherent guided flow. Use conditional branching where select/image_choice questions naturally suggest different paths. Use fallback ("any") routing for sections without branching questions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error("No content received from OpenAI");
    }

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

    // Validate against schema
    const validation = generateRoutingSchema.safeParse(parsedData);

    if (!validation.success) {
      console.error("Schema Validation Error:", validation.error);
      return NextResponse.json(
        { error: "Generated routing did not match expected structure", details: validation.error },
        { status: 422 }
      );
    }

    // Additional safety: ensure all referenced IDs actually exist
    const sectionIds = new Set(sections.map((s: any) => s.id));
    const blockIds = new Set(sections.flatMap((s: any) => (s.blocks || []).map((b: any) => b.id)));

    for (const entry of validation.data.routing) {
      if (!sectionIds.has(entry.sectionId)) {
        return NextResponse.json(
          { error: `AI referenced non-existent section: ${entry.sectionId}` },
          { status: 422 }
        );
      }
      for (const rule of entry.rules) {
        if (!sectionIds.has(rule.nextSectionId)) {
          return NextResponse.json(
            { error: `AI referenced non-existent target section: ${rule.nextSectionId}` },
            { status: 422 }
          );
        }
        if (rule.operator === "equals" && rule.fromBlockId && !blockIds.has(rule.fromBlockId)) {
          return NextResponse.json(
            { error: `AI referenced non-existent block: ${rule.fromBlockId}` },
            { status: 422 }
          );
        }
      }
    }

    return NextResponse.json(validation.data);
  } catch (error) {
    console.error("Routing Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate routing" },
      { status: 500 }
    );
  }
}
