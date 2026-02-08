import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

/**
 * Verify the authenticated user owns this intake (via workspace).
 */
async function verifyIntakeOwner(intakeId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("intakes")
    .select("id, workspaces!inner(owner_id)")
    .eq("id", intakeId)
    .single();

  if (error || !data) return false;
  const wsOwner = (data as any).workspaces?.owner_id;
  return !wsOwner || wsOwner === userId;
}

// GET /api/intakes/[id]/submissions
// Fetch all submissions for an intake (requires ownership)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await verifyIntakeOwner(id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("id, answers, metadata, created_at")
    .eq("intake_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/intakes/[id]/submissions
// Delete one or more submissions by ID (requires ownership)
// Body: { ids: string[] }
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await verifyIntakeOwner(id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const ids: string[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    // Only delete submissions that belong to this intake
    const { error } = await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("intake_id", id)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
