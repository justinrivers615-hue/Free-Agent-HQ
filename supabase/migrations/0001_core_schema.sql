-- Free Agent HQ core schema: roles, athlete profiles, scouting data, team center, NIL.

-- ---------- Profiles & roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'athlete' check (role in ('athlete','team','brand')),
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' in ('athlete','team','brand') then new.raw_user_meta_data->>'role' else 'athlete' end,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Athletes ----------
create table public.athletes (
  id uuid primary key references public.profiles(id) on delete cascade,
  sport text not null check (sport in ('Football','Basketball','Soccer','Baseball')),
  position text not null default '',
  level text not null default '',
  school text not null default '',
  height text not null default '',
  weight text not null default '',
  bio text not null default '',
  followers integer not null default 0 check (followers >= 0),
  engagement numeric(5,2) not null default 0,
  division text not null default 'other' check (division in ('d1','ncaa','other','pro')),
  updated_at timestamptz not null default now()
);

create table public.athlete_seasons (
  id bigint generated always as identity primary key,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  season text not null,
  stats jsonb not null default '{}'::jsonb,
  unique (athlete_id, season)
);

-- Percentile = rank vs. same position & level (0-100). Source tracks where it came from.
create table public.athlete_metrics (
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  key text not null,
  value text not null default '',
  percentile integer not null check (percentile between 0 and 100),
  source text not null default 'self-reported' check (source in ('self-reported','box-score','film-tagged','verified')),
  primary key (athlete_id, key)
);

-- ---------- Teams (coaches, GMs, scouts) ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null check (sport in ('Football','Basketball','Soccer','Baseball')),
  plan text not null default 'team',
  seat_limit integer not null default 10,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  staff_role text not null check (staff_role in ('gm','hc','pc','scout')),
  primary key (org_id, user_id)
);

create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  staff_role text not null check (staff_role in ('gm','hc','pc','scout')),
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

-- Returns the caller's staff role in an org, or null. Security definer avoids RLS recursion.
create or replace function public.org_role(p_org uuid)
returns text language sql stable security definer set search_path = '' as $$
  select staff_role from public.org_members where org_id = p_org and user_id = auth.uid()
$$;

create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.org_members (org_id, user_id, staff_role) values (new.id, new.created_by, 'gm');
  return new;
end $$;

create trigger on_org_created after insert on public.organizations
  for each row execute function public.handle_new_org();

-- Big board: 0 watching, 1 evaluating, 2 tryout invite, 3 offer sent, 4 signed
create table public.board_entries (
  org_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  stage smallint not null default 0 check (stage between 0 and 4),
  notes text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (org_id, athlete_id)
);

-- Who may put an athlete at a given stage
create or replace function public.can_set_stage(p_org uuid, p_stage smallint)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_stage <= 1 then public.org_role(p_org) is not null
    when p_stage = 2 then public.org_role(p_org) in ('gm','hc')
    else public.org_role(p_org) = 'gm'
  end
$$;

-- ---------- Opportunities (tryouts, combines, showcases) ----------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  kind text not null,
  title text not null,
  description text not null default '',
  location text not null default '',
  starts_on date,
  fee_cents integer not null default 0,
  org_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- NIL ----------
