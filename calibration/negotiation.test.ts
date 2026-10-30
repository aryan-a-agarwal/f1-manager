import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createCareer,saveCareer,loadCareer,type CareerStorage} from '../lib/career';
import {incomingReleaseCosts,negotiationCosts,salaryBetween,validNegotiation,type NegotiationTerms} from '../lib/career/negotiation';
import {isContractDeskState,saveContractDraft} from '../lib/career/contracts';
import {profileFromSearch,profileUrl} from '../lib/profileNavigation';
const terms:NegotiationTerms={startDate:'2028-01-01',endDate:'2029-12-31',clauses:[{kind:'loyalty',value:100000},{kind:'increase',value:10},{kind:'signing',value:50000}]};
test('salary prorates actual days, handles leap years and compounds increases',()=>{
  assert.equal(salaryBetween(36500,'2027-07-01','2027-12-31',2027),18400);
  assert.equal(salaryBetween(36600,'2028-02-29','2028-02-29',2028),100);
  assert.equal(salaryBetween(100000,'2028-01-01','2029-12-31',2028,10),210000);
});
test('replacement pays unexpired salary once and protects the departure season loyalty',()=>{
  const career=createCareer('mclaren');
  const costs=negotiationCosts(career,'lewis-hamilton','race_driver',1,100000000,terms);
  assert.equal(costs.salary,210000000);assert.equal(costs.loyalty,20000000);assert.equal(costs.signing,5000000);
  assert.equal(costs.severance,7500000000); // Norris: three remaining years at $25m.
  assert.equal(costs.outgoingLoyalty,250000000);
  assert.equal(costs.knownTotal,7985000000);
  assert.equal(costs.complete,true);
});
test('expiry eliminates dismissal costs, while unknown expiry remains unresolved',()=>{
  const career=createCareer('ferrari');
  const costs=negotiationCosts(career,'george-russell','race_driver',2,100000000,terms);
  assert.equal(costs.severance,0);assert.equal(costs.outgoingLoyalty,0);
  const fact=career.contractDesk!.baseline.facts.find(f=>f.personId==='lewis-hamilton')!;
  delete fact.scenarioTerms;fact.exactEnd=null;
  assert.equal(negotiationCosts(career,'george-russell','race_driver',2,100000000,terms).severance,null);
});
test('early dismissal includes scheduled salary escalation and negotiated protection',()=>{
  const career=createCareer('mercedes');
  const fact=career.contractDesk!.baseline.facts.find(f=>f.personId==='kimi-antonelli')!;
  const protection=fact.clausePackage!.clauses.find(c=>c.kind==='termination_protection')!;
  protection.parameters.remainingBaseSalaryPercent=50;
  const costs=negotiationCosts(career,'lewis-hamilton','race_driver',2,100000000,terms);
  assert.equal(costs.remainingSalary,550000000);assert.equal(costs.severance,275000000);
});
test('same-driver overlap, unknown incoming and incompatible role clauses are flagged',()=>{
  const career=createCareer('mclaren');
  assert.equal(negotiationCosts(career,'lando-norris','race_driver',1,100000000,terms).severance,null);
  assert.equal(negotiationCosts(career,'unknown','race_driver',1,100000000,terms).complete,false);
  assert.ok(negotiationCosts(career,'lewis-hamilton','race_driver',1,100000000,{...terms,clauses:[{kind:'appearance',value:100}]}).issues.some(i=>i.includes('Reserve-specific')));
  assert.equal(validNegotiation({...terms,startDate:'2028-02-30'}),false);
  assert.equal(validNegotiation({...terms,clauses:[{kind:'increase',value:NaN}]}),false);
  assert.equal(validNegotiation({...terms,clauses:[{kind:'increase',value:10},{kind:'increase',value:20}]}),false);
});
test('incoming release estimate includes their current salary guarantee and loyalty in the total',()=>{
  const career=createCareer('mclaren');
  const costs=negotiationCosts(career,'max-verstappen','race_driver',1,100000000,terms);
  const release=costs.incomingRelease.contracts[0];
  assert.equal(release.teamId,'red-bull');
  assert.equal(release.remainingSalary,16500000000); // $55m for 2028–2030.
  assert.equal(release.guaranteePercent,100);
  assert.equal(release.protectedLoyalty,550000000);
  assert.equal(release.amount,17050000000);
  assert.equal(costs.incomingRelease.total,17050000000);
  assert.equal(costs.incomingCommitted,17285000000);
  assert.equal(costs.knownTotal,25035000000);
  assert.equal(costs.firstSeasonImpact,7750000000+17050000000+100000000+10000000+5000000);
  assert.ok(costs.issues.some(i=>i.includes('Release permission')));
});
test('first-season impact includes prorated pay, loyalty and one-off replacement costs in the start year',()=>{
  const career=createCareer('mclaren');
  const currentTerms:NegotiationTerms={startDate:'2027-07-01',endDate:'2028-12-31',clauses:[{kind:'loyalty',value:100000},{kind:'signing',value:50000}]};
  const costs=negotiationCosts(career,'max-verstappen','race_driver',1,100000000,currentTerms);
  const firstYear=costs.yearly.find(row=>row.year===2027)!;
  assert.equal(costs.firstSeasonImpact,firstYear.salary+firstYear.loyalty+costs.signing+costs.incomingRelease.known+costs.severance!+costs.outgoingLoyalty!);
  assert.ok(costs.firstSeasonImpact<costs.knownTotal); // 2028 salary and loyalty remain future costs.
  assert.equal(costs.hasUnresolvedCosts,false);
  const max=career.contractDesk!.baseline.facts.find(f=>f.personId==='max-verstappen')!;
  delete max.clausePackage;
  const unresolved=negotiationCosts(career,'max-verstappen','race_driver',1,100000000,currentTerms);
  assert.equal(unresolved.hasUnresolvedCosts,true);
  assert.equal(negotiationCosts(career,'max-verstappen','race_driver',1,100000000,terms).hasUnresolvedCosts,true);
});
test('incoming release expires after contract end and takes salary increases into account',()=>{
  const career=createCareer('mclaren');
  assert.equal(incomingReleaseCosts(career,'lewis-hamilton','2028-01-01').total,0);
  const antonelli=incomingReleaseCosts(career,'kimi-antonelli','2028-01-01');
  assert.equal(antonelli.contracts[0].remainingSalary,550000000);
  assert.equal(antonelli.contracts[0].protectedLoyalty,50000000);
  assert.equal(antonelli.total,600000000);
  assert.equal(incomingReleaseCosts(career,'lando-norris','2028-01-01').total,0);
});
test('unknown incoming terms stay unresolved, while compatible reserve roles do not trigger release costs',()=>{
  const career=createCareer('mclaren');
  assert.equal(incomingReleaseCosts(career,'unknown','2028-01-01').total,null);
  const max=career.contractDesk!.baseline.facts.find(f=>f.personId==='max-verstappen')!;
  const original=max.clausePackage;
  delete max.clausePackage;
  const unresolved=incomingReleaseCosts(career,'max-verstappen','2028-01-01');
  assert.equal(unresolved.total,null);assert.equal(unresolved.known,0);
  assert.equal(negotiationCosts(career,'max-verstappen','race_driver',1,100000000,terms).incomingCommitted,null);
  max.clausePackage=original;
  const shared=incomingReleaseCosts(career,'yuki-tsunoda','2027-06-01');
  assert.deepEqual(shared.contracts,[]);
  assert.equal(shared.total,0);
  const reserve=negotiationCosts(career,'max-verstappen','reserve_driver',1,100000000,terms);
  assert.equal(reserve.incomingRelease.total,0);
  assert.ok(reserve.issues.some(issue=>issue.includes('team priority')));
});
test('fixed incoming release fee overrides salary-based estimate only while contract end is known',()=>{
  const career=createCareer('mclaren');
  const fact=career.contractDesk!.baseline.facts.find(f=>f.personId==='max-verstappen')!;
  const clauses=fact.clausePackage!.clauses;
  clauses.push({kind:'release_fee',title:'Release fee',terms:'Fixed fee',parameters:{amountCents:123450000},basis:'game_assumption',execution:'recorded_only'} as unknown as typeof clauses[number]);
  const release=incomingReleaseCosts(career,'max-verstappen','2028-01-01');
  assert.equal(release.total,123450000);assert.equal(release.contracts[0].basis,'fixed_fee');
  delete fact.scenarioTerms;fact.exactEnd=null;
  assert.equal(incomingReleaseCosts(career,'max-verstappen','2028-01-01').total,null);
});
test('date-based proposals persist without changing clock, lineup or financial state',()=>{
  const career=createCareer('mclaren');
  const draft=saveContractDraft(career,{id:'proposal-test',personId:'lewis-hamilton',role:'race_driver',seat:1,startSeason:2027,seasons:1,salaryCents:100000000,negotiation:{...terms,startDate:'2027-07-01',endDate:'2027-12-31'}});
  assert.deepEqual(draft.workforce,career.workforce);assert.deepEqual(draft.clock,career.clock);assert.deepEqual(draft.finance,career.finance);
  assert.ok(isContractDeskState(draft.contractDesk));
  const values=new Map<string,string>();const storage:CareerStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);},removeItem:k=>{values.delete(k);}};
  saveCareer(draft,storage);assert.deepEqual(loadCareer(storage)!.contractDesk!.drafts,draft.contractDesk!.drafts);
  const target={kind:'negotiation' as const,id:'person:18'};
  assert.deepEqual(profileFromSearch(new URL(profileUrl('/game?section=database&view=drivers',target),'http://game.local').search),target);
});
