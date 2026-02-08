import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

// GET /api/workspaces — return the user's workspace (or claim an unclaimed one)
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Look for a workspace the user already owns
  const { data: owned, error: ownedErr } = await supabaseAdmin
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ownedErr) {
    return NextResponse.json({ error: ownedErr.message }, { status: 500 });
  }

  if (owned) {
    return NextResponse.json(owned);
  }

  // 2. No owned workspace — try to claim an unclaimed one (preserves existing data)
  const { data: unclaimed, error: unclaimedErr } = await supabaseAdmin
    .from("workspaces")
    .select("id, name")
    .is("owner_id", null)
    .limit(1)
    .maybeSingle();

  if (unclaimedErr) {
    return NextResponse.json({ error: unclaimedErr.message }, { status: 500 });
  }

  if (unclaimed) {
    // Claim it
    const { error: claimErr } = await supabaseAdmin
      .from("workspaces")
      .update({ owner_id: user.id })
      .eq("id", unclaimed.id);

    if (claimErr) {
      return NextResponse.json({ error: claimErr.message }, { status: 500 });
    }

    return NextResponse.json(unclaimed);
  }

  // 3. No workspace at all — return null so the client can create one
  return NextResponse.json(null);
}

// POST /api/workspaces — create a workspace for the authenticated user
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = body.name || "My Workspace";

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
