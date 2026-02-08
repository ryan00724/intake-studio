import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/supabase/auth-utils";
import { z } from "zod";

const UpdateIntakeSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be 200 characters or fewer")
      .trim()
      .optional(),
    slug: z
      .string()
      .min(1, "Slug cannot be empty")
      .max(120, "Slug must be 120 characters or fewer")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    draft_json: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/**
 * Verify that the authenticated user owns the intake (via workspace).
 * Returns the intake data if authorized, or a 403/404 response.
 */
async function verifyOwnership(intakeId: string, userId: string) {
  const { data: intake, error } = await supabaseAdmin
    .from("intakes")
    .select("*, workspaces!inner(owner_id)")
    .eq("id", intakeId)
    .single();

  if (error || !intake) {
    return { intake: null, error: "Intake not found" as const, status: 404 as const };
  }

  // Check workspace ownership
  const wsOwner = (intake as any).workspaces?.owner_id;
  if (wsOwner && wsOwner !== userId) {
    return { intake: null, error: "Forbidden" as const, status: 403 as const };
  }

  return { intake, error: null, status: 200 as const };
}

// GET /api/intakes/[id]
// Get a single intake (draft state)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { intake, error, status } = await verifyOwnership(id, user.id);

  if (!intake) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(intake);
}

// PATCH /api/intakes/[id]
// Update intake (e.g. save draft)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { intake: existing, error: ownerErr, status: ownerStatus } = await verifyOwnership(id, user.id);

  if (!existing) {
    return NextResponse.json({ error: ownerErr }, { status: ownerStatus });
  }

  try {
    const body = await req.json();
    const parsed = UpdateIntakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.draft_json !== undefined) updates.draft_json = parsed.data.draft_json;
    if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug;

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
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/intakes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { intake: existing, error: ownerErr, status: ownerStatus } = await verifyOwnership(id, user.id);

  if (!existing) {
    return NextResponse.json({ error: ownerErr }, { status: ownerStatus });
  }

  const { error } = await supabaseAdmin
    .from("intakes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
