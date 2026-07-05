alter table public.post_drafts
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

alter table public.marketing_assets
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

create index if not exists post_drafts_campaign_id_idx
  on public.post_drafts (campaign_id);

create index if not exists marketing_assets_campaign_id_idx
  on public.marketing_assets (campaign_id);
