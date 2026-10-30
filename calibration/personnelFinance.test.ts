import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState,WeekendSnapshot,SessionOutput} from '../lib/career/types';
import {personnelFinanceState,recordStaffEmployment,terminateStaffEmployment,recordStaffEarnedBonus,configureDriverPaymentTerms,applyPersonnelPaymentTerms,personnelFinanceObligations,processPersonnelFinance,recordDriverReleaseAgreement,matchingDriverReleaseAgreement,driverReleaseAgreedTotal,validPersonnelFinance} from '../lib/career/personnelFinance';
import {salaryBetween} from '../lib/career/negotiation';

function resultCareer(options:{position?:number;reserve?:boolean;placeholder?:boolean}={}):CareerState{
  const c=createCareer('mclaren'),desk=c.contractDesk!,round=c.season.calendar.rounds[0],session=round.sessions.find(s=>s.kind==='race')!;
  const slot=desk.baseline.slots.find(s=>s.teamId==='mclaren'&&s.role===(options.reserve?'reserve_driver':'race_driver')&&s.number===1)!;
  const person=desk.baseline.people.find(p=>p.id===slot.personId)!,driverId=person.careerDriverId??`contract:${person.id}`;
  const participants=[{teamId:'mclaren',teamName:'McLaren',driverId,driverName:person.name,abbreviation:'TEST',carNumber:1}];
  const snapshot:WeekendSnapshot={id:'snapshot-bonus',schemaVersion:1,careerId:c.metadata.careerId,season:2027,roundId:round.id,trackId:round.trackId,weekendNumber:1,sprint:false,createdAt:'2027-01-04T09:00:00Z',rulesetVersion:'2026-format-v1',participants,circuit:{lapLengthKm:5,raceLaps:58,raceDistanceKm:290,provenance:'official_fact'}};
  const output:SessionOutput={schemaVersion:1,id:'result-bonus-1',attemptId:'attempt-bonus',sessionId:session.id,completionMode:options.placeholder?'administrative_placeholder':'simulated',classification:[{position:options.position??1,driverId,status:'classified',laps:58,timeMs:100000,gapMs:0}],distancePercent:100,provenance:options.placeholder?'administrative_placeholder':'engine_generated',engineId:'test',engineVersion:'1',createdAt:session.date+'T15:00:00Z'};
  return {...c,clock:{...c.clock,date:session.date},season:{...c.season,calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>r.id===round.id?{...r,sessions:r.sessions.map(s=>s.id===session.id?{...s,status:'completed' as const,resultId:output.id}:s)}:r)}},weekendOperations:{...c.weekendOperations,snapshots:[snapshot],outputs:[output],outbox:[{id:'event-bonus',type:'SessionCompleted',roundId:round.id,sessionId:session.id,resultId:output.id,createdAt:output.createdAt,status:'processed',receipts:['scoring']}]}};
}
function ownFact(c:CareerState,role='race_driver'){return c.contractDesk!.baseline.facts.find(f=>f.teamId==='mclaren'&&f.role===role)!;}

test('named staff payroll is prorated and quarterly settlement preserves monthly recognition',()=>{
 let c=createCareer('mclaren');
 c=recordStaffEmployment(c,{id:'engineer',personId:'staff-engineer',name:'Named Engineer',role:'Aerodynamicist',from:'2027-01-15',to:'2027-12-31',annualCents:12_000_000,frequency:'quarterly',annualIncreasePercent:5,relevantPercent:100,classificationReason:'Recorded employment agreement; technical staff'});
 const bills=personnelFinanceObligations(c),jan=bills.find(b=>b.id==='staff-salary:engineer:2027-01-31')!;
 assert.equal(jan.amountCents,-salaryBetween(12_000_000,'2027-01-15','2027-01-31',2027));assert.equal(jan.recognitionDate,'2027-01-31');assert.equal(jan.dueDate,'2027-03-31');assert.equal(jan.relevantCents,-jan.amountCents);
 assert.throws(()=>recordStaffEmployment(c,{...personnelFinanceState(c).staff[0],id:'duplicate'}),/overlapping/);
 c=terminateStaffEmployment(c,'engineer','2027-02-10',100_000);const after=personnelFinanceObligations(c);
 assert.equal(after.filter(b=>b.id.startsWith('staff-salary:')).length,2);assert.equal(after.find(b=>b.id==='staff-exit:engineer')!.amountCents,-100_000);
 assert.ok(validPersonnelFinance(personnelFinanceState(c)));
});

