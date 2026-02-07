-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Intakes
create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null default 'Untitled Intake',
  slug text unique not null,
  draft_json jsonb default '{}'::jsonb not null,
  published_json jsonb,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid references public.intakes(id) on delete cascade not null,
  answers jsonb not null default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index idx_intakes_workspace on public.intakes(workspace_id);
create index idx_intakes_slug on public.intakes(slug);
create index idx_submissions_intake on public.submissions(intake_id);

-- Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_intakes_updated_at
before update on public.intakes
for each row
execute procedure update_updated_at_column();

-- DISABLE RLS for no-auth mode
alter table public.workspaces disable row level security;
alter table public.intakes disable row level security;
alter table public.submissions disable row level security;
