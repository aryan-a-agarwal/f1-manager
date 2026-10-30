import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState,SessionOutput,WeekendSnapshot} from '../lib/career/types';
import type {FinanceAgreement} from '../lib/career/financeOperationsTypes';
import type {FinanceBook} from '../lib/career/financeTypes';
import {emptyFinanceOperations,financeInvoiceViews} from '../lib/career/financeOperations';
import {processFinance} from '../lib/career/financeEngine';
import {processAgreementBonuses,validAgreementBonusAwards,type AgreementBonusAward} from '../lib/career/financeAgreementBonuses';

function fixture({trigger='race_win',autoSettle=false,amountCents=100_000,annualCapCents=200_000,placeholder=false}:{trigger?:'race_win'|'race_podium'|'constructors_title';autoSettle?:boolean;amountCents?:number;annualCapCents?:number;placeholder?:boolean}={}):CareerState{
  const c=createCareer('mclaren'),round=c.season.calendar.rounds[0],session=round.sessions.find(s=>s.kind==='race')!,desk=c.contractDesk!;
  const people=desk.baseline.slots.filter(s=>s.teamId==='mclaren'&&s.role==='race_driver').map(s=>desk.baseline.people.find(p=>p.id===s.personId)!);
  const participants=people.map((p,i)=>({teamId:'mclaren',teamName:'McLaren',driverId:p.careerDriverId??`contract:${p.id}`,driverName:p.name,abbreviation:'T'+i,carNumber:i+1}));
  const snapshot:WeekendSnapshot={id:'bonus-snapshot',schemaVersion:1,careerId:c.metadata.careerId,season:2027,roundId:round.id,trackId:round.trackId,weekendNumber:1,sprint:false,createdAt:session.date+'T09:00:00Z',rulesetVersion:'2026-format-v1',participants,circuit:{lapLengthKm:5,raceLaps:58,raceDistanceKm:290,provenance:'official_fact'}};
  const result:SessionOutput={schemaVersion:1,id:'sponsor-result-1',attemptId:'sponsor-attempt',sessionId:session.id,completionMode:placeholder?'administrative_placeholder':'simulated',classification:participants.map((p,i)=>({position:i+1,driverId:p.driverId,status:'classified' as const,laps:58,timeMs:100000+i*1000,gapMs:i*1000})),distancePercent:100,provenance:placeholder?'administrative_placeholder':'engine_generated',engineId:'test',engineVersion:'1',createdAt:session.date+'T15:00:00Z'};
  const agreement:FinanceAgreement={id:'sponsor',title:'Recorded result sponsorship',partyId:'sponsor-party',kind:'sponsorship',direction:'income',amountCents:100,startDate:'2027-01-04',endDate:'2027-12-31',frequency:'once',category:'sponsorship',classification:'excluded',relevantPercent:0,account:'revenue',autoSettle,guaranteed:false,note:'Signed performance-only rights agreement',basis:'recorded',bonus:{trigger,amountCents,annualCapCents},revision:1,status:'active',createdOn:'2027-01-04',amendments:[]};
  return {...c,clock:{...c.clock,date:session.date},finance:{...c.finance!,book:{...c.finance!.book!,operations:{...emptyFinanceOperations(),counterparties:[{id:'sponsor-party',name:'Recorded Sponsor',kind:'sponsor'}],agreements:[agreement]}}},season:{...c.season,calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>r.id===round.id?{...r,sessions:r.sessions.map(s=>s.id===session.id?{...s,status:'completed' as const,resultId:result.id}:s)}:r)}},weekendOperations:{...c.weekendOperations,snapshots:[snapshot],outputs:[result]}};
}
const awards=(c:CareerState)=>(c.finance!.book! as FinanceBook&{agreementBonusAwards?:AgreementBonusAward[]}).agreementBonusAwards??[];
const bonusInvoices=(c:CareerState)=>c.finance!.book!.operations!.invoices.filter(i=>i.sourceId?.startsWith('agreement-bonus:'));

test('explicit conditional sponsor bonus is earned once from a simulated team win',()=>{
  const c=fixture(),earned=processAgreementBonuses(c);assert.equal(bonusInvoices(earned).length,1);assert.equal(bonusInvoices(earned)[0].amountCents,100_000);assert.equal(bonusInvoices(earned)[0].direction,'income');assert.equal(awards(earned)[0].amountCents,100_000);assert.equal(processAgreementBonuses(earned),earned);assert.ok(validAgreementBonusAwards(awards(earned)));
  assert.equal(bonusInvoices(processAgreementBonuses(fixture({placeholder:true}))).length,0);
  const rival=fixture();rival.weekendOperations.snapshots[0].participants=rival.weekendOperations.snapshots[0].participants.map(p=>({...p,teamId:'ferrari'}));assert.equal(bonusInvoices(processAgreementBonuses(rival)).length,0);
});

