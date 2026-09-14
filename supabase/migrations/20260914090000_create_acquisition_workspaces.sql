-- Project-owned acquisition state. Access is exclusively through server routes
-- after checking project.user_id / the signed anonymous-owner cookie.
-- Optimistic concurrency uses updated_at; status=busy reserves provider actions.
create table if not exists public.acquisition_workspaces (
  project_id uuid primary key references public.projects(id) on delete cascade,
  payload jsonb not null default '{"campaigns":[],"prospects":[],"events":[]}'::jsonb,
  status text not null default 'ready' check (status in ('ready','busy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acquisition_payload_object check (jsonb_typeof(payload) = 'object')
);
alter table public.acquisition_workspaces enable row level security;
-- No anon/authenticated policies: service-role routes are the only boundary.
revoke all on table public.acquisition_workspaces from anon, authenticated;
grant all on table public.acquisition_workspaces to service_role;
