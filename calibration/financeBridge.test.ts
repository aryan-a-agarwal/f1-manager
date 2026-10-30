import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState} from '../lib/career/types';
import {processFinance,financeSummary,currentFinanceRules,recordOpeningFinanceAsset,assessFinancialCommitment} from '../lib/career/financeEngine';
import {saveFinanceCounterparty,recordFinanceInvoice,settleFinanceInvoice,creditFinanceInvoice,refundFinanceInvoice,financeOperationsSummary,financeForecast,closeFinancePeriod,recordFinanceRules,recordOpeningPosition,classifyFinanceInvoice} from '../lib/career/financeOperations';
import {confirmPersonnelCoverage,recordCapDetermination} from '../lib/career/financeCompliance';
import {recordStaffEmployment} from '../lib/career/personnelFinance';
import {financeProfileTemplate,applyFinanceProfile} from '../lib/career/financeProfiles';
import {activateWorkshop,DEFAULT_WORKSHOP,startProduction,inspectWorkshopUnit,fitWorkshopUnit,markWorkshopUse,cancelWorkshopProject} from '../lib/career/manufacturing';
import {parseCareerState} from '../lib/career/validation';
import {teams} from '../lib/data/grid';
const at=(c:CareerState,date:string)=>({...c,clock:{...c.clock,date}});
const advance=(c:CareerState,date:string)=>processFinance(at(c,date));
function bill(direction:'income'|'expense'='expense'){
 let c=saveFinanceCounterparty(createCareer('mclaren'),{id:'party',name:'Test party',kind:'supplier'});
 return recordFinanceInvoice(c,{id:'advance',partyId:'party',description:'Advance',direction,amountCents:120_000,recognitionDate:'2027-03-01',dueDate:'2027-01-04',category:direction==='income'?'commercial_income':'development',classification:direction==='income'?'excluded':'relevant',relevantPercent:direction==='income'?0:100,account:direction==='income'?'revenue':'expenses',autoSettle:false,note:'Explicit test',basis:'recorded'});
}
test('supplier deposits and customer advances release on recognition, including a credited advance refund',()=>{
 for(const direction of ['income','expense'] as const){let c=settleFinanceInvoice(bill(direction),'advance',120_000);const account=direction==='income'?'deferred_income':'prepayments';assert.equal(Math.abs(financeOperationsSummary(c).accounts[account]),120_000);
 c=creditFinanceInvoice(c,'advance',20_000,'Agreed reduction');c=refundFinanceInvoice(c,'advance',20_000,'Refund advance');assert.equal(Math.abs(financeOperationsSummary(c).accounts[account]),100_000);
 const f=financeForecast(c,{throughYear:2027});assert.equal(f.months.find(m=>m.date==='2027-03-31')!.relevant,direction==='expense'?100_000:0);assert.equal(f.months[0].relevant,0);
 c=advance(c,'2027-03-01');const s=financeOperationsSummary(c);assert.equal(s.accounts[account],0);assert.equal(s.accounts.payables,0);assert.equal(s.accounts.receivables,0);assert.ok(s.journalBalanced);assert.deepEqual(processFinance(c),c);assert.ok(parseCareerState(JSON.stringify(c)));}
});
test('book residual and zero regulatory residual produce a separate auditable cap bridge',()=>{
 let c=recordOpeningFinanceAsset({...createCareer('mclaren'),contractDesk:undefined},{id:'rig',name:'Rig',acquiredOn:'2027-01-04',costCents:1_200_000,lifeMonths:12,residualCents:240_000,relevant:true},0);
 c=advance(c,'2027-01-31');assert.equal(financeOperationsSummary(c).accounts.expenses,80_000);assert.equal(financeSummary(c).grossRelevant,100_000);assert.ok(c.finance!.book!.entries.some(e=>e.sourceId==='cap:depreciation:rig'&&e.relevantCents===20_000));assert.equal(financeForecast(c,{throughYear:2027}).years[0].relevant,1_200_000);
});
test('personnel exclusions aggregate pay and bonuses by person only after coverage is confirmed',()=>{
 let c=createCareer('mclaren');for(let i=1;i<=4;i++)c=recordStaffEmployment(c,{id:`staff-${i}`,personId:`person-${i}`,name:`Employee ${i}`,role:'Engineer',from:'2027-01-04',to:'2027-12-31',annualCents:i*1_200_000,frequency:'monthly',annualIncreasePercent:0,relevantPercent:100,classificationReason:'Eligible named engineering payroll'});
 c=advance(c,'2027-01-31');const before=financeSummary(c).grossRelevant;c=confirmPersonnelCoverage(c,true);const salary=c.finance!.book!.entries.filter(e=>e.sourceId==='staff:staff-1').reduce((s,e)=>s+e.relevantCents,0);assert.equal(financeSummary(c).grossRelevant,salary);assert.ok(before>salary);c=confirmPersonnelCoverage(c,false);assert.equal(financeSummary(c).grossRelevant,before);
});
test('year close distinguishes equity and loan cash from operating revenue and expenses',()=>{
 let c:CareerState={...createCareer('mclaren'),contractDesk:undefined};c=saveFinanceCounterparty(c,{id:'owner',name:'Owner',kind:'owner'});c=recordFinanceInvoice(c,{id:'capital',partyId:'owner',description:'Equity',direction:'income',amountCents:500_000,recognitionDate:'2027-01-04',dueDate:'2027-01-04',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity',autoSettle:true,note:'Explicit funding'});c=advance(c,'2027-12-31');c=closeFinancePeriod(c,2027,'Reviewed',true);const p=c.finance!.book!.operations!.periods[0];assert.equal(p.incomeCents,0);assert.equal(p.expenseCents,0);
 c=at(c,'2028-01-01');const rules={...currentFinanceRules(c,2028),carryForwardCents:100_000};assert.throws(()=>recordFinanceRules(c,rules,'Internal review alone'),/determination/);c=recordCapDetermination(c,2028,100_000,'FIA decision reference');c=recordFinanceRules(c,rules,'Determination and audited surplus checked');assert.equal(c.finance!.book!.rules.find(r=>r.year===2028)!.carryForwardCents,100_000);
});
test('cancelled production retains cap cost of its deposit and year-old unused inventory is assessed once',()=>{
 let c=activateWorkshop(createCareer('mclaren'),DEFAULT_WORKSHOP);c=startProduction(c,'cancel','opening-front_wing',2,'normal');const cost=c.manufacturing!.projects[0].costCents;c=cancelWorkshopProject(c,'cancel');assert.equal(financeSummary(c).grossRelevant,cost/2);assert.equal(financeOperationsSummary(c).accounts.expenses,cost/2);
 c=startProduction(c,'old-stock','opening-rear_wing',1,'normal');c=advance(c,c.manufacturing!.projects[1].plannedFinish);const unit=c.finance!.book!.manufacturing!.units.find(u=>u.orderId==='workshop-old-stock')!;assert.equal(financeSummary(c).grossRelevant,cost/2);
 c=advance(c,'2028-01-02');assert.equal(c.finance!.book!.manufacturing!.units.find(u=>u.id===unit.id)!.redundantOn,'2028-01-01');assert.equal(financeSummary(c).grossRelevant,unit.costCents);assert.deepEqual(processFinance(c),c);
});
test('all eleven team profiles preview without mutating the career and apply only with explicit review',()=>{
 for(const team of teams){let c=createCareer(team.id);const before=JSON.stringify(c),blank=financeProfileTemplate(team.id,c.clock.date);assert.equal(blank.opening.cashCents,null);const p=financeProfileTemplate(team.id,c.clock.date,true);assert.equal(JSON.stringify(c),before);assert.ok(p.agreements.length);c=applyFinanceProfile(c,p);assert.ok(parseCareerState(JSON.stringify(c)));assert.throws(()=>applyFinanceProfile(c,p),/already/);assert.ok(!c.finance!.book!.obligations.some(o=>o.sourceId.startsWith('manufacturing:')));}
});
test('dated affordability catches an early shortfall despite a later receipt',()=>{
 let c=recordOpeningPosition(createCareer('mclaren'),{asOf:'2027-01-04',cashCents:100,restrictedCents:0,debtCents:0,basis:'recorded',note:'Test bank balance'});
 c={...c,finance:{...c.finance!,book:{...c.finance!.book!,obligations:[{id:'later-funding',sourceId:'funding',description:'Later funding',counterparty:'Owner',category:'owner_funding',recognitionDate:'2027-02-01',dueDate:'2027-02-01',amountCents:1_000_000,relevantCents:0,basis:'career_action'}]}}};assert.ok(assessFinancialCommitment(c,101,0,'2027-01-05').some(x=>x.includes('unfunded')));
});

test('production crossing year end preserves the WIP bridge and does not reserve its deposit twice',()=>{
 let c=activateWorkshop(createCareer('mclaren'),DEFAULT_WORKSHOP);c=advance(c,'2027-12-20');c=startProduction(c,'cross-year','opening-floor',3,'normal');const cost=c.manufacturing!.projects[0].costCents;
 c=advance(c,'2027-12-22');assert.ok(c.finance!.book!.manufacturing!.orders[0].manufactureStartedOn);c=advance(c,'2028-01-01');assert.equal(financeSummary(c).grossRelevant,cost/2);assert.equal(financeForecast(c,{throughYear:2028}).years[0].relevant,cost);
 c=advance(c,c.manufacturing!.projects[0].plannedFinish);assert.equal(financeSummary(c).grossRelevant,cost);assert.deepEqual(processFinance(c),c);assert.ok(parseCareerState(JSON.stringify(c)));
});

test('standard development policy cannot be reclassified as excluded, and uncertain cases remain reviewable',()=>{
 let c=saveFinanceCounterparty(createCareer('mclaren'),{id:'lab',name:'Recorded laboratory',kind:'supplier'});
 c=recordFinanceInvoice(c,{id:'test-lab',partyId:'lab',description:'Chassis validation',direction:'expense',amountCents:100_000,recognitionDate:c.clock.date,dueDate:c.clock.date,category:'development',classification:'relevant',classificationTemplate:'development',relevantPercent:100,account:'expenses',autoSettle:false,note:'Invoice and Section D policy'});
 assert.throws(()=>classifyFinanceInvoice(c,'test-lab','excluded',0,'Try to evade cap'),/fixed classification/);
 c=classifyFinanceInvoice(c,'test-lab','unresolved',0,'Scope of invoice needs evidence');assert.equal(financeOperationsSummary(c).unresolvedCents,100_000);assert.ok(parseCareerState(JSON.stringify(c)));
});
