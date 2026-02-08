import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { validateSubmission } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 10 submissions per IP per 15-minute window
const RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  // Rate-limit by IP
  const ip = getClientIp(req);
  const rl = rateLimit(`submit:${ip}`, RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { answers, metadata } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    // 1. Verify intake exists and is published, fetch published_json for validation
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("intakes")
      .select("id, published_json")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    // 2. Validate answers against the published intake schema
    const publishedSections = intake.published_json?.sections;

    if (publishedSections && Array.isArray(publishedSections)) {
      // In guided mode, only validate sections the user actually visited
      const visitedSectionIds: string[] | undefined = metadata?.sectionPath;

      const validation = validateSubmission(
        publishedSections,
        answers,
        Array.isArray(visitedSectionIds) ? visitedSectionIds : undefined
      );

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validation.errors,
          },
          { status: 422 }
        );
      }

      // Use sanitized answers (trimmed strings, capped lengths)
      const sanitizedAnswers = validation.sanitized;

      // 3. Insert validated submission
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("submissions")
        .insert({
          intake_id: intake.id,
          answers: sanitizedAnswers,
          metadata: sanitizeMetadata(metadata),
        })
        .select("id")
        .single();

      if (submissionError) {
        console.error("Submission error:", submissionError);
        return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
      }

      return NextResponse.json({ id: submission.id }, { status: 201 });
    }

    // Fallback: no sections in published_json — accept as-is (shouldn't normally happen)
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        intake_id: intake.id,
        answers,
        metadata: sanitizeMetadata(metadata),
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

/** Strip metadata down to expected fields to prevent abuse */
function sanitizeMetadata(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};

  const raw = meta as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  if (typeof raw.completedAt === "string") {
    clean.completedAt = raw.completedAt.slice(0, 50); // ISO date string
  }
  if (Array.isArray(raw.sectionPath)) {
    clean.sectionPath = raw.sectionPath
      .filter((s): s is string => typeof s === "string")
      .slice(0, 100); // Cap at 100 sections
  }

  return clean;
}
