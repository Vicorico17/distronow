create table if not exists public.accman_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  label text not null default '',
  instagram_username text not null,
  tiktok_username text not null,
  email_password_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accman_accounts_email_per_user unique (user_id, email)
);

create index if not exists accman_accounts_user_updated_idx on public.accman_accounts(user_id, updated_at desc);
alter table public.accman_accounts enable row level security;
-- Credential records are available only through the authenticated server API.
revoke all on table public.accman_accounts from anon, authenticated;
grant all on table public.accman_accounts to service_role;
