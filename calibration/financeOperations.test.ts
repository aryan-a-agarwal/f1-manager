import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState} from '../lib/career/types';
import type {FinanceAgreementInput,FinanceInvoiceInput} from '../lib/career/financeOperationsTypes';
import {financeSummary,processFinance,financeObligations} from '../lib/career/financeEngine';
import {parseCareerState} from '../lib/career/validation';
import {
  recordOpeningPosition,saveFinanceCounterparty,createFinanceAgreement,amendFinanceAgreement,cancelFinanceAgreement,
  recordFinanceInvoice,settleFinanceInvoice,disputeFinanceInvoice,creditFinanceInvoice,refundFinanceInvoice,cancelFinanceInvoice,
  financeOperationsSummary,financeForecast,getFinanceOperations,saveFinanceScenario,setFinanceCoverage,closeFinancePeriod,
  classifyFinanceInvoice,
  loanOutstandingCents,repayFinanceLoanEarly,
} from '../lib/career/financeOperations';

const at=(career:CareerState,date:string)=>({...career,clock:{...career.clock,date}});
function base(){
  const c={...createCareer('mclaren'),contractDesk:undefined};
  return saveFinanceCounterparty(c,{id:'supplier',name:'Recorded supplier',kind:'supplier'});
}
function funded(){return recordOpeningPosition(base(),{asOf:'2027-01-04',cashCents:100_000_000,restrictedCents:0,debtCents:0,basis:'scenario',note:'Explicit test scenario'});}
const invoice=(patch:Partial<FinanceInvoiceInput>={}):FinanceInvoiceInput=>({id:'invoice',description:'Recorded development services',partyId:'supplier',direction:'expense',amountCents:1_000_000,recognitionDate:'2027-01-04',dueDate:'2027-02-04',category:'development',classification:'relevant',relevantPercent:100,account:'expenses',autoSettle:false,note:'Approved services',basis:'recorded',...patch});
const agreement=(patch:Partial<FinanceAgreementInput>={}):FinanceAgreementInput=>({id:'agreement',title:'Recorded monthly services',partyId:'supplier',kind:'supplier',direction:'expense',amountCents:100_000,startDate:'2027-01-05',endDate:'2027-03-05',frequency:'monthly',category:'facilities',classification:'relevant',relevantPercent:100,account:'expenses',autoSettle:true,guaranteed:true,note:'Agreed services',basis:'recorded',...patch});

test('dated opening balances anchor cash without replaying old payments or creating income',()=>{
 let c=recordFinanceInvoice(funded(),invoice({autoSettle:true,dueDate:'2027-01-04'}));
 assert.equal(financeSummary(c).cash,99_000_000);
 const income=financeSummary(c).income;
 c=recordOpeningPosition(c,{asOf:c.clock.date,cashCents:50_000_000,restrictedCents:2_000_000,debtCents:0,basis:'recorded',note:'Recorded bank balance after payment'});
 assert.equal(financeSummary(c).cash,50_000_000);assert.equal(financeSummary(c).income,income);
 assert.equal(financeOperationsSummary(c).accounts.cash,50_000_000);assert.equal(financeOperationsSummary(c).restrictedCents,2_000_000);
 assert.equal(financeSummary(processFinance(c)).cash,50_000_000);
 assert.throws(()=>recordOpeningPosition(c,{asOf:'2027-01-03',cashCents:1,restrictedCents:null,debtCents:null,basis:'recorded',note:'Older balance'}),/today|date/i);
});

