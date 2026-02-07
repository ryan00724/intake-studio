import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  // Fetch the intake, strictly ensuring it is published
  const { data: intake, error } = await supabaseAdmin
    .from("intakes")
    .select("id, title, published_json, workspace_id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !intake) {
    // Return 404 to avoid leaking existence of unpublished intakes
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  // Return the published snapshot
  return NextResponse.json(intake);
}
