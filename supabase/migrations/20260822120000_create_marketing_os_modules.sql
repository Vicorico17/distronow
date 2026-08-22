-- Shared operating records for the unified DistroNow marketing workspace.
-- Service-role routes enforce project ownership before writing these tables.

create table if not exists public.strategy_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_type text not null check (document_type in ('product_information','marketing_strategy','competitor_analysis','brand_voice','content_strategy')),
  title text not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft','review','confirmed','archived')),
  source text not null default 'manual',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, document_type, version)
);

create table if not exists public.customer_signals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  source_url text,
  source_name text,
  observed_at date,
  signal_type text not null default 'pain',
  evidence text not null,
  pain_score integer not null default 0 check (pain_score between 0 and 5),
  fit_score integer not null default 0 check (fit_score between 0 and 5),
  timing_score integer not null default 0 check (timing_score between 0 and 5),
  reachability_score integer not null default 0 check (reachability_score between 0 and 5),
  evidence_score integer not null default 0 check (evidence_score between 0 and 5),
  status text not null default 'new' check (status in ('new','qualified','used','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  summary text not null default '',
  pains jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  buying_triggers jsonb not null default '[]'::jsonb,
  language jsonb not null default '[]'::jsonb,
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  evidence_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','confirmed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  platform text not null,
  handle text not null,
  display_name text,
  status text not null default 'planned' check (status in ('planned','connected','paused','error')),
  follower_count integer,
  connection_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  account_id uuid references public.social_accounts(id) on delete set null,
  post_draft_id uuid references public.post_drafts(id) on delete set null,
  title text not null,
  platform text not null,
  scheduled_for timestamptz,
  status text not null default 'planned' check (status in ('idea','planned','ready','approved','scheduled','published','failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scheduled_post_id uuid references public.scheduled_posts(id) on delete cascade,
  platform text not null,
  impressions integer not null default 0,
  engagements integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  captured_at timestamptz not null default now()
);

create table if not exists public.acquisition_campaigns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  name text not null,
  objective text,
  status text not null default 'draft' check (status in ('draft','review','active','paused','completed')),
  channel text not null default 'email',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.acquisition_campaigns(id) on delete set null,
  company_name text not null,
  domain text,
  contact_name text,
  contact_role text,
  email text,
  source_url text,
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate','reviewed','approved','contacted','replied','meeting','won','suppressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.acquisition_campaigns(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete cascade,
  direction text not null check (direction in ('outbound','inbound')),
  subject text,
  body text not null,
  status text not null default 'draft' check (status in ('draft','review','approved','sent','replied','suppressed')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null default '',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','done','dismissed')),
  source jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strategy_documents_project_idx on public.strategy_documents(project_id);
create index if not exists customer_signals_project_idx on public.customer_signals(project_id, status);
create index if not exists customer_profiles_project_idx on public.customer_profiles(project_id, status);
create index if not exists social_accounts_project_idx on public.social_accounts(project_id, platform);
create index if not exists scheduled_posts_project_idx on public.scheduled_posts(project_id, status, scheduled_for);
create index if not exists post_metrics_project_idx on public.post_metrics(project_id, captured_at);
create index if not exists acquisition_campaigns_project_idx on public.acquisition_campaigns(project_id, status);
create index if not exists prospects_project_idx on public.prospects(project_id, status, fit_score desc);
create index if not exists outreach_messages_project_idx on public.outreach_messages(project_id, status);
create index if not exists agent_tasks_project_idx on public.agent_tasks(project_id, status, priority);
