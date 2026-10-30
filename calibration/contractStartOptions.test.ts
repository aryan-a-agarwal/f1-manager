import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createCareer} from '../lib/career';
import {contractStartOptions,contractStartDateLabel,outgoingContractStartOption} from '../lib/career/contractStartOptions';
import {negotiationCosts} from '../lib/career/negotiation';

test('start options use saved race and summer-break dates and start after season end',()=>{
  const career=createCareer('mclaren');
  const options=contractStartOptions(career);
  assert.equal(options.find(o=>o.id==='today')!.date,career.clock.date);
  const race=career.season.calendar.rounds[0].sessions.find(s=>s.kind==='race')!;
  assert.equal(options.find(o=>o.id==='next_race')!.date,new Date(Date.parse(`${race.date}T00:00:00Z`)+86400000).toISOString().slice(0,10));
  const summer=options.find(o=>o.id==='summer_break')!;
  assert.ok(career.season.calendar.periods!.some(p=>p.kind==='break'&&p.startDate===summer.date));
  assert.equal(options.find(o=>o.id==='season_end')!.date,'2028-01-01');
  assert.equal(options.find(o=>o.id==='next_season_end')!.date,'2029-01-01');
  assert.equal(contractStartDateLabel('2029-01-01'),'01/01/2029');
});
test('outgoing contract option starts the day after the selected seat holder expires',()=>{
  const career=createCareer('mclaren');
  const option=outgoingContractStartOption(career,'race_driver',1);
  assert.equal(option.date,'2031-01-01');
  const costs=negotiationCosts(career,'max-verstappen','race_driver',1,5500000000,{startDate:option.date!,endDate:'2031-12-31',clauses:[]});
  assert.equal(costs.severance,0);
  assert.equal(costs.outgoingLoyalty,0);
  const slot=career.contractDesk!.baseline.slots.find(s=>s.teamId==='mclaren'&&s.role==='race_driver'&&s.number===1)!;
  const fact=career.contractDesk!.baseline.facts.find(f=>f.personId===slot.personId&&f.teamId==='mclaren'&&f.role==='race_driver')!;
  delete fact.scenarioTerms;fact.exactEnd=null;
  assert.match(outgoingContractStartOption(career,'race_driver',1).reason!,/unrecorded/);
  slot.personId=null;
  assert.match(outgoingContractStartOption(career,'race_driver',1).reason!,/No driver/);
});
test('completed or postponed races are skipped and passed or missing breaks are unavailable',()=>{
  const career=createCareer('mclaren');
  const first=career.season.calendar.rounds[0].sessions.find(s=>s.kind==='race')!;
  first.status='completed';
  const second=career.season.calendar.rounds[1].sessions.find(s=>s.kind==='race')!;
  second.status='postponed';
  const third=career.season.calendar.rounds[2].sessions.find(s=>s.kind==='race')!;
  assert.equal(contractStartOptions(career).find(o=>o.id==='next_race')!.date,new Date(Date.parse(`${third.date}T00:00:00Z`)+86400000).toISOString().slice(0,10));
  career.clock.date='2027-12-31';
  const options=contractStartOptions(career);
  assert.equal(options.find(o=>o.id==='today')!.date,'2027-12-31');
  assert.equal(options.find(o=>o.id==='next_race')!.date,null);
  assert.equal(options.find(o=>o.id==='summer_break')!.date,null);
  career.season.calendar.periods=[];
  assert.match(contractStartOptions(career).find(o=>o.id==='summer_break')!.reason!,/No summer break/);
});