test('explicit funding and loan principal affect cash/equity or debt rather than revenue',()=>{
 let c=saveFinanceCounterparty(funded(),{id:'owner',name:'Recorded owner',kind:'owner'});
 c=createFinanceAgreement(c,agreement({id:'equity',title:'Capital injection',partyId:'owner',kind:'owner_equity',direction:'income',amountCents:500_000,startDate:c.clock.date,endDate:c.clock.date,frequency:'once',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity'}));
 const beforeLoan=financeOperationsSummary(c);
 assert.equal(beforeLoan.accounts.cash,100_500_000);assert.equal(beforeLoan.accounts.revenue,0);assert.equal(beforeLoan.accounts.equity,-500_000);
 c=createFinanceAgreement(c,agreement({id:'loan',title:'Recorded loan',kind:'loan',direction:'income',amountCents:600_000,startDate:c.clock.date,endDate:'2027-04-04',frequency:'once',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'loans',loan:{annualInterestPercent:10,repaymentStart:'2027-02-04',repaymentMonths:3}}));
 assert.equal(financeOperationsSummary(c).accounts.loans,-600_000);assert.equal(financeOperationsSummary(c).accounts.revenue,0);
 c=processFinance(at(c,'2027-04-04'));const summary=financeOperationsSummary(c);
 assert.equal(summary.accounts.loans,0);assert.equal(summary.accounts.revenue,0);assert.ok(summary.accounts.expenses>0);assert.ok(summary.journalBalanced);
 assert.equal(summary.accounts.cash,100_500_000-summary.accounts.expenses);
});

test('partial settlements, credits and disputes preserve liabilities and a balanced journal',()=>{
 let c=recordFinanceInvoice(funded(),invoice());
 c=settleFinanceInvoice(c,'invoice',300_000,'part-1');const original=c.finance!.book!.entries;
 assert.equal(financeOperationsSummary(c).invoices[0].state,'part_paid');assert.equal(financeOperationsSummary(c).payableCents,700_000);
 assert.deepEqual(settleFinanceInvoice(c,'invoice',300_000,'part-1').finance,c.finance);
 c=creditFinanceInvoice(c,'invoice',100_000,'Agreed service reduction');assert.equal(financeOperationsSummary(c).payableCents,600_000);
 assert.throws(()=>refundFinanceInvoice(c,'invoice',100_000,'No overpayment'),/overpaid|credit/i);
 c=disputeFinanceInvoice(c,'invoice','Delivery disputed');assert.equal(financeOperationsSummary(c).invoices[0].state,'disputed');
 assert.throws(()=>settleFinanceInvoice(c,'invoice',1),/open/i);
 c=processFinance(at(c,'2027-02-05'));assert.equal(financeOperationsSummary(c).payableCents,600_000);
 c=disputeFinanceInvoice(c,'invoice','Delivery issue resolved');assert.equal(financeOperationsSummary(c).invoices[0].state,'overdue');
 c=settleFinanceInvoice(c,'invoice',600_000,'part-2');assert.equal(financeOperationsSummary(c).invoices[0].state,'paid');assert.ok(financeOperationsSummary(c).journalBalanced);
 assert.deepEqual(c.finance!.book!.entries.slice(0,original.length),original);
});

test('a paid invoice credit and refund restore cash without rewriting expense history',()=>{
 let c=recordFinanceInvoice(funded(),invoice());c=settleFinanceInvoice(c,'invoice',1_000_000,'payment');
 c=creditFinanceInvoice(c,'invoice',200_000,'Agreed refund');c=refundFinanceInvoice(c,'invoice',200_000,'Refund received');
 const summary=financeOperationsSummary(c);assert.equal(summary.accounts.cash,99_200_000);assert.equal(summary.accounts.expenses,800_000);assert.equal(summary.payableCents,0);assert.equal(summary.invoices[0].state,'paid');assert.ok(summary.journalBalanced);
 assert.equal(c.finance!.book!.entries.filter(entry=>entry.id==='settlement:payment').length,1);
 assert.deepEqual(processFinance(c).finance,c.finance);
});

test('cancelling an unpaid invoice reverses recognition and prevents later settlement',()=>{
 let c=recordFinanceInvoice(funded(),invoice());c=cancelFinanceInvoice(c,'invoice','Order cancelled');
 c=processFinance(at(c,'2027-03-01'));const summary=financeOperationsSummary(c);
 assert.equal(summary.invoices[0].state,'cancelled');assert.equal(summary.payableCents,0);assert.equal(summary.accounts.expenses,0);assert.equal(summary.accounts.cash,100_000_000);assert.ok(summary.journalBalanced);
});

test('agreement amendments update future amounts without billing elapsed periods a second time',()=>{
 let c=createFinanceAgreement(funded(),agreement());c=processFinance(at(c,'2027-01-06'));
 assert.equal(financeSummary(c).cash,99_900_000);
 c=amendFinanceAgreement(c,'agreement',{amountCents:200_000},'Agreed increase for remaining services');
 assert.equal(financeSummary(c).cash,99_900_000);
 c=processFinance(at(c,'2027-03-06'));assert.equal(financeSummary(c).cash,99_500_000);
 assert.equal(getFinanceOperations(c).agreements[0].amendments.length,1);
});

test('cancelling an agreement retains paid periods and removes avoidable future charges',()=>{
 let c=createFinanceAgreement(funded(),agreement());c=processFinance(at(c,'2027-01-06'));
 c=cancelFinanceAgreement(c,'agreement','Remaining services no longer needed');c=processFinance(at(c,'2027-05-01'));
 assert.equal(financeSummary(c).cash,99_900_000);assert.equal(getFinanceOperations(c).agreements[0].status,'cancelled');assert.ok(financeOperationsSummary(c).journalBalanced);
});

test('multiyear forecast retains cap recognition for an invoice paid before its service period',()=>{
 let c=recordFinanceInvoice(funded(),invoice({recognitionDate:'2028-02-01',dueDate:'2027-01-04'}));c=settleFinanceInvoice(c,'invoice',1_000_000,'prepayment');
 const projection=financeForecast(c,{throughYear:2028});
 assert.equal(projection.years.find(year=>year.year===2028)!.relevant,1_000_000);
 assert.equal(projection.years.find(year=>year.year===2028)!.expenses,0);
});

test('unpaid overdue bills stay in the forecast after their due month has passed',()=>{
 let c=recordFinanceInvoice(funded(),invoice({dueDate:'2027-01-10'}));c=processFinance(at(c,'2027-03-01'));
 const forecast=financeForecast(c,{throughYear:2027});assert.equal(forecast.months[0].expenses,1_000_000);assert.equal(forecast.minCash,99_000_000);assert.equal(financeOperationsSummary(c).overdueCents,1_000_000);
});

test('planning scenarios never alter the real book and coverage remains explicit',()=>{
 let c=setFinanceCoverage(funded(),{funding:true,operating:true});
 c=saveFinanceScenario(c,{id:'scenario',name:'Alternative development',items:[{id:'item',description:'Optional upgrade',dueDate:'2028-01-15',amountCents:-2_000_000,relevantCents:2_000_000}]});
 const before=JSON.stringify(c.finance),forecast=financeForecast(c,{throughYear:2028,scenarioId:'scenario'});
 assert.equal(forecast.complete,true);assert.equal(forecast.months.find(month=>month.date==='2028-01-31')!.scenarioCash,98_000_000);assert.equal(forecast.years.find(year=>year.year===2028)!.headroom,21_498_000_000);assert.equal(JSON.stringify(c.finance),before);
 const parsed=parseCareerState(JSON.stringify(c));assert.ok(parsed);assert.deepEqual(parsed.finance,c.finance);assert.equal(financeObligations(c).length,0);
});

test('year close preserves unpaid balances and locks closed-period edits',()=>{
 let c=recordFinanceInvoice(funded(),invoice());c=processFinance(at(c,'2027-12-31'));c=closeFinancePeriod(c,2027,'Reviewed annual accounts');
 assert.equal(getFinanceOperations(c).periods[0].year,2027);assert.equal(financeOperationsSummary(c).payableCents,1_000_000);
 assert.throws(()=>recordFinanceInvoice(c,invoice({id:'late'})),/closed/i);
 c=processFinance(at(c,'2028-01-04'));assert.equal(financeOperationsSummary(c).payableCents,1_000_000);assert.ok(parseCareerState(JSON.stringify(c)));
});

test('classification review resolves exposure without repaying an invoice or rewriting original entries',()=>{
 let c=recordFinanceInvoice(funded(),invoice({classification:'unresolved',relevantPercent:0,dueDate:'2027-01-04',autoSettle:true}));
 const original=c.finance!.book!.entries,cash=financeSummary(c).cash;
 assert.equal(financeOperationsSummary(c).unresolvedCents,1_000_000);
 c=classifyFinanceInvoice(c,'invoice','mixed',60,'Reviewed allocation supported by the invoice');
 assert.equal(financeOperationsSummary(c).unresolvedCents,0);assert.equal(financeSummary(c).cash,cash);assert.equal(financeSummary(c).grossRelevant,600_000);assert.equal(financeSummary(c).excluded,400_000);
 assert.deepEqual(c.finance!.book!.entries.slice(0,original.length),original);assert.ok(financeOperationsSummary(c).journalBalanced);
 c=classifyFinanceInvoice(c,'invoice','relevant',100,'Subsequent review confirms wholly relevant service');
 assert.equal(financeSummary(c).grossRelevant,1_000_000);assert.equal(financeSummary(c).excluded,0);assert.equal(financeSummary(c).cash,cash);
 assert.ok(parseCareerState(JSON.stringify(c)));
});

test('drawn loans retain their debt until repaid, and early repayment removes future principal and interest once',()=>{
 let c=createFinanceAgreement(funded(),agreement({id:'loan',title:'Recorded refinancing loan',kind:'loan',direction:'income',amountCents:600_000,startDate:'2027-01-04',endDate:'2027-04-04',frequency:'once',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'loans',loan:{annualInterestPercent:10,repaymentStart:'2027-02-04',repaymentMonths:3}}));
 assert.equal(loanOutstandingCents(c,'loan'),600_000);assert.equal(financeSummary(c).cash,100_600_000);
 assert.throws(()=>amendFinanceAgreement(c,'loan',{amountCents:900_000},'Attempt to replace loan terms'),/drawn loan|refinanc/i);
 assert.throws(()=>cancelFinanceAgreement(c,'loan','Attempt to cancel debt'),/drawn loan|outstanding|repayment/i);
 c=repayFinanceLoanEarly(c,'loan',10_000,'Lender agreed full principal settlement and stated fee');
 assert.equal(loanOutstandingCents(c,'loan'),0);assert.equal(financeOperationsSummary(c).accounts.loans,0);assert.equal(financeSummary(c).cash,99_990_000);assert.ok(financeOperationsSummary(c).journalBalanced);
 assert.throws(()=>repayFinanceLoanEarly(c,'loan',10_000,'Repeat settlement'),/outstanding loan/i);
 c=processFinance(at(c,'2027-05-04'));
 assert.equal(loanOutstandingCents(c,'loan'),0);assert.equal(financeSummary(c).cash,99_990_000);assert.equal(financeOperationsSummary(c).accounts.loans,0);
 assert.equal(c.finance!.book!.entries.filter(entry=>entry.description.includes('· principal repayment')&&entry.kind==='payment'&&entry.cashCents<0).length,0);
 assert.ok(parseCareerState(JSON.stringify(c)));
});