create table public.nil_deals (
  id uuid primary key default gen_random_uuid(),
  brand_user_id uuid not null references public.profiles(id) on delete cascade,
  brand_name text not null,
  kind text not null check (kind in ('Social post','Appearance','Camp / clinic','Licensing')),
  pay_cents integer not null check (pay_cents > 0),
  description text not null,
  min_followers integer not null default 0,
  sport text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table public.nil_applications (
  deal_id uuid not null references public.nil_deals(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied','accepted','declined')),
  created_at timestamptz not null default now(),
  primary key (deal_id, athlete_id)
);

create table public.earnings (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  brand text not null,
  kind text not null default '',
  amount_cents integer not null check (amount_cents >= 0),
  paid_on date not null default current_date,
  reporting text not null default 'not required' check (reporting in ('not required','pending','reported'))
);

-- ---------- Row level security ----------
alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.athlete_seasons enable row level security;
alter table public.athlete_metrics enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.org_invites enable row level security;
alter table public.board_entries enable row level security;
alter table public.opportunities enable row level security;
alter table public.nil_deals enable row level security;
alter table public.nil_applications enable row level security;
alter table public.earnings enable row level security;

-- profiles: any signed-in user can read names/roles; you edit only yours (role cannot be self-escalated beyond the 3 public roles by check constraint)
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- athlete data: readable by signed-in users (teams scout it); writable by the athlete
create policy "athletes read" on public.athletes for select to authenticated using (true);
create policy "athletes insert own" on public.athletes for insert to authenticated with check (id = (select auth.uid()));
create policy "athletes update own" on public.athletes for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "seasons read" on public.athlete_seasons for select to authenticated using (true);
create policy "seasons write own" on public.athlete_seasons for all to authenticated using (athlete_id = (select auth.uid())) with check (athlete_id = (select auth.uid()));

create policy "metrics read" on public.athlete_metrics for select to authenticated using (true);
create policy "metrics write own" on public.athlete_metrics for all to authenticated using (athlete_id = (select auth.uid())) with check (athlete_id = (select auth.uid()));

-- orgs: members read; any team user creates (becomes GM via trigger); GM updates
create policy "orgs read members" on public.organizations for select to authenticated using (public.org_role(id) is not null);
create policy "orgs create" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "orgs update gm" on public.organizations for update to authenticated using (public.org_role(id) = 'gm');

create policy "members read" on public.org_members for select to authenticated using (public.org_role(org_id) is not null);
create policy "members manage gm" on public.org_members for all to authenticated using (public.org_role(org_id) = 'gm') with check (public.org_role(org_id) = 'gm');

create policy "invites read members" on public.org_invites for select to authenticated using (public.org_role(org_id) is not null);
create policy "invites manage gm" on public.org_invites for all to authenticated using (public.org_role(org_id) = 'gm') with check (public.org_role(org_id) = 'gm' and invited_by = (select auth.uid()));

-- board: staff read; stage permissions enforced in the database
create policy "board read staff" on public.board_entries for select to authenticated using (public.org_role(org_id) is not null);
create policy "board read athlete invites" on public.board_entries for select to authenticated using (athlete_id = (select auth.uid()) and stage >= 2);
create policy "board insert" on public.board_entries for insert to authenticated with check (public.can_set_stage(org_id, stage));
create policy "board update" on public.board_entries for update to authenticated using (public.org_role(org_id) is not null) with check (public.can_set_stage(org_id, stage));
create policy "board delete" on public.board_entries for delete to authenticated using (public.org_role(org_id) is not null);

-- athletes can see the name of an org that invited them
create policy "orgs read by invited athlete" on public.organizations for select to authenticated
  using (exists (select 1 from public.board_entries b where b.org_id = id and b.athlete_id = (select auth.uid()) and b.stage >= 2));

-- opportunities: public listings readable; creators manage their own
create policy "opps read" on public.opportunities for select to authenticated using (true);
create policy "opps write own" on public.opportunities for all to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()) and (org_id is null or public.org_role(org_id) in ('gm','hc')));

-- NIL deals: readable by signed-in users; brands manage their own
create policy "deals read" on public.nil_deals for select to authenticated using (true);
create policy "deals write brand" on public.nil_deals for all to authenticated using (brand_user_id = (select auth.uid())) with check (brand_user_id = (select auth.uid()));

-- applications: athlete manages own; brand sees and updates applications to its deals
create policy "apps athlete" on public.nil_applications for all to authenticated using (athlete_id = (select auth.uid())) with check (athlete_id = (select auth.uid()));
create policy "apps brand read" on public.nil_applications for select to authenticated using (exists (select 1 from public.nil_deals d where d.id = deal_id and d.brand_user_id = (select auth.uid())));
create policy "apps brand update" on public.nil_applications for update to authenticated using (exists (select 1 from public.nil_deals d where d.id = deal_id and d.brand_user_id = (select auth.uid())));

-- earnings: private to the athlete
create policy "earnings own" on public.earnings for all to authenticated using (athlete_id = (select auth.uid())) with check (athlete_id = (select auth.uid()));

-- helpful indexes
create index on public.athletes (sport);
create index on public.athlete_seasons (athlete_id);
create index on public.board_entries (athlete_id);
create index on public.org_members (user_id);
create index on public.nil_applications (athlete_id);
create index on public.earnings (athlete_id);
create index on public.opportunities (sport);
create index on public.nil_deals (brand_user_id);
create index on public.org_invites (org_id);
create index on public.organizations (created_by);
create index on public.board_entries (updated_by);
create index on public.opportunities (org_id);
create index on public.opportunities (created_by);
create index on public.org_invites (invited_by);
