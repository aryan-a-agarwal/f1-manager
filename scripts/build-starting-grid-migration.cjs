const fs=require('node:fs');
const seed=JSON.parse(fs.readFileSync('supabase/seed-data/2027-starting-grid.json','utf8'));
const literal=value=>"'"+String(value).replaceAll("'","''")+"'";
const reservePeople=seed.reserve_people??[];
const uniquePeople=[...new Map(reservePeople.map(p=>[p.slug,p])).values()];
const peopleSql=uniquePeople.length?`insert into public.data_sources(source_key,publisher,title,url,season,retrieved_on) values
${uniquePeople.map(p=>`(${literal('reserve-link-'+p.slug)},'Official team / series reference',${literal('Reserve/development connection: '+p.display_name)},${literal(p.source_url)},2026,${literal(seed.as_of_date)})`).join(',\n')}
on conflict(source_key) do nothing;
insert into public.people(slug,first_name,last_name,display_name,racing_nationality,person_type,source_key,verified_on) values
${uniquePeople.map(p=>`(${literal(p.slug)},${literal(p.first_name)},${literal(p.last_name)},${literal(p.display_name)},${literal(p.racing_nationality)},'driver',${literal('reserve-link-'+p.slug)},${literal(seed.as_of_date)})`).join(',\n')}
on conflict(slug) do nothing;`:'';
const sql=`-- Versioned, additive starting scenario. Historical reference imports remain intact.
begin;
insert into public.f1_contract_reference_backups(backup_key,payload)
select 'before-${seed.dataset_id}',jsonb_build_object('contract_facts',(select jsonb_agg(to_jsonb(f)) from public.f1_driver_contract_facts f),'slots',(select jsonb_agg(to_jsonb(s)) from public.f1_team_driver_slots s))
on conflict(backup_key) do nothing;

${peopleSql}
create table if not exists public.f1_starting_grid_datasets(
 id text primary key,season integer not null check(season>=2027),as_of_date date not null,
 description text not null,created_at timestamptz not null default now()
);
create table if not exists public.f1_starting_driver_contracts(
 id text primary key,dataset_id text not null references public.f1_starting_grid_datasets(id),
 person_id bigint not null references public.people(id),team_id bigint not null references public.f1_team_facts(id),
 game_driver_id text not null,role text not null check(role in ('race_driver','reserve_driver')),
 slot_number integer not null check(slot_number in (1,2)),
 seat_basis text not null check(seat_basis in ('confirmed','game_assumption')),
 reference_status text not null check(reference_status in ('confirmed','reported','unconfirmed')),
 reference_confirmed_through integer,reference_exact_end integer,
 start_season integer not null,end_season integer not null check(end_season>=start_season),
 term_basis text not null check(term_basis in ('published_exact','game_assumption')),
 annual_salary_usd_cents bigint not null check(annual_salary_usd_cents>0),
 salary_basis text not null check(salary_basis='game_estimate'),
 source_url text not null check(source_url like 'https://%'),seat_source_url text not null check(seat_source_url like 'https://%'),notes text not null,
 unique(dataset_id,team_id,role,slot_number),
 unique(id,dataset_id,team_id,role,slot_number,person_id),
 check(reference_confirmed_through is null or end_season>=reference_confirmed_through),
 check(reference_exact_end is null or end_season=reference_exact_end),
 check((term_basis='published_exact')=(reference_exact_end is not null))
);
-- Race employment stays exclusive; a documented shared reserve arrangement is permitted.
alter table public.f1_starting_driver_contracts drop constraint if exists f1_starting_driver_contracts_dataset_id_person_id_role_key;
create unique index if not exists f1_starting_unique_race_driver on public.f1_starting_driver_contracts(dataset_id,person_id) where role='race_driver';
create unique index if not exists f1_starting_unique_team_reserve on public.f1_starting_driver_contracts(dataset_id,team_id,person_id) where role='reserve_driver';
create table if not exists public.f1_starting_team_slots(
 dataset_id text not null references public.f1_starting_grid_datasets(id),
 team_id bigint not null references public.f1_team_facts(id),role text not null check(role in ('race_driver','reserve_driver')),
 slot_number integer not null check(slot_number in (1,2)),person_id bigint references public.people(id),contract_id text,
 primary key(dataset_id,team_id,role,slot_number),
 foreign key(contract_id,dataset_id,team_id,role,slot_number,person_id) references public.f1_starting_driver_contracts(id,dataset_id,team_id,role,slot_number,person_id),
 check((person_id is null)=(contract_id is null))
);
alter table public.f1_starting_grid_datasets enable row level security;
alter table public.f1_starting_driver_contracts enable row level security;
alter table public.f1_starting_team_slots enable row level security;
create temporary table _starting_grid_seed on commit drop as
select * from jsonb_to_recordset(${literal(JSON.stringify(seed.contracts))}::jsonb) as s(
 person_slug text,team_slug text,driver_id text,role text,slot_number integer,seat_basis text,
 reference_status text,reference_confirmed_through integer,reference_exact_end integer,
 start_season integer,end_season integer,term_basis text,annual_salary_usd_cents bigint,salary_basis text,
 source_url text,seat_source_url text,notes text
);
alter table _starting_grid_seed enable row level security;
do $$ begin
 if (select count(*) from _starting_grid_seed s join public.people p on p.slug=s.person_slug join public.f1_team_facts t on t.slug=s.team_slug)<>${seed.contracts.length} then
 raise exception 'Starting grid identities missing: expected ${seed.contracts.length} contracts';end if;
end $$;
insert into public.f1_starting_grid_datasets(id,season,as_of_date,description)
values(${literal(seed.dataset_id)},${seed.season},${literal(seed.as_of_date)},${literal(seed.description)}) on conflict(id) do nothing;
insert into public.f1_starting_driver_contracts
select ${literal(seed.dataset_id)}||':'||s.person_slug||':'||s.role||':'||s.team_slug||':'||s.slot_number,${literal(seed.dataset_id)},p.id,t.id,s.driver_id,s.role,s.slot_number,s.seat_basis,s.reference_status,s.reference_confirmed_through,s.reference_exact_end,s.start_season,s.end_season,s.term_basis,s.annual_salary_usd_cents,s.salary_basis,s.source_url,s.seat_source_url,s.notes
from _starting_grid_seed s join public.people p on p.slug=s.person_slug join public.f1_team_facts t on t.slug=s.team_slug
on conflict(id) do nothing;
insert into public.f1_starting_team_slots
select ${literal(seed.dataset_id)},t.id,r.role,n.slot_number,c.person_id,c.id
from public.f1_team_facts t cross join (values('race_driver'),('reserve_driver')) r(role) cross join (values(1),(2)) n(slot_number)
left join public.f1_starting_driver_contracts c on c.dataset_id=${literal(seed.dataset_id)} and c.team_id=t.id and c.role=r.role and c.slot_number=n.slot_number
where t.slug in(select team_slug from _starting_grid_seed)
on conflict(dataset_id,team_id,role,slot_number) do nothing;
do $$ declare table_name text; begin
 foreach table_name in array array['f1_starting_grid_datasets','f1_starting_driver_contracts','f1_starting_team_slots'] loop
 execute format('alter table public.%I enable row level security',table_name);
 if not exists(select 1 from pg_policies where schemaname='public' and tablename=table_name and policyname='Public starting grid read') then
 execute format('create policy "Public starting grid read" on public.%I for select to anon,authenticated using(true)',table_name);end if;
 execute format('revoke all on public.%I from anon,authenticated',table_name);
 execute format('grant select on public.%I to anon,authenticated',table_name);
 end loop;
end $$;
create or replace view public.f1_starting_grid_2027 with(security_invoker=true) as
select c.*,p.slug person_slug,p.display_name driver_name,t.slug team_slug,t.short_name team_name
from public.f1_starting_driver_contracts c join public.people p on p.id=c.person_id join public.f1_team_facts t on t.id=c.team_id
where c.dataset_id=${literal(seed.dataset_id)};
grant select on public.f1_starting_grid_2027 to anon,authenticated;
do $$ begin
 if (select count(*) from public.f1_starting_driver_contracts where dataset_id=${literal(seed.dataset_id)} and role='race_driver')<>22
 or (select count(*) from public.f1_starting_driver_contracts where dataset_id=${literal(seed.dataset_id)} and role='race_driver' and seat_basis='confirmed')<>19
 or (select count(*) from public.f1_starting_driver_contracts where dataset_id=${literal(seed.dataset_id)} and role='race_driver' and seat_basis='game_assumption')<>3
 or (select count(*) from public.f1_starting_driver_contracts where dataset_id=${literal(seed.dataset_id)} and role='reserve_driver')<>${seed.contracts.filter(r=>r.role==='reserve_driver').length}
 or (select count(*) from public.f1_starting_team_slots where dataset_id=${literal(seed.dataset_id)})<>44
 then raise exception 'Invalid starting grid: expected 19 confirmed + 3 assumed race seats and 44 total slots';end if;
end $$;
notify pgrst,'reload schema';
commit;
`;
fs.writeFileSync(process.argv[2]||'supabase/migrations/20261026010000_reserve_driver_contracts.sql',sql);
console.log('Starting grid migration generated.');
