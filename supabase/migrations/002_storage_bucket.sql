-- Create a public storage bucket for intake assets (images, files, etc.)
insert into storage.buckets (id, name, public)
values ('intake-assets', 'intake-assets', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public read access"
on storage.objects for select
using (bucket_id = 'intake-assets');

-- Allow uploads via service role (API routes use service role key)
create policy "Service role upload"
on storage.objects for insert
with check (bucket_id = 'intake-assets');

-- Allow service role to delete objects
create policy "Service role delete"
on storage.objects for delete
using (bucket_id = 'intake-assets');
