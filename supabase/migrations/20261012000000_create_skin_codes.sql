create table public.skin_codes (
  code text primary key,
  skin_id text not null,
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.skin_codes enable row level security;

create policy "anyone can look up a code"
  on public.skin_codes for select
  to anon
  using (true);

create policy "anyone can redeem an unredeemed code"
  on public.skin_codes for update
  to anon
  using (redeemed = false)
  with check (redeemed = true);
