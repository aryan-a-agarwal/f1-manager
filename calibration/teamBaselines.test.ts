import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import base from '../supabase/seed-data/2027-team-baselines.json';
import ownership from '../supabase/seed-data/2027-team-ownership.json';
import {teamRatingGroups} from '../lib/teamProfileData';

test('every team has complete, bounded and varied explicitly assumed ratings',()=>{
 assert.equal(base.teams.length,11);assert.equal(base.rating_fields.length,123);
 assert.equal(new Set(base.teams.map(t=>t.team_slug)).size,11);
 for(const team of base.teams){assert.equal(team.basis,'game_assumption');assert.deepEqual(Object.keys(team.ratings).sort(),[...base.rating_fields].sort());
  for(const score of Object.values(team.ratings))assert.ok(Number.isInteger(score)&&score>=0&&score<=100);
  assert.equal(Object.keys(team.facilities).length,25);assert.equal(Object.keys(team.financial_assumptions_usd_millions).length,23);
 }
 assert.ok(new Set(base.teams.map(t=>t.ratings.prestige_rating)).size>1);
 assert.ok(base.teams.find(t=>t.team_slug==='mercedes')!.ratings.prestige_rating>base.teams.find(t=>t.team_slug==='cadillac')!.ratings.prestige_rating);
});
test('real seeded salaries align with estimated starting team driver costs',()=>{
 const grid=JSON.parse(fs.readFileSync('supabase/seed-data/2027-starting-grid.json','utf8'));
 for(const team of base.teams){const expected=grid.contracts.filter((c:{team_slug:string})=>c.team_slug===team.team_slug).reduce((sum:number,c:{annual_salary_usd_cents:number})=>sum+c.annual_salary_usd_cents,0)/100_000_000;assert.equal(team.financial_assumptions_usd_millions.driver_cost_usd_millions,Math.round(expected*100)/100);}
});
test('ratings display allocated values only when a versioned allocation is supplied',()=>{
 const sample=base.teams[0],row=Object.fromEntries(base.rating_fields.map(f=>[f,50]));
 assert.equal(teamRatingGroups(row)[0].fields[0].text,'Unrated');
 const assigned=teamRatingGroups(row,sample.ratings).flatMap(g=>g.fields);
 assert.equal(assigned.length,123);assert.ok(assigned.every(f=>f.text!=='Unrated'));
});
test('ownership entities can be shared and stakes stay unknown where not sourced',()=>{
 assert.equal(new Set(ownership.owners.map(o=>o.slug)).size,ownership.owners.length);
 const slugs=new Set(ownership.owners.map(o=>o.slug));const teams=new Set(base.teams.map(t=>t.team_slug));
 for(const link of ownership.relationships){assert.ok(slugs.has(link.owner_slug));assert.ok(teams.has(link.team_slug));assert.ok(link.percentage===null||link.percentage>=0&&link.percentage<=100);}
 assert.equal(new Set(ownership.relationships.map(l=>l.team_slug)).size,11);
 assert.equal(ownership.relationships.filter(l=>l.owner_slug==='red-bull').length,2);
 assert.equal(ownership.relationships.find(l=>l.owner_slug==='cyvn')!.percentage,null);
 const sql=fs.readFileSync('supabase/migrations/20261027020000_team_baselines_and_ownership.sql','utf8');
 assert.match(sql,/team_id bigint not null references public\.f1_team_facts/);assert.match(sql,/owner_id bigint not null references public\.f1_owners/);assert.match(sql,/effective_until date/);
 assert.match(sql,/f1_owner_game_baselines/);assert.match(sql,/begin;/);assert.match(sql,/commit;/);
});

test('future ownership changes retain team identity and history without editing the source snapshot',async()=>{
 const {transferTeamStake}=await import('../lib/career/teamOwnership');
 const initial={owners:[{id:'a',name:'A',kind:'company'},{id:'b',name:'B',kind:'fund'}],periods:[{teamId:'team',ownerId:'a',percentage:100,from:'2027-01-01',until:null,basis:'game_assumption' as const}]};
 const next=transferTeamStake(initial,{teamId:'team',fromOwnerId:'a',toOwnerId:'b',date:'2029-07-01',percentage:40});
 assert.equal(initial.periods[0].until,null);assert.equal(next.periods[0].until,'2029-06-30');
 assert.equal(next.periods.find(p=>p.ownerId==='b')?.percentage,40);assert.equal(next.periods.find(p=>p.ownerId==='a'&&p.from==='2029-07-01')?.percentage,60);
 assert.throws(()=>transferTeamStake({...initial,periods:[{...initial.periods[0],percentage:null}]},{teamId:'team',fromOwnerId:'a',toOwnerId:'b',date:'2029-01-01',percentage:10}),/existing stake/);
});