test('staff bonuses require an earned condition and retain cost treatment',()=>{
 let c=createCareer('mclaren');c=recordStaffEmployment(c,{id:'principal',personId:'named-principal',name:'Named Principal',role:'Principal',from:c.clock.date,to:'2027-12-31',annualCents:20_000_000,frequency:'monthly',annualIncreasePercent:0,relevantPercent:0,classificationReason:'Explicit approved remuneration exclusion'});
 c=recordStaffEarnedBonus(c,{id:'bonus',employmentId:'principal',description:'Agreed milestone',earnedOn:c.clock.date,dueDate:'2027-01-10',amountCents:50_000,conditionReference:'Board approval and completed milestone'});
 const b=personnelFinanceObligations(c).find(o=>o.id==='staff-bonus:bonus')!;assert.equal(b.relevantCents,0);assert.equal(b.amountCents,-50_000);
 assert.throws(()=>recordStaffEarnedBonus(c,{id:'not-earned',employmentId:'principal',description:'Future milestone',earnedOn:'2027-02-10',dueDate:'2027-02-15',amountCents:1,conditionReference:'Future'}),/earned/);
});

test('result bonuses are independent of scoring receipts and post once at the highest seeded tier',()=>{
 const c=resultCareer(),fact=ownFact(c),win=Number(fact.clausePackage!.clauses.find(s=>s.kind==='race_bonus')!.parameters.winCents);
 const paid=processPersonnelFinance(c),bonuses=paid.finance!.book!.obligations.filter(o=>o.id.startsWith('personnel-bonus:'));
 assert.equal(bonuses.length,1);assert.equal(bonuses[0].amountCents,-win);assert.equal(bonuses[0].relevantCents,0);
 assert.ok(paid.weekendOperations.outbox[0].receipts!.includes('finance-personnel'));
 assert.equal(processPersonnelFinance(paid),paid);
 assert.ok(validPersonnelFinance(personnelFinanceState(paid)));
});

test('a corrected classification creates a refund delta and cancellation removes the remaining entitlement',()=>{
 let c=processPersonnelFinance(resultCareer());const fact=ownFact(c),win=Number(fact.clausePackage!.clauses.find(s=>s.kind==='race_bonus')!.parameters.winCents),podium=Number(fact.clausePackage!.clauses.find(s=>s.kind==='race_bonus')!.parameters.podiumCents);
 c={...c,weekendOperations:{...c.weekendOperations,outputs:c.weekendOperations.outputs.map(o=>({...o,classification:o.classification.map(r=>({...r,position:2}))}))}};
 c=processPersonnelFinance(c);assert.equal(c.finance!.book!.obligations.at(-1)!.amountCents,win-podium);assert.equal(personnelFinanceState(c).awards[0].amountCents,podium);
 const sessionId=c.weekendOperations.outputs[0].sessionId;
 c={...c,season:{...c.season,calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>({...r,sessions:r.sessions.map(s=>s.id===sessionId?{...s,status:'cancelled' as const}:s)}))}}};
 c=processPersonnelFinance(c);assert.equal(c.finance!.book!.obligations.at(-1)!.amountCents,podium);assert.equal(personnelFinanceState(c).awards[0].amountCents,0);assert.equal(processPersonnelFinance(c),c);
});

test('placeholder results never earn bonus; actual reserve participant receives their start fee',()=>{
 assert.equal(processPersonnelFinance(resultCareer({placeholder:true})).finance!.book!.obligations.length,0);
 const c=resultCareer({reserve:true}),fact=ownFact(c,'reserve_driver'),fee=Number(fact.clausePackage!.clauses.find(s=>s.kind==='substitution_fee')!.parameters.perGrandPrixStartCents);
 const paid=processPersonnelFinance(c);assert.equal(paid.finance!.book!.obligations.length,1);assert.equal(paid.finance!.book!.obligations[0].amountCents,-fee);assert.equal(personnelFinanceState(paid).awards[0].kind,'appearance');
});

test('explicit bonus cap and stacking amendment are applied, and salary timing does not change recognition',()=>{
 let c=createCareer('mclaren'),fact=ownFact(c);c=configureDriverPaymentTerms(c,{contractId:fact.id,effectiveOn:c.clock.date,frequency:'annual',signingDate:'start',loyaltyDate:'year_end',bonusDelayDays:10,bonusAnnualCapCents:12345,stacking:'stack',agreementReference:'Agreed payment amendment'});
 const bill={id:'salary:'+fact.id+':2027-01-31',sourceId:'contract:'+fact.id,description:'salary',counterparty:'driver',category:'driver_pay' as const,recognitionDate:'2027-01-31',dueDate:'2027-01-31',amountCents:-100_000,relevantCents:0,basis:'career_contract' as const};
 const mapped=applyPersonnelPaymentTerms(c,[bill])[0];assert.equal(mapped.dueDate,'2027-12-31');assert.equal(mapped.recognitionDate,'2027-01-31');assert.equal(mapped.id,bill.id);
 const race=resultCareer();const amended={...race,finance:{...race.finance!,book:{...race.finance!.book!,personnel:personnelFinanceState(c)}}};const paid=processPersonnelFinance(amended);
 assert.equal(paid.finance!.book!.obligations[0].amountCents,-12345);assert.equal(paid.finance!.book!.obligations[0].dueDate,new Date(Date.parse(race.clock.date+'T00:00:00Z')+10*86400000).toISOString().slice(0,10));
});

