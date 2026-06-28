create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  audience_id uuid references public.brand_audiences(id) on delete set null,
  name text not null,
  objective text,
  duration_days integer not null default 7,
  channels text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_project_id_created_at_idx on public.campaigns (project_id, created_at desc);
create index if not exists campaigns_user_id_idx on public.campaigns (user_id);
create index if not exists campaigns_audience_id_idx on public.campaigns (audience_id);

drop trigger if exists set_campaigns_updated_at on public.campaigns;

create trigger set_campaigns_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "Owners can read campaigns" on public.campaigns;
create policy "Owners can read campaigns"
on public.campaigns
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);
