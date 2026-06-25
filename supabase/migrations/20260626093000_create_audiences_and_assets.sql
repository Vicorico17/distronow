create table if not exists public.brand_audiences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  summary text not null,
  pain_points text[] not null default '{}',
  goals text[] not null default '{}',
  buying_triggers text[] not null default '{}',
  objections text[] not null default '{}',
  channels text[] not null default '{}',
  content_angles text[] not null default '{}',
  is_primary boolean not null default false,
  source text not null default 'ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_audiences_project_id_created_at_idx
  on public.brand_audiences (project_id, created_at desc);

alter table public.brand_audiences enable row level security;

drop policy if exists "Public can read brand audiences" on public.brand_audiences;

create policy "Public can read brand audiences"
on public.brand_audiences
for select
to anon, authenticated
using (true);

drop trigger if exists set_brand_audiences_updated_at on public.brand_audiences;

create trigger set_brand_audiences_updated_at
before update on public.brand_audiences
for each row
execute function public.set_updated_at();

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  brand_extraction_id uuid references public.brand_extractions(id) on delete set null,
  audience_id uuid references public.brand_audiences(id) on delete set null,
  asset_type text not null,
  title text not null,
  brief text,
  prompt text,
  content jsonb not null default '{}'::jsonb,
  image_url text,
  storage_path text,
  provider text not null default 'openai',
  model text,
  status text not null default 'generated',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_assets_project_id_created_at_idx
  on public.marketing_assets (project_id, created_at desc);

create index if not exists marketing_assets_asset_type_idx
  on public.marketing_assets (asset_type);

alter table public.marketing_assets enable row level security;

drop policy if exists "Public can read marketing assets" on public.marketing_assets;

create policy "Public can read marketing assets"
on public.marketing_assets
for select
to anon, authenticated
using (true);

drop trigger if exists set_marketing_assets_updated_at on public.marketing_assets;

create trigger set_marketing_assets_updated_at
before update on public.marketing_assets
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('marketing-assets', 'marketing-assets', true)
on conflict (id) do update set public = true;
