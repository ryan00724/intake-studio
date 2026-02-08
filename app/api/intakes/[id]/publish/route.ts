import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";
import { validateFlow } from "@/src/lib/flow-validation";

// POST /api/intakes/[id]/publish
// Validate draft, then publish draft -> published
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 1. Fetch current draft and verify ownership
  const { data: intake, error: fetchError } = await supabaseAdmin
    .from("intakes")
    .select("draft_json, workspaces!inner(owner_id)")
    .eq("id", id)
    .single();

  if (fetchError || !intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  const wsOwner = (intake as any).workspaces?.owner_id;
  if (wsOwner && wsOwner !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const draft = intake.draft_json as Record<string, unknown> | null;

  // 2. Basic structure check
  if (!draft || typeof draft !== "object") {
    return NextResponse.json({ error: "Draft is empty" }, { status: 422 });
  }

  const sections = Array.isArray(draft.sections) ? draft.sections : [];

  if (sections.length === 0) {
    return NextResponse.json(
      { error: "Cannot publish an intake with no sections" },
      { status: 422 }
    );
  }

  // 3. Validate flow (routing integrity, reachability, cycles)
  const flowResult = validateFlow(sections);

  if (!flowResult.isValid) {
    return NextResponse.json(
      {
        error: "Flow validation failed",
        details: flowResult.errors.map((e) => e.message),
        warnings: flowResult.warnings.map((w) => w.message),
      },
      { status: 422 }
    );
  }

  // 4. Publish: copy draft_json to published_json
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
