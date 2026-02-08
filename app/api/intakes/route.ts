import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";
import { z } from "zod";

const CreateIntakeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer")
    .trim(),
  workspace_id: z.string().uuid("Invalid workspace ID"),
});

// GET /api/intakes
// List intakes belonging to the authenticated user's workspaces
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the user's workspace IDs
  const { data: workspaces, error: wsErr } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id);

  if (wsErr) {
    return NextResponse.json({ error: wsErr.message }, { status: 500 });
  }

  const wsIds = workspaces?.map((w) => w.id) || [];

  if (wsIds.length === 0) {
    // User has no workspaces yet — return empty list
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("intakes")
    .select("id, title, slug, is_published, created_at, updated_at, workspace_id, draft_json, submissions(count)")
    .in("workspace_id", wsIds)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/intakes
// Create a new intake in the user's workspace
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateIntakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { title, workspace_id } = parsed.data;

    // Verify the workspace belongs to this user
    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("id", workspace_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (wsErr || !ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
    }

    // Generate slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slugSuffix = Math.floor(Math.random() * 10000);
    slug = `${slug}-${slugSuffix}`;

    const { data, error } = await supabaseAdmin
      .from("intakes")
      .insert({
        title,
        workspace_id,
        slug,
        draft_json: {},
        is_published: false,
      })
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
