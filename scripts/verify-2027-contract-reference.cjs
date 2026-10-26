// Run with: node scripts/verify-2027-contract-reference.cjs <path-to-pglite-package>
// Uses an isolated in-memory PostgreSQL instance; never connects to Supabase.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require(process.argv[2]||'@electric-sql/pglite');
const seed=JSON.parse(fs.readFileSync('supabase/seed-data/2027-driver-contract-reference.json','utf8'));
const migration=fs.readFileSync('supabase/migrations/20261025190000_2027_contract_reference_and_reserve_slots.sql','utf8');
const dataset=seed.dataset_id;

(async()=>{
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;
    create table people(id bigint primary key,slug text unique,display_name text);
    create table f1_team_facts(id bigint primary key,slug text unique,short_name text);
    create table driver_contracts(id bigint primary key,driver_id bigint,team_id bigint,start_year int,end_year int,base_salary_usd_millions numeric,status text);
    create table series_entries(id bigint primary key,person_id bigint,series text,season int,entrant_name text,entry_role text,source_key text,verified_on date);grant select on people,f1_team_facts to anon,authenticated;`);
  const slugs=[...new Set([...seed.contracts.map(row=>row.person_slug),...seed.reserve_reference_assignments_2026.map(row=>row.person_slug)])].reverse();
  const teamSlugs=[...new Set(seed.contracts.map(row=>row.team_slug))].reverse();
  for(const [i,slug] of slugs.entries())await db.query('insert into people values($1,$2,$3)',[101+i,slug,slug]);
  for(const [i,slug] of teamSlugs.entries())await db.query('insert into f1_team_facts values($1,$2,$3)',[501+i,slug,slug]);
  await db.exec("insert into driver_contracts values(1,999,777,2025,2026,99,'active')");
  for(const [i,row] of seed.reserve_reference_assignments_2026.entries())await db.query(
    "insert into series_entries select $1,id,'F1',$2,$3,'reserve_driver',$4,$5::date from people where slug=$6",
    [i+1,row.season,row.entrant_name,row.source_key,row.verified_on,row.person_slug]);
  await db.exec(migration);
  await db.exec(migration);
  const scalar=async(sql)=>(await db.query(sql)).rows[0].n;
  assert.equal(await scalar('select count(*)::int n from f1_contract_reference_backups'),1);
  assert.equal(await scalar('select count(*)::int n from f1_driver_contract_facts'),23);
  assert.equal(await scalar('select count(*)::int n from f1_team_driver_slots'),44);
  assert.equal(await scalar("select count(*)::int n from f1_team_driver_slots where role='reserve_driver'"),22);
  assert.equal(await scalar("select count(*)::int n from f1_team_driver_slots where role='reserve_driver' and person_id is not null"),1);
  assert.equal(await scalar('select count(*)::int n from f1_reserve_candidate_references'),11);
  assert.equal(await scalar("select count(*)::int n from f1_driver_contract_facts where annual_salary_usd_cents is not null"),0);
  assert.equal(await scalar("select count(*)::int n from f1_team_driver_slots s join f1_driver_contract_facts c on c.id=s.contract_fact_id where c.confirmation_status<>'confirmed'"),0);
  assert.equal(await scalar("select count(*)::int n from driver_contracts where id=1 and base_salary_usd_millions=99 and reference_quality='legacy_import_unverified'"),1);
  assert.equal(await scalar("select jsonb_array_length(payload->'driver_contracts')::int n from f1_contract_reference_backups"),1);
  assert.equal(await scalar("select count(*)::int n from driver_contracts_2027 where person_slug='rafael-camara' and team_slug='haas'"),1);
  assert.equal(await scalar("select count(*)::int n from f1_team_driver_slots s join f1_team_facts t on t.id=s.team_id where t.slug='racing-bulls' and s.role='race_driver' and s.person_id is not null"),0);
  await assert.rejects(db.exec(`insert into f1_team_driver_slots values('${dataset}',501,'reserve_driver',3,null,'vacant',null)`));
  await db.exec('set role anon');
  assert.equal(await scalar('select count(*)::int n from driver_contracts_2027'),23);
  await assert.rejects(db.exec('delete from f1_driver_contract_facts'));
  await assert.rejects(db.exec('select * from f1_contract_reference_backups'));
  await db.exec('reset role');
  await db.close();
  const broken=new PGlite();
  await broken.exec(`create role anon;create role authenticated;
    create table people(id bigint primary key,slug text unique,display_name text);
    create table f1_team_facts(id bigint primary key,slug text unique,short_name text);
    create table driver_contracts(id bigint primary key);
    create table series_entries(id bigint primary key,person_id bigint,series text,season int,entrant_name text,entry_role text,source_key text,verified_on date);grant select on people,f1_team_facts to anon,authenticated;`);
  await assert.rejects(broken.exec(migration),/Expected 11 reference teams/);
  await broken.exec('rollback');
  assert.equal((await broken.query("select count(*)::int n from information_schema.tables where table_name='f1_driver_contract_facts'")).rows[0].n,0);
  await broken.close();
  console.log('2027 contract migration PASS: repeat application, slug identity mapping, 44 slots, 22 reserve slots, 11 reserve candidates, unknown salaries, confirmed-only assignments, read-only public access, private backup, rollback on missing identities.');
})().catch(error=>{console.error(error);process.exitCode=1;});
