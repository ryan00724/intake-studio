import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

// POST /api/intakes/[id]/publish
// Publish draft -> published
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // No auth check for now
  // const user = await getUser(req);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 1. Fetch current draft
  const { data: intake, error: fetchError } = await supabaseAdmin
    .from("intakes")
    .select("draft_json")
    .eq("id", id)
    .single();

  if (fetchError || !intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  // 2. Update published_json with draft_json and set is_published = true
  const { data, error: updateError } = await supabaseAdmin
    .from("intakes")
    .update({
      published_json: intake.draft_json,
      is_published: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
