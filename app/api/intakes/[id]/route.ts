import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

// GET /api/intakes/[id]
// Get a single intake (draft state)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // No auth check for now
  // const user = await getUser(req);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("intakes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/intakes/[id]
// Update intake (e.g. save draft)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // No auth check for now
  // const user = await getUser(req);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    
    // Whitelist allowed fields to update
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.draft_json !== undefined) updates.draft_json = body.draft_json;
    if (body.slug !== undefined) updates.slug = body.slug; // allow manual slug update if needed

    const { data, error } = await supabaseAdmin
      .from("intakes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/intakes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("intakes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
