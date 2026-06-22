create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text,
  website_url text not null,
  domain text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_extractions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null default 'firecrawl',
  source_url text not null,
  title text,
  description text,
  branding jsonb not null,
  raw_metadata jsonb,
  captured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists brand_extractions_project_id_created_at_idx
  on public.brand_extractions (project_id, created_at desc);

create index if not exists brand_extractions_provider_idx
  on public.brand_extractions (provider);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.brand_extractions enable row level security;

create policy "Public can read projects"
on public.projects
for select
to anon, authenticated
using (true);

create policy "Public can read brand extractions"
on public.brand_extractions
for select
to anon, authenticated
using (true);

