-- Publicly sourced 2027 reference snapshot, not simulated career agreements.
-- Preserve historical imports; resolve identities by slug, never numeric insertion order.
begin;

create table if not exists public.f1_contract_reference_backups (
  backup_key text primary key,
  captured_at timestamptz not null default now(),
  payload jsonb not null
);
alter table public.f1_contract_reference_backups enable row level security;
revoke all on public.f1_contract_reference_backups from anon, authenticated;
insert into public.f1_contract_reference_backups(backup_key,payload)
select 'before-f1-2027-public-2026-10-25-v1', jsonb_build_object(
  'driver_contracts',coalesce((select jsonb_agg(to_jsonb(c)) from public.driver_contracts c),'[]'::jsonb),
  'series_entries',coalesce((select jsonb_agg(to_jsonb(e)) from public.series_entries e),'[]'::jsonb)
) on conflict (backup_key) do nothing;

-- The old rows are retained as an explicitly unverified legacy import.
alter table public.driver_contracts add column if not exists reference_quality text;
update public.driver_contracts set reference_quality='legacy_import_unverified'
where reference_quality is null;

create table if not exists public.f1_contract_reference_datasets (
  id text primary key,
  season integer not null check(season>=2027),
  as_of_date date not null,
  reserve_slots_per_team integer not null check(reserve_slots_per_team>=2),
  sources jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.f1_driver_contract_facts (
  id text primary key,
  dataset_id text not null references public.f1_contract_reference_datasets(id),
  person_id bigint not null references public.people(id),
  team_id bigint not null references public.f1_team_facts(id),
  role text not null check(role in ('race_driver','reserve_driver')),
  slot_number integer not null check(slot_number in (1,2)),
  confirmation_status text not null check(confirmation_status in ('confirmed','reported','unconfirmed')),
  confirmed_through_season integer,
  exact_end_year integer,
  actual_contract_start_year integer,
  annual_salary_usd_cents bigint check(annual_salary_usd_cents>=0),
  salary_status text not null default 'not_disclosed' check(salary_status in ('not_disclosed','reported','confirmed')),
  source_url text not null check(source_url like 'https://%'),
  verified_on date not null,
  notes text not null,
  unique(dataset_id,person_id,team_id,role),
  unique(dataset_id,team_id,role,slot_number),
  unique(id,dataset_id,team_id,person_id,role,slot_number),
  check(exact_end_year is null or actual_contract_start_year is null or exact_end_year>=actual_contract_start_year),
  check(exact_end_year is null or confirmed_through_season is null or exact_end_year>=confirmed_through_season),
  check(confirmation_status='confirmed' or confirmed_through_season is null),
  check(annual_salary_usd_cents is null or salary_status<>'not_disclosed')
);

-- Slot number is a game roster position, never a claim of lead-driver hierarchy.
-- Vacant slots are supported; they are not invented reserve appointments.
create table if not exists public.f1_team_driver_slots (
  dataset_id text not null references public.f1_contract_reference_datasets(id),
  team_id bigint not null references public.f1_team_facts(id),
  role text not null check(role in ('race_driver','reserve_driver')),
  slot_number integer not null check(slot_number in (1,2)),
  person_id bigint references public.people(id),
  assignment_status text not null check(assignment_status in ('confirmed','reported','unconfirmed','vacant')),
  contract_fact_id text references public.f1_driver_contract_facts(id),
  primary key(dataset_id,team_id,role,slot_number),
  foreign key(contract_fact_id,dataset_id,team_id,person_id,role,slot_number)
    references public.f1_driver_contract_facts(id,dataset_id,team_id,person_id,role,slot_number),
  check((person_id is null and assignment_status='vacant' and contract_fact_id is null)
    or (person_id is not null and assignment_status<>'vacant' and contract_fact_id is not null))
);
create unique index if not exists f1_one_race_assignment_per_person
on public.f1_team_driver_slots(dataset_id,person_id)
where role='race_driver' and person_id is not null;
-- Reserves may have reference assignments with more than one constructor.

create table if not exists public.f1_reserve_candidate_references (
  dataset_id text not null references public.f1_contract_reference_datasets(id),
  person_id bigint not null references public.people(id),
  last_reference_season integer not null,
  availability_status text not null check(availability_status in ('unverified_2027','contracted_reserve_2027')),
  prior_assignments jsonb not null,
  primary key(dataset_id,person_id)
);

-- Assert base identities before writing the new snapshot. A mismatch rolls back everything.
create temporary table _contract_seed_2027 (
  person_slug text,team_slug text,role text,slot_number integer,confirmation_status text,
  confirmed_through_season integer,exact_end_year integer,source_url text,notes text,
  annual_salary_usd_cents bigint,actual_contract_start_year integer
) on commit drop;
alter table _contract_seed_2027 enable row level security;

insert into public.f1_contract_reference_datasets(id,season,as_of_date,reserve_slots_per_team,sources) values ('f1-2027-public-2026-10-25-v1',2027,'2026-10-25',2,'{"norris": "https://www.mclaren.com/racing/formula-1/2026/lando-norris-contract-extension-2030/", "piastri": "https://www.mclaren.com/racing/formula-1/2025/mclaren-formula-1-team-announce-multi-year-contract-extension-with-oscar-piastri/", "roundup": "https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw", "verstappen": "https://www.formula1.com/en/latest/article/verstappen-signs-contract-extension-with-red-bull-until-the-end-of-2030.4gUd8JEkYnKmD6bNMS5syw", "hadjar": "https://www.formula1.com/en/latest/article/red-bull-announce-new-deal-with-hadjar-for-2027-ahead-of-his-return-in-azerbaijan.3QcucG3BkfbWJNk4M5dWme", "leclerc": "https://www.formula1.com/en/latest/article/ferrari-announce-new-multi-year-deal-with-leclerc-ahead-of-monaco-gp.5Mz0PYSKh0YT40Af4LEJdT", "hamilton": "https://www.formula1.com/en/latest/article/analysis-why-leclerc-is-extending-his-stay-with-ferrari.5dWB81fvCO6W9CV4pqiF2N", "williams": "https://www.williamsf1.com/2027-driver-line-up", "aston": "https://www.astonmartinf1.com/api/news/announcement/lance-stroll-and-fernando-alonso-commit-to-aston-martin-aramco", "camara": "https://www.haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027", "audi": "https://www.grandprix.com/news/audi-confirms-hulkenberg-and-bortoleto-for-2027.html", "alpine": "https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq", "fornaroli": "https://www.mclaren.com/racing/endurance/2026/leonardo-fornaroli-joins-mclaren-hypercar-team/", "reserves2026": "https://www.formula1.com/en/latest/article/who-are-the-reserve-drivers-for-each-f1-team-in-2026.Ce8YvwuVJGLkVNgERX21U"}'::jsonb) on conflict(id) do nothing;

insert into _contract_seed_2027(person_slug,team_slug,role,slot_number,confirmation_status,confirmed_through_season,exact_end_year,source_url,notes,annual_salary_usd_cents,actual_contract_start_year) values
('lando-norris','mclaren','race_driver',1,'confirmed',2030,null,'https://www.mclaren.com/racing/formula-1/2026/lando-norris-contract-extension-2030/','At least 2030; extension options are not treated as exercised.',null,null),
('oscar-piastri','mclaren','race_driver',2,'confirmed',2027,null,'https://www.mclaren.com/racing/formula-1/2025/mclaren-formula-1-team-announce-multi-year-contract-extension-with-oscar-piastri/','Multi-year extension beyond the prior 2026 term; exact expiry undisclosed.',null,null),
('george-russell','mercedes','race_driver',1,'confirmed',2027,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','Driver publicly confirms 2027; full duration and clauses undisclosed.',null,null),
('kimi-antonelli','mercedes','race_driver',2,'reported',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','2027 retention described as understood; no team announcement verified here.',null,null),
('max-verstappen','red-bull-racing','race_driver',1,'confirmed',2030,2030,'https://www.formula1.com/en/latest/article/verstappen-signs-contract-extension-with-red-bull-until-the-end-of-2030.4gUd8JEkYnKmD6bNMS5syw','Publicly announced term through 2030.',null,null),
('isack-hadjar','red-bull-racing','race_driver',2,'confirmed',2027,null,'https://www.formula1.com/en/latest/article/red-bull-announce-new-deal-with-hadjar-for-2027-ahead-of-his-return-in-azerbaijan.3QcucG3BkfbWJNk4M5dWme','2027 retention confirmed; no exact ultimate expiry inferred.',null,null),
('charles-leclerc','ferrari','race_driver',1,'confirmed',2027,null,'https://www.formula1.com/en/latest/article/ferrari-announce-new-multi-year-deal-with-leclerc-ahead-of-monaco-gp.5Mz0PYSKh0YT40Af4LEJdT','Multi-year extension; precise end year undisclosed. No assumed 2030 expiry.',null,null),
('lewis-hamilton','ferrari','race_driver',2,'confirmed',2027,null,'https://www.formula1.com/en/latest/article/analysis-why-leclerc-is-extending-his-stay-with-ferrari.5dWB81fvCO6W9CV4pqiF2N','2027 minimum coverage stated by F1; exact final expiry undisclosed.',null,null),
('alexander-albon','williams','race_driver',1,'confirmed',2027,2027,'https://www.williamsf1.com/2027-driver-line-up','2027 extension confirmed.',null,null),
('carlos-sainz','williams','race_driver',2,'confirmed',2027,null,'https://www.williamsf1.com/2027-driver-line-up','New multi-year commitment; no exact 2028 expiry inferred.',null,null),
('liam-lawson','racing-bulls','race_driver',1,'unconfirmed',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','Prior commitment covers 2026; 2027 seat remains unconfirmed.',null,null),
('arvid-lindblad','racing-bulls','race_driver',2,'unconfirmed',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','Prior commitment covers 2026; no invented 2027 extension.',null,null),
('fernando-alonso','aston-martin','race_driver',1,'confirmed',2027,null,'https://www.astonmartinf1.com/api/news/announcement/lance-stroll-and-fernando-alonso-commit-to-aston-martin-aramco','2027 lineup announced; extension described as long-term without exact expiry.',null,null),
('lance-stroll','aston-martin','race_driver',2,'confirmed',2027,null,'https://www.astonmartinf1.com/api/news/announcement/lance-stroll-and-fernando-alonso-commit-to-aston-martin-aramco','2027 lineup announced; no automatic annual renewal or exact expiry inferred.',null,null),
('rafael-camara','haas','race_driver',1,'confirmed',2027,null,'https://www.haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027','Announced F1 debut for 2027 on multi-year terms; no private salary or end year inferred.',null,null),
('oliver-bearman','haas','race_driver',2,'reported',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','2027 continuation expected, not formally confirmed in the evidence checked.',null,null),
('nico-hulkenberg','audi','race_driver',1,'reported',null,null,'https://www.grandprix.com/news/audi-confirms-hulkenberg-and-bortoleto-for-2027.html','Team-principal confirmation reported; original press-conference transcript not verified.',null,null),
('gabriel-bortoleto','audi','race_driver',2,'reported',null,null,'https://www.grandprix.com/news/audi-confirms-hulkenberg-and-bortoleto-for-2027.html','Team-principal confirmation reported; exact expiry undisclosed.',null,null),
('pierre-gasly','alpine','race_driver',1,'confirmed',2028,null,'https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq','Minimum coverage through 2028; no exact ultimate expiry inferred.',null,null),
('franco-colapinto','alpine','race_driver',2,'confirmed',2027,null,'https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq','Unchanged 2027 lineup confirmed.',null,null),
('sergio-perez','cadillac','race_driver',1,'reported',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','Multi-year agreement reported to cover 2027; specific option exercise not verified.',null,null),
('valtteri-bottas','cadillac','race_driver',2,'reported',null,null,'https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw','Multi-year coverage reported; do not treat a reported conditional second year as guaranteed.',null,null),
('leonardo-fornaroli','mclaren','reserve_driver',1,'confirmed',2027,null,'https://www.mclaren.com/racing/endurance/2026/leonardo-fornaroli-joins-mclaren-hypercar-team/','2027 reserve role confirmed alongside WEC; weekend availability must account for other-series commitments.',null,null);

do $$
begin
  if (select count(*) from public.f1_team_facts)<>11 then
    raise exception 'Expected 11 reference teams; resolve team identities before applying this snapshot';
  end if;
  if exists(select 1 from _contract_seed_2027 s where
    (select count(*) from public.people p where p.slug=s.person_slug)<>1
    or (select count(*) from public.f1_team_facts t where t.slug=s.team_slug)<>1) then
    raise exception 'Missing or ambiguous driver/team slug in 2027 contract seed';
  end if;
end $$;

insert into public.f1_driver_contract_facts(
  id,dataset_id,person_id,team_id,role,slot_number,confirmation_status,
  confirmed_through_season,exact_end_year,actual_contract_start_year,
  annual_salary_usd_cents,salary_status,source_url,verified_on,notes
)
select 'f1-2027-public-2026-10-25-v1/'||s.team_slug||'/'||s.role||'/'||s.person_slug,
  'f1-2027-public-2026-10-25-v1',p.id,t.id,s.role,s.slot_number,s.confirmation_status,
  s.confirmed_through_season,s.exact_end_year,s.actual_contract_start_year,
  s.annual_salary_usd_cents,'not_disclosed',s.source_url,date '2026-10-25',s.notes
from _contract_seed_2027 s join public.people p on p.slug=s.person_slug
join public.f1_team_facts t on t.slug=s.team_slug
on conflict(id) do update set confirmation_status=excluded.confirmation_status,
  confirmed_through_season=excluded.confirmed_through_season,exact_end_year=excluded.exact_end_year,
  actual_contract_start_year=excluded.actual_contract_start_year,annual_salary_usd_cents=excluded.annual_salary_usd_cents,
  salary_status=excluded.salary_status,source_url=excluded.source_url,verified_on=excluded.verified_on,notes=excluded.notes;

insert into public.f1_team_driver_slots(dataset_id,team_id,role,slot_number,person_id,assignment_status,contract_fact_id)
select 'f1-2027-public-2026-10-25-v1',t.id,r.role,n.slot_number,null,'vacant',null
from public.f1_team_facts t cross join (values('race_driver'),('reserve_driver')) r(role)
cross join (values(1),(2)) n(slot_number)
on conflict(dataset_id,team_id,role,slot_number) do nothing;

-- Only confirmed appointments populate the roster. Reported/unconfirmed candidates remain facts.
update public.f1_team_driver_slots s set person_id=c.person_id,assignment_status='confirmed',contract_fact_id=c.id
from public.f1_driver_contract_facts c
where c.dataset_id=s.dataset_id and c.team_id=s.team_id and c.role=s.role and c.slot_number=s.slot_number
  and c.dataset_id='f1-2027-public-2026-10-25-v1' and c.confirmation_status='confirmed';

-- Existing 2026 assignments are evidence of experience, not proof of a free 2027 signing.
insert into public.f1_reserve_candidate_references(dataset_id,person_id,last_reference_season,availability_status,prior_assignments)
select 'f1-2027-public-2026-10-25-v1',e.person_id,max(e.season),
  case when exists(select 1 from public.f1_driver_contract_facts c
    where c.dataset_id='f1-2027-public-2026-10-25-v1' and c.person_id=e.person_id
      and c.role='reserve_driver' and c.confirmation_status='confirmed')
    then 'contracted_reserve_2027' else 'unverified_2027' end,
  jsonb_agg(jsonb_build_object('season',e.season,'entrant_name',e.entrant_name,'source_key',e.source_key,'verified_on',e.verified_on) order by e.id)
from public.series_entries e where e.series='F1' and e.entry_role='reserve_driver' and e.season=2026
group by e.person_id
on conflict(dataset_id,person_id) do update set last_reference_season=excluded.last_reference_season,
  availability_status=excluded.availability_status,prior_assignments=excluded.prior_assignments;

alter table public.f1_contract_reference_datasets enable row level security;
alter table public.f1_driver_contract_facts enable row level security;
alter table public.f1_team_driver_slots enable row level security;
alter table public.f1_reserve_candidate_references enable row level security;
do $$
declare table_name text;
begin
  foreach table_name in array array['f1_contract_reference_datasets','f1_driver_contract_facts','f1_team_driver_slots','f1_reserve_candidate_references'] loop
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=table_name and policyname='Public reference read') then
      execute format('create policy "Public reference read" on public.%I for select to anon, authenticated using (true)',table_name);
    end if;
    execute format('revoke all on public.%I from anon, authenticated',table_name);
    execute format('grant select on public.%I to anon, authenticated',table_name);
  end loop;
end $$;

create or replace view public.driver_contracts_2027 with(security_invoker=true) as
select c.*,p.slug as person_slug,p.display_name as driver_name,t.slug as team_slug,t.short_name as team_name
from public.f1_driver_contract_facts c join public.people p on p.id=c.person_id
join public.f1_team_facts t on t.id=c.team_id where c.dataset_id='f1-2027-public-2026-10-25-v1';
grant select on public.driver_contracts_2027 to anon,authenticated;

do $$
begin
  if (select count(*) from public.f1_driver_contract_facts where dataset_id='f1-2027-public-2026-10-25-v1')<>23 then
    raise exception 'Expected 22 race-driver reference candidates and one confirmed reserve contract';
  end if;
  if (select count(*) from public.f1_team_driver_slots where dataset_id='f1-2027-public-2026-10-25-v1' and role='reserve_driver')<>22 then
    raise exception 'Expected two reserve slots for every constructor';
  end if;
  if exists(select team_id from public.f1_team_driver_slots where dataset_id='f1-2027-public-2026-10-25-v1'
    group by team_id having count(*) filter(where role='reserve_driver')<>2 or count(*) filter(where role='race_driver')<>2) then
    raise exception 'Invalid team roster capacity';
  end if;
end $$;

notify pgrst,'reload schema';
commit;
