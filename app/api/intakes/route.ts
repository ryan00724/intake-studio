import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

// GET /api/intakes
// List intakes (optionally filter by workspace_id)
export async function GET(req: NextRequest) {
  // No auth check for now
  // const user = await getUser(req);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  
  // Return all intakes if no workspace specified, or filter
  let query = supabaseAdmin.from("intakes").select("id, title, slug, is_published, created_at, updated_at, workspace_id, draft_json, submissions(count)");

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/intakes
// Create a new intake
export async function POST(req: NextRequest) {
  // No auth check for now
  // const user = await getUser(req);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, workspace_id } = body;

    if (!title || !workspace_id) {
      return NextResponse.json({ error: "Title and workspace_id are required" }, { status: 400 });
    }

    // Generate slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Ensure uniqueness by appending timestamp if needed
    // A better way is to retry or check DB, but timestamp is safe enough for MVP
    const slugSuffix = Math.floor(Math.random() * 10000);
    slug = `${slug}-${slugSuffix}`;

    const { data, error } = await supabaseAdmin
      .from("intakes")
      .insert({
        title,
        workspace_id,
        slug,
        draft_json: {}, // Empty draft initially
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
