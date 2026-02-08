-- Add owner_id column to workspaces to link them to authenticated users.
-- Nullable so existing workspaces continue to work until claimed by the first user who logs in.
ALTER TABLE public.workspaces 
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Index for fast lookup by owner
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
