create table if not exists public.module_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module text not null,
  record_type text not null,
  external_id text not null,
  name text not null,
  status text not null default 'draft',
  source_repo text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, module, record_type, external_id)
);

create index if not exists module_records_project_idx on public.module_records(project_id, module, record_type);
