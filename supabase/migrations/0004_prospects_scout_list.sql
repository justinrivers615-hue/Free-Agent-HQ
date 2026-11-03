-- Prospects: players who have not joined the platform.
--   org_id IS NULL      -> shared pool, loaded only by the platform from licensed data (service role)
--   org_id IS NOT NULL  -> private to one team (their own imported scouting list)
-- Scout list: the first column of every team's big board.

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  full_name text not null,
  sport text not null check (sport in ('Football','Basketball','Soccer','Baseball')),
  position text not null default '',
  school text not null default '',
  division text not null default '',
  class_year text not null default '',
  hometown text not null default '',
  stats jsonb not null default '{}'::jsonb,
  source text not null default 'team import',
  source_url text not null default '',
  athlete_id uuid references public.athletes(id) on delete set null,
  opted_out boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.scout_list (
  org_id uuid not null references public.organizations(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  notes text not null default '',
  added_by uuid references public.profiles(id),
  added_at timestamptz not null default now(),
  primary key (org_id, prospect_id)
);

-- True when the caller is staff on at least one team.
create or replace function public.is_team_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.org_members where user_id = auth.uid())
$$;
revoke execute on function public.is_team_staff() from public, anon;
grant execute on function public.is_team_staff() to authenticated;

alter table public.prospects enable row level security;
alter table public.scout_list enable row level security;

-- Shared pool: team staff only, and never players who opted out. Private lists: that team's staff only.
create policy "prospects read" on public.prospects for select to authenticated using (
  (org_id is null and not opted_out and public.is_team_staff())
  or (org_id is not null and public.org_role(org_id) is not null)
);
create policy "prospects insert own org" on public.prospects for insert to authenticated with check (
  org_id is not null and public.org_role(org_id) is not null and created_by = (select auth.uid())
);
create policy "prospects update own org" on public.prospects for update to authenticated
  using (org_id is not null and public.org_role(org_id) is not null)
  with check (org_id is not null and public.org_role(org_id) is not null);
create policy "prospects delete own org" on public.prospects for delete to authenticated
  using (org_id is not null and public.org_role(org_id) is not null);

create policy "scout list staff" on public.scout_list for all to authenticated
  using (public.org_role(org_id) is not null)
  with check (
    public.org_role(org_id) is not null
    and exists (select 1 from public.prospects p where p.id = prospect_id and (p.org_id is null or p.org_id = scout_list.org_id))
  );

create index on public.prospects (sport);
create index on public.prospects (org_id);
create index on public.prospects (athlete_id);
create index on public.prospects (created_by);
create index on public.scout_list (prospect_id);
create index on public.scout_list (added_by);
