import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import {loadCareer,CAREER_STORAGE_KEY,CAREER_BACKUP_KEY} from '../lib/career/storage';
import {parseCareerState,isCareerState} from '../lib/career/validation';
import {advanceCareerSchedule} from '../lib/career/scheduler';
import {startNextSeason} from '../lib/career/seasonLifecycle';
import {financeSummary,financeObligations,financeWarnings,processFinance,initializeFinance,commitFinanceObligation,registerFinanceAsset,assessFinancialCommitment} from '../lib/career/financeEngine';
import {createFinanceRules,financeCap} from '../lib/career/financeRules';
import {salaryBetween} from '../lib/career/negotiation';
import type {CareerState} from '../lib/career/types';
import type {FinanceObligation} from '../lib/career/financeTypes';
const storage=()=>{const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};};
const at=(c:CareerState,date:string)=>({...c,clock:{...c.clock,date}});
const invoice=(patch:Partial<FinanceObligation>={}):FinanceObligation=>({id:'design-1',sourceId:'project:1',description:'Front wing design',counterparty:'Design department',category:'development',recognitionDate:'2027-01-10',dueDate:'2027-02-05',amountCents:-100_000_000,relevantCents:100_000_000,basis:'career_action',...patch});

test('season rules use USD 215m with race adjustment and no fabricated indexation',()=>{
 const rules=createFinanceRules(2027,25,7);assert.equal(financeCap(rules),21_680_000_000);assert.equal(rules.sprintAdjustmentCents,30_000_000);assert.equal(rules.indexationPercent,0);assert.equal(rules.carryForwardCents,0);
});
test('opening cash is snapshotted once and income is not opening cash',()=>{
 const c=createCareer('mclaren'),s=financeSummary(c);assert.equal(s.cash,0);assert.equal(s.cashKnown,false);assert.equal(s.debtKnown,false);assert.equal(s.income,0);assert.equal(s.book.entries.length,0);assert.equal(initializeFinance(c),c);
 assert.ok(s.upcoming.some(o=>o.category==='driver_pay'));assert.ok(!s.upcoming.some(o=>o.category==='development'||o.category==='production'));
 assert.ok(isCareerState(c));assert.deepEqual(parseCareerState(JSON.stringify(c)),c);
});
test('schema 8 upgrade starts on saved date and preserves previous cash and spend',()=>{
 const c=createCareer('ferrari');const legacy={...c,schemaVersion:8,clock:{...c.clock,date:'2027-06-15'},finance:{cashBalance:1234,costCapLimit:135e6,costCapSpent:5e6,costCapExemptSpent:8e6,transactions:[],monthlyProjections:{income:0,expenses:0,net:0}}};
 const migrated=parseCareerState(JSON.stringify(legacy))!;assert.equal(migrated.schemaVersion,10);assert.equal(migrated.finance!.book!.activatedOn,'2027-06-15');assert.equal(migrated.finance!.cashBalance,1234);assert.equal(migrated.finance!.book!.openingRelevantCents,500e6);assert.ok(financeObligations(migrated).every(o=>o.dueDate>='2027-06-15'));
});
test('recognition precedes cash settlement and repeated processing never duplicates either',()=>{
 let c=commitFinanceObligation(createCareer('mclaren'),invoice());const opening=financeSummary(c).cash;
 c=processFinance(at(c,'2027-01-10'));assert.equal(financeSummary(c).cash,opening);assert.equal(financeSummary(c).grossRelevant,100_000_000);
 c=processFinance(at(c,'2027-02-05'));const settled=financeSummary(c);assert.equal(c.finance!.book!.entries.filter(e=>e.id==='design-1:payment').length,1);assert.equal(c.finance!.book!.entries.find(e=>e.id==='design-1:payment')!.cashCents,-100_000_000);
 assert.deepEqual(processFinance(c).finance,c.finance);assert.equal(financeSummary(processFinance(c)).cash,settled.cash);
});
test('forecast closes to actual cash after processing the same schedule',()=>{
 const c=createCareer('mclaren'),forecast=financeSummary(c);const close=processFinance(at(c,'2027-12-31'));
 assert.equal(financeSummary(close).cash,forecast.projectedCash);assert.equal(financeSummary(close).relevant,forecast.forecastRelevant);assert.equal(financeSummary(close).committedCash,0);
});
test('day steps and a multi-day target produce the same journal without spending beyond a race stop',()=>{
 const c=createCareer('mclaren');let daily=c;
 while(daily.clock.date<'2027-02-10')daily=advanceCareerSchedule(daily,{type:'day'},storage()).career;
 const skip=advanceCareerSchedule(c,{type:'target',target:{date:'2027-02-10',minuteOfDay:540}},storage()).career;
 assert.equal(financeSummary(daily).cash,financeSummary(skip).cash);assert.deepEqual(daily.finance!.book!.entries,skip.finance!.book!.entries);
 const blocked=advanceCareerSchedule(c,{type:'target',target:{date:'2027-05-01',minuteOfDay:540}},storage()).career;
 assert.equal(blocked.clock.status,'blocked');assert.ok(blocked.finance!.book!.entries.every(e=>e.date<=blocked.clock.date));
});
test('mid-month replacement cuts outgoing salary and includes incoming salary and one-off costs',()=>{
 const c=createCareer('mclaren'),desk=c.contractDesk!,old=financeObligations(c).find(o=>o.description.includes('Lando Norris')&&o.category==='driver_pay')!;
 const person=desk.baseline.people.find(p=>p.name.includes('Bearman'))!;
 const d={id:'test-signing',teamId:c.player.teamId,personId:person.id,role:'race_driver' as const,seat:1 as const,startSeason:2027,seasons:1,salaryCents:300_000_000,createdOn:'2027-01-15',status:'draft' as const,
  negotiation:{startDate:'2027-01-15',endDate:'2027-12-31',clauses:[{kind:'signing' as const,value:100_000},{kind:'loyalty' as const,value:50_000}]},appointment:{status:'active' as const,signedOn:'2027-01-15',terminationCents:200_000_000,releaseCents:0}};
 const changed={...c,contractDesk:{...desk,drafts:[d]}};const bills=financeObligations(changed);
 assert.ok(bills.find(o=>o.id===old.id)!.amountCents>old.amountCents);
 assert.equal(bills.find(o=>o.id==='salary:test-signing:2027-01-31')!.amountCents,-salaryBetween(d.salaryCents,'2027-01-15','2027-01-31',2027));
 assert.equal(bills.find(o=>o.id==='exit:test-signing')!.amountCents,-200_000_000);
 assert.equal(bills.find(o=>o.id==='signing:test-signing')!.amountCents,-10_000_000);
 assert.ok(bills.filter(o=>o.category==='driver_pay'||o.category==='contract_exit').every(o=>o.relevantCents===0));
});
test('capital payment and depreciation are independent; depreciation posts once',()=>{
 let c=registerFinanceAsset(createCareer('mclaren'),{id:'rig',name:'Test rig',acquiredOn:'2027-01-10',costCents:120_000_000,lifeMonths:12,relevant:true});
 c=processFinance(at(c,'2027-01-10'));assert.equal(c.finance!.book!.entries.find(e=>e.id==='asset-purchase:rig:payment')!.cashCents,-120_000_000);
 c=processFinance(at(c,'2027-01-31'));assert.equal(c.finance!.book!.entries.find(e=>e.id==='depreciation:rig:2027-01-31:recognition')!.relevantCents,10_000_000);
 assert.equal(c.finance!.book!.entries.find(e=>e.id==='depreciation:rig:2027-01-31:payment')!.cashCents,0);
 assert.deepEqual(processFinance(c).finance,c.finance);
});
test('affordability rejects uncovered expenses, cap overspend and supports recorded future budgets',()=>{
 const c=createCareer('mclaren');c.finance!.book!.cashKnown=true;c.finance!.book!.openingCashCents=10_000_000_000;assert.ok(assessFinancialCommitment(c,100_000_000_000,0,c.clock.date).length);assert.ok(assessFinancialCommitment(c,1,100_000_000_000,c.clock.date).length);assert.deepEqual(assessFinancialCommitment(c,1,0,'2028-01-01'),[]);assert.deepEqual(assessFinancialCommitment(c,10000,10000,c.clock.date),[]);
 assert.throws(()=>commitFinanceObligation(c,invoice({amountCents:-100_000_000_000})),/cash/);
});
test('season rollover preserves cash history and closes remaining old-year payroll',()=>{
 const c=createCareer('mclaren'),forecast=financeSummary(c);const next=startNextSeason({...at(c,'2027-12-01'),season:{...c.season,phase:'offseason'}},storage());
 assert.equal(next.finance!.book!.processedThrough,'2028-01-04');assert.equal(financeSummary(next).cash,forecast.projectedCash);assert.equal(financeSummary(next).grossRelevant,0);assert.ok(next.finance!.book!.rules.some(r=>r.year===2028));assert.ok(next.finance!.book!.entries.some(e=>e.date==='2027-12-31'));
});
test('invalid journals are rejected during save import',()=>{
 const c=createCareer('mclaren');c.finance!.book!.entries.push({id:'bad',sourceId:'x',date:'2027-01-04',description:'bad',category:'other',cashCents:NaN,relevantCents:0,excludedCents:0,kind:'payment',basis:'career_action'});assert.equal(parseCareerState(JSON.stringify(c)),null);
});

test('a replacement signed after payday posts an auditable salary adjustment only once',()=>{
 const c=processFinance(at(createCareer('mclaren'),'2027-01-31')),desk=c.contractDesk!;
 const old=financeObligations(c).find(o=>o.description.includes('Lando Norris')&&o.category==='driver_pay')!;
 const d={id:'payday-replacement',teamId:c.player.teamId,personId:desk.baseline.people.find(p=>p.name.includes('Bearman'))!.id,role:'race_driver' as const,seat:1 as const,startSeason:2027,seasons:1,salaryCents:300_000_000,createdOn:c.clock.date,status:'draft' as const,negotiation:{startDate:c.clock.date,endDate:'2027-12-31',clauses:[]},appointment:{status:'active' as const,signedOn:c.clock.date,terminationCents:0,releaseCents:0}};
 const changed={...c,contractDesk:{...desk,drafts:[d]}};
 const newBills=financeObligations(changed),newOld=newBills.find(o=>o.id===old.id)!,incoming=newBills.find(o=>o.id==='salary:payday-replacement:2027-01-31')!;
 const next=processFinance(changed);
 assert.equal(financeSummary(next).cash,financeSummary(c).cash+newOld.amountCents-old.amountCents+incoming.amountCents);
 assert.ok(next.finance!.book!.entries.some(e=>e.kind==='adjustment'&&e.description.includes('replacement')));
 assert.deepEqual(processFinance(next).finance,next.finance);
});

test('new spending must preserve coverage for later existing bills, not only the payment day',()=>{
 const c=createCareer('mclaren'),book=c.finance!.book!;
 const tight={...c,finance:{...c.finance!,book:{...book,annual:Object.fromEntries(Object.keys(book.annual).map(k=>[k,0])),cashKnown:true,openingCashCents:100_000_000,obligations:[invoice({amountCents:-75_000_000,relevantCents:0})]}}};
 assert.ok(assessFinancialCommitment(tight,50_000_000,0,c.clock.date).some(s=>s.includes('unfunded')));
});

test('season rollover never invents new budget funding',()=>{
 const c=createCareer('mclaren');
 assert.ok(!financeObligations(c,2028).some(o=>o.dueDate.startsWith('2028')&&o.amountCents>0));
 const next=startNextSeason({...at(c,'2027-12-01'),season:{...c.season,phase:'offseason'}},storage());
 assert.deepEqual(next.finance!.book!.fundedSeasons,[]);
 assert.ok(!financeObligations(next).some(o=>o.category==='owner_funding'));
});

test('schema 9 cleanup removes posted filler and estimated balances but preserves contracts and actions',()=>{
 const current=processFinance(at(createCareer('mclaren'),'2027-01-31'));
 const contractEntries=current.finance!.book!.entries;
 const actual=invoice({id:'recorded-project',recognitionDate:'2027-02-10',dueDate:'2027-02-15'});
 const fake=invoice({id:'baseline:staff:jan',sourceId:'baseline:test:staff',category:'staff_pay',recognitionDate:'2027-01-31',dueDate:'2027-01-31',basis:'game_assumption'});
 const old={...current,schemaVersion:9,finance:{...current.finance!,book:{...current.finance!.book!,version:1,openingCashCents:5_200_000_000,openingDebtCents:2_000_000_000,annual:{staff_cost_usd_millions:9_000_000_000},fundedSeasons:[2027],obligations:[fake,actual],entries:[...contractEntries,{id:fake.id+':payment',sourceId:fake.sourceId,date:fake.dueDate,description:'Invented staff payment',category:fake.category,cashCents:fake.amountCents,relevantCents:0,excludedCents:0,kind:'payment',basis:fake.basis}]}}};
 const store=storage(),raw=JSON.stringify(old);store.setItem(CAREER_STORAGE_KEY,raw);
 const migrated=loadCareer(store)!;assert.ok(migrated);assert.equal(migrated.schemaVersion,10);assert.equal(store.getItem(CAREER_BACKUP_KEY),raw);
 assert.deepEqual(migrated.finance!.book!.entries,contractEntries);assert.deepEqual(migrated.finance!.book!.obligations,[actual]);
 assert.equal(financeSummary(migrated).cashKnown,false);assert.equal(financeSummary(migrated).debtKnown,false);assert.equal(migrated.finance!.book!.openingCashCents,0);
 assert.deepEqual(loadCareer(store)!.finance,migrated.finance);
 const advanced=processFinance(at(migrated,'2027-02-28'));
 assert.ok(advanced.finance!.book!.entries.every(e=>!e.sourceId.startsWith('baseline:')));
 assert.ok(financeObligations(advanced).every(o=>o.sourceId.startsWith('contract:')||o.id===actual.id));
});

test('unknown cash does not fabricate insolvency or block contracts while recorded payments continue',()=>{
 const c=processFinance(at(createCareer('mclaren'),'2027-02-28'));
 assert.ok(c.finance!.book!.entries.some(e=>e.category==='driver_pay'));
 assert.equal(financeSummary(c).cashKnown,false);
 assert.ok(!financeWarnings(c).some(s=>/cash/i.test(s)));
 assert.deepEqual(assessFinancialCommitment(c,100_000_000_000,0,c.clock.date),[]);
 const empty={...createCareer('mclaren'),contractDesk:undefined};
 assert.equal(financeObligations(empty).length,0);
 assert.equal(processFinance(at(empty,'2027-12-31')).finance!.book!.entries.length,0);
});