test('team podium bonus pays once for a double podium and annual cap reflows after correction',()=>{
  let c=fixture({trigger:'race_podium',amountCents:20_000,annualCapCents:30_000}),secondRound=c.season.calendar.rounds[1],second=secondRound.sessions.find(s=>s.kind==='race')!;
  c={...c,clock:{...c.clock,date:second.date},season:{...c.season,calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>r.id===secondRound.id?{...r,sessions:r.sessions.map(s=>s.id===second.id?{...s,status:'completed' as const,resultId:'sponsor-result-2'}:s)}:r)}},weekendOperations:{...c.weekendOperations,snapshots:[...c.weekendOperations.snapshots,{...c.weekendOperations.snapshots[0],id:'bonus-snapshot-2',roundId:secondRound.id}],outputs:[...c.weekendOperations.outputs,{...c.weekendOperations.outputs[0],id:'sponsor-result-2',sessionId:second.id}]}};
  c=processAgreementBonuses(c);assert.deepEqual(awards(c).map(a=>a.amountCents),[20_000,10_000]);
  const firstId=c.weekendOperations.outputs[0].sessionId;c={...c,weekendOperations:{...c.weekendOperations,outputs:c.weekendOperations.outputs.map(o=>o.sessionId===firstId?{...o,classification:o.classification.map(r=>({...r,position:r.position+10}))}:o)}};
  c=processAgreementBonuses(c);assert.equal(awards(c).find(a=>a.eventId===firstId)!.amountCents,0);assert.equal(awards(c).find(a=>a.eventId===second.id)!.amountCents,20_000);
  assert.equal(bonusInvoices(c).reduce((sum,i)=>sum+(i.direction==='income'?1:-1)*(i.amountCents-i.creditCents),0),20_000);
});

test('unpaid corrected result credits the receivable without inventing a cash refund',()=>{
  let c=processAgreementBonuses(fixture());const original=bonusInvoices(c)[0];
  c={...c,weekendOperations:{...c.weekendOperations,outputs:c.weekendOperations.outputs.map(o=>({...o,classification:o.classification.map(r=>({...r,position:r.position+5}))}))}};
  c=processAgreementBonuses(c);const corrected=bonusInvoices(c).find(i=>i.id===original.id)!;assert.equal(corrected.creditCents,100_000);assert.equal(bonusInvoices(c).length,1);assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.cashCents,0),0);assert.equal(processAgreementBonuses(c),c);
});

test('received bonus correction creates a recovery payable and can remain unpaid without cash',()=>{
  const sponsorOnly=fixture({autoSettle:true});sponsorOnly.contractDesk=undefined;
  let c=processFinance(processAgreementBonuses(sponsorOnly));const original=bonusInvoices(c)[0];assert.ok(c.finance!.book!.entries.some(e=>e.id===`invoice:${original.id}:payment`&&e.cashCents===100_000));
  // Anchor the explicitly funded test scenario to zero cash after the original receipt.
  c={...c,finance:{...c.finance!,book:{...c.finance!.book!,cashKnown:true,openingCashCents:-c.finance!.book!.entries.reduce((sum,e)=>sum+e.cashCents,0)}}};
  c={...c,weekendOperations:{...c.weekendOperations,outputs:c.weekendOperations.outputs.map(o=>({...o,classification:o.classification.map(r=>({...r,position:r.position+5}))}))}};
  c=processFinance(processAgreementBonuses(c));const recovery=bonusInvoices(c).find(i=>i.direction==='expense')!;assert.ok(recovery);assert.equal(recovery.amountCents,100_000);assert.equal(recovery.account,'revenue');assert.equal(recovery.classification,'excluded');assert.equal(financeInvoiceViews(c).find(i=>i.id===recovery.id)!.outstandingCents,100_000);assert.ok(!c.finance!.book!.entries.some(e=>e.id===`invoice:${recovery.id}:payment`));
});

test('constructors bonus requires final scored championship and respects its explicit cap',()=>{
  let c=fixture({trigger:'constructors_title',amountCents:200_000,annualCapCents:150_000});assert.equal(bonusInvoices(processAgreementBonuses(c)).length,0);
  c={...c,season:{...c.season,phase:'offseason',calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>({...r,status:'archived' as const}))}},championship:{...c.championship,teams:c.championship.teams.map(t=>t.teamId==='mclaren'?{...t,points:100,wins:1}:t)}};
  const earned=processAgreementBonuses(c);assert.equal(awards(earned)[0].amountCents,150_000);assert.equal(bonusInvoices(earned)[0].amountCents,150_000);assert.equal(processAgreementBonuses(earned),earned);
  const unplayed={...c,championship:{...c.championship,teams:c.championship.teams.map(t=>({...t,points:0,wins:0}))}};assert.equal(bonusInvoices(processAgreementBonuses(unplayed)).length,0);
});

test('earned terms survive agreement amendment; cancellation prevents future new awards',()=>{
  let c=processAgreementBonuses(fixture());const a=c.finance!.book!.operations!.agreements[0];
  c={...c,finance:{...c.finance!,book:{...c.finance!.book!,operations:{...c.finance!.book!.operations!,agreements:[{...a,revision:2,bonus:{...a.bonus!,amountCents:999_999},amendments:[{date:c.clock.date,reason:'Future revised terms',previous:a}]}]}}}};
  assert.equal(awards(processAgreementBonuses(c))[0].amountCents,100_000);
  const cancelled=fixture();cancelled.finance!.book!.operations!.agreements[0].status='cancelled';assert.equal(bonusInvoices(processAgreementBonuses(cancelled)).length,0);
  const bad=structuredClone(awards(c));bad[0].amountCents=NaN;assert.equal(validAgreementBonusAwards(bad),false);assert.equal(validAgreementBonusAwards([null]),false);
});
