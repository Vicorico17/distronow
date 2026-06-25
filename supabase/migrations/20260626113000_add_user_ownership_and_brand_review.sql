alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists brand_name text,
  add column if not exists brand_description text,
  add column if not exists brand_colors jsonb not null default '{}'::jsonb,
  add column if not exists brand_fonts jsonb not null default '[]'::jsonb,
  add column if not exists brand_logo text,
  add column if not exists brand_fields_status jsonb not null default '{}'::jsonb;

alter table public.brand_extractions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.post_drafts
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.brand_audiences
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.marketing_assets
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists brand_extractions_user_id_idx on public.brand_extractions (user_id);
create index if not exists post_drafts_user_id_idx on public.post_drafts (user_id);
create index if not exists brand_audiences_user_id_idx on public.brand_audiences (user_id);
create index if not exists marketing_assets_user_id_idx on public.marketing_assets (user_id);

drop policy if exists "Public can read projects" on public.projects;
create policy "Owners can read projects"
on public.projects
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Public can read brand extractions" on public.brand_extractions;
create policy "Owners can read brand extractions"
on public.brand_extractions
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Public can read post drafts" on public.post_drafts;
create policy "Owners can read post drafts"
on public.post_drafts
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Public can read brand audiences" on public.brand_audiences;
create policy "Owners can read brand audiences"
on public.brand_audiences
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Public can read marketing assets" on public.marketing_assets;
create policy "Owners can read marketing assets"
on public.marketing_assets
for select
to anon, authenticated
using (user_id is null or auth.uid() = user_id);
