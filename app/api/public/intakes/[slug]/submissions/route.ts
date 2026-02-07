import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { answers, metadata } = body;

    if (!answers) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    // 1. Verify intake exists and is published
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("intakes")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    // 2. Insert submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        intake_id: intake.id,
        answers,
        metadata: metadata || {},
      })
      .select("id")
      .single();

    if (submissionError) {
      console.error("Submission error:", submissionError);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    return NextResponse.json({ id: submission.id }, { status: 201 });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
