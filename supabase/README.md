# Supabase Setup

This project uses Supabase for database and real-time features.

## Applying Migrations

You can apply the SQL migrations in two ways:

### Option 1: Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard.
2. Navigate to **SQL Editor**.
3. Open `supabase/migrations/001_init.sql` in your local editor.
4. Copy the entire content.
5. Paste it into the SQL Editor in the dashboard and click **Run**.

### Option 2: Supabase CLI
If you have the Supabase CLI installed and linked:
```bash
supabase db push
```

## Environment Variables
Ensure you have added your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Tables Created
- `workspaces`: High-level grouping for intakes.
- `intakes`: Stores draft/published JSON states.
- `submissions`: Stores user responses.

## Storage Bucket

The project uses a Supabase Storage bucket called `intake-assets` for file uploads (images, documents, etc.).

**Option A:** Apply `supabase/migrations/002_storage_bucket.sql` via the SQL Editor (same as above).

**Option B:** Create it manually via the Supabase dashboard:
1. Go to **Storage** in your Supabase project.
2. Click **New Bucket**.
3. Name it `intake-assets` and set it to **Public**.
4. Save.
