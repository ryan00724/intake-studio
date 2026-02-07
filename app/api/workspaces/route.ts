import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";

// GET /api/workspaces — return first workspace (or null)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("id, name")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — that's fine, return null
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data); // null when no workspace exists
}

// POST /api/workspaces — create a workspace
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || "My Workspace";

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .insert({ name })
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
