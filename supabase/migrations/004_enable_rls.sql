-- ═══════════════════════════════════════════════════════════════════
-- Enable Row Level Security on all tables.
--
-- The app's API routes use the service-role client (supabaseAdmin),
-- which bypasses RLS. These policies are defense-in-depth: they
-- protect data if someone uses the public anon key directly.
-- ═══════════════════════════════════════════════════════════════════

-- Turn RLS on (overrides the DISABLE from 001_init.sql)
ALTER TABLE public.workspaces  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intakes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;


-- ─── WORKSPACES ─────────────────────────────────────────────────

-- Owners can read their own workspaces
CREATE POLICY "workspace_select_owner" ON public.workspaces
  FOR SELECT USING (owner_id = auth.uid());

-- Authenticated users can create workspaces (must set themselves as owner)
CREATE POLICY "workspace_insert_auth" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Owners can update their own workspaces
CREATE POLICY "workspace_update_owner" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Owners can delete their own workspaces
CREATE POLICY "workspace_delete_owner" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());


-- ─── INTAKES ────────────────────────────────────────────────────

-- Owners can read intakes in their workspaces
CREATE POLICY "intake_select_owner" ON public.intakes
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Anyone can read published intakes (needed for public /i/[slug] pages)
CREATE POLICY "intake_select_published" ON public.intakes
  FOR SELECT USING (is_published = true);

-- Owners can create intakes in their workspaces
CREATE POLICY "intake_insert_owner" ON public.intakes
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Owners can update intakes in their workspaces
CREATE POLICY "intake_update_owner" ON public.intakes
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Owners can delete intakes in their workspaces
CREATE POLICY "intake_delete_owner" ON public.intakes
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );


-- ─── SUBMISSIONS ────────────────────────────────────────────────

-- Owners can read submissions for their intakes
CREATE POLICY "submission_select_owner" ON public.submissions
  FOR SELECT USING (
    intake_id IN (
      SELECT i.id FROM public.intakes i
      JOIN public.workspaces w ON i.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

-- Anyone can submit to a published intake (public form submissions)
CREATE POLICY "submission_insert_public" ON public.submissions
  FOR INSERT WITH CHECK (
    intake_id IN (SELECT id FROM public.intakes WHERE is_published = true)
  );

-- Owners can delete submissions for their intakes
CREATE POLICY "submission_delete_owner" ON public.submissions
  FOR DELETE USING (
    intake_id IN (
      SELECT i.id FROM public.intakes i
      JOIN public.workspaces w ON i.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );
