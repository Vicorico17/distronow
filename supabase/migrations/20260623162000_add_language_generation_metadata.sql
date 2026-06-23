alter table public.projects
  add column if not exists language text,
  add column if not exists tone text,
  add column if not exists audience text;

alter table public.brand_extractions
  add column if not exists language text;

alter table public.post_drafts
  add column if not exists status text not null default 'generated',
  add column if not exists language text,
  add column if not exists tone text,
  add column if not exists length text,
  add column if not exists provider text not null default 'template',
  add column if not exists model text,
  add column if not exists prompt_version text,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_post_drafts_updated_at on public.post_drafts;

create trigger set_post_drafts_updated_at
before update on public.post_drafts
for each row
execute function public.set_updated_at();

create index if not exists post_drafts_status_idx
  on public.post_drafts (status);

create index if not exists post_drafts_provider_idx
  on public.post_drafts (provider);