test('a releasing team fee requires explicit consent and does not itself pay or sign a driver',()=>{
 let c=createCareer('mclaren');const f=c.contractDesk!.baseline.facts.find(f=>f.teamId==='ferrari'&&f.role==='race_driver')!;
 assert.equal(driverReleaseAgreedTotal(c,f.personId,'2027-04-01'),null);
 c=recordDriverReleaseAgreement(c,{id:'release-consent',personId:f.personId,fromTeamId:f.teamId,toTeamId:'mclaren',role:'race_driver',startsOn:'2027-04-01',amountCents:200_000_000,agreedOn:c.clock.date,agreementReference:'Explicit releasing-team approval'});
 assert.equal(matchingDriverReleaseAgreement(c,f.personId,f.teamId,'2027-04-01')!.amountCents,200_000_000);assert.equal(driverReleaseAgreedTotal(c,f.personId,'2027-04-01'),200_000_000);
 assert.equal(c.finance!.book!.entries.length,0);assert.equal(c.contractDesk!.drafts.length,0);
 assert.ok(validPersonnelFinance(personnelFinanceState(c)));const bad=structuredClone(personnelFinanceState(c));bad.releaseAgreements[0].amountCents=NaN;assert.equal(validPersonnelFinance(bad),false);
});

test('annual bonus cap reflows across later results after a correction',()=>{
 let c=resultCareer(),fact=ownFact(c);const original=c.weekendOperations.outputs[0],first=c.season.calendar.rounds[0].sessions.find(s=>s.kind==='race')!,secondRound=c.season.calendar.rounds[1],second=secondRound.sessions.find(s=>s.kind==='race')!;
 const contractTerms={contractId:fact.id,effectiveOn:c.finance!.book!.activatedOn,frequency:'monthly' as const,signingDate:'start',loyaltyDate:'year_end',bonusDelayDays:0,bonusAnnualCapCents:100_000_000,stacking:'highest' as const,agreementReference:'Explicit annual cap'};
 // Record the amendment at the career start, then use the same recorded terms for both results.
 const configured=configureDriverPaymentTerms({...c,clock:{...c.clock,date:c.finance!.book!.activatedOn}},contractTerms);
 c={...c,finance:configured.finance,clock:{...c.clock,date:second.date},season:{...c.season,calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>r.id===secondRound.id?{...r,sessions:r.sessions.map(s=>s.id===second.id?{...s,status:'completed' as const,resultId:'result-bonus-2'}:s)}:r)}},weekendOperations:{...c.weekendOperations,snapshots:[...c.weekendOperations.snapshots,{...c.weekendOperations.snapshots[0],id:'snapshot-bonus-2',roundId:secondRound.id}],outputs:[original,{...original,id:'result-bonus-2',sessionId:second.id}]}};
 c=processPersonnelFinance(c);const before=personnelFinanceState(c).awards.filter(a=>a.kind==='race');assert.equal(before.reduce((n,a)=>n+a.amountCents,0),100_000_000);
 assert.equal(before.find(a=>a.sessionId===second.id)!.amountCents,25_000_000);
 c={...c,weekendOperations:{...c.weekendOperations,outputs:c.weekendOperations.outputs.map(o=>o.sessionId===first.id?{...o,classification:o.classification.map(r=>({...r,position:2}))}:o)}};
 c=processPersonnelFinance(c);const after=personnelFinanceState(c).awards.filter(a=>a.kind==='race');assert.equal(after.find(a=>a.sessionId===first.id)!.amountCents,25_000_000);assert.equal(after.find(a=>a.sessionId===second.id)!.amountCents,75_000_000);assert.equal(after.reduce((n,a)=>n+a.amountCents,0),100_000_000);
 assert.equal(c.finance!.book!.obligations.filter(o=>o.id.startsWith('personnel-bonus:')).reduce((n,o)=>n+o.amountCents,0),-100_000_000);
});

test('championship bonus uses final standings only and does not reward an unplayed zero-point season',()=>{
 let c=resultCareer(),person=c.contractDesk!.baseline.people.find(p=>p.id===ownFact(c).personId)!,fact=ownFact(c),champ=Number(fact.clausePackage!.clauses.find(s=>s.kind==='championship_bonus')!.parameters.amountCents);
 c={...c,season:{...c.season,phase:'offseason',calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>({...r,status:'archived' as const}))}},championship:{...c.championship,drivers:c.championship.drivers.map(d=>d.driverId===person.careerDriverId?{...d,points:100,wins:1}:d)}};
 const paid=processPersonnelFinance(c);assert.equal(personnelFinanceState(paid).awards.find(a=>a.kind==='championship')!.amountCents,champ);assert.equal(processPersonnelFinance(paid),paid);
 const unplayed={...c,weekendOperations:{...c.weekendOperations,outputs:[]},championship:{...c.championship,drivers:c.championship.drivers.map(d=>({...d,points:0,wins:0}))}};
 assert.ok(!personnelFinanceState(processPersonnelFinance(unplayed)).awards.some(a=>a.kind==='championship'));
});
