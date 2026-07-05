alter table public.projects
  add column if not exists anonymous_owner_id text;

create index if not exists projects_anonymous_owner_id_idx
  on public.projects (anonymous_owner_id);

alter table public.projects
  drop constraint if exists projects_domain_key;

create unique index if not exists projects_domain_user_id_unique
  on public.projects (domain, user_id)
  where user_id is not null;

create unique index if not exists projects_domain_anonymous_owner_unique
  on public.projects (domain, anonymous_owner_id)
  where user_id is null and anonymous_owner_id is not null;

create unique index if not exists projects_domain_legacy_anonymous_unique
  on public.projects (domain)
  where user_id is null and anonymous_owner_id is null;

drop policy if exists "Owners can read projects" on public.projects;
create policy "Owners can read projects"
on public.projects
for select
to anon, authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can read brand extractions" on public.brand_extractions;
create policy "Owners can read brand extractions"
on public.brand_extractions
for select
to anon, authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can read post drafts" on public.post_drafts;
create policy "Owners can read post drafts"
on public.post_drafts
for select
to anon, authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can read brand audiences" on public.brand_audiences;
create policy "Owners can read brand audiences"
on public.brand_audiences
for select
to anon, authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can read marketing assets" on public.marketing_assets;
create policy "Owners can read marketing assets"
on public.marketing_assets
for select
to anon, authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can read campaigns" on public.campaigns;
create policy "Owners can read campaigns"
on public.campaigns
for select
to anon, authenticated
using (auth.uid() = user_id);
