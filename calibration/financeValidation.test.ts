import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyFinanceOperations,validFinanceOperations,createFinanceAgreement,saveFinanceCounterparty,amendFinanceAgreement,getFinanceOperations} from '../lib/career/financeOperations';
import type {FinanceOperations,FinanceAgreementInput} from '../lib/career/financeOperationsTypes';
import {createCareer} from '../lib/career/createCareer';

function completeFixture():FinanceOperations{
  return {...emptyFinanceOperations(),opening:{asOf:'2027-01-04',cashCents:1_000_000,restrictedCents:100_000,debtCents:null,basis:'recorded',note:'Dated bank statement'},counterparties:[{id:'owner',name:'Recorded investor',kind:'owner'},{id:'supplier',name:'Recorded supplier',kind:'supplier'}],
    agreements:[{id:'funding',title:'Approved contribution',partyId:'owner',kind:'owner_equity',direction:'income',amountCents:200_000,startDate:'2027-01-04',endDate:'2027-12-31',frequency:'once',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity',autoSettle:true,guaranteed:true,note:'Signed funding terms',basis:'recorded',revision:1,status:'active',createdOn:'2027-01-04',amendments:[]}],
    invoices:[{id:'funding-invoice',agreementId:'funding',description:'Approved contribution instalment',partyId:'owner',direction:'income',amountCents:200_000,recognitionDate:'2027-01-04',dueDate:'2027-01-04',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity',autoSettle:true,note:'Agreed instalment',status:'open',createdOn:'2027-01-04',creditCents:0,revision:1,basis:'recorded'}],
    settlements:[{id:'funding-payment',invoiceId:'funding-invoice',date:'2027-01-04',amountCents:200_000,kind:'payment'}],budgets:[{id:'design-budget',year:2027,department:'development',limitCents:400_000,approvedOn:'2027-01-04',note:'Board-approved allocation'}],scenarios:[{id:'next-upgrade',name:'Optional front wing',items:[{id:'design',description:'Design quotation',dueDate:'2027-03-01',amountCents:-100_000,relevantCents:100_000}]}],
    periods:[{year:2026,status:'closed',closedOn:'2027-01-04',cashCents:-1_000,incomeCents:100_000,expenseCents:101_000,relevantCents:70_000,excludedCents:-10,unresolvedCents:0,capCents:21_500_000_000,note:'Reconciled prior period'}],findings:[{id:'review',year:2026,date:'2027-01-04',kind:'warning',description:'Review completed',penaltyCents:0,source:'Internal review'}],
    ownership:{owners:[{id:'owner',name:'Recorded investor',kind:'company'},{id:'other',name:'Other investor',kind:'individual'}],periods:[{teamId:'mclaren',ownerId:'owner',percentage:null,from:'2027-01-01',until:null,basis:'reference'},{teamId:'mclaren',ownerId:'other',percentage:25,from:'2027-01-01',until:null,basis:'reference'}]},transfers:[{id:'stake-sale',date:'2027-01-04',teamId:'mclaren',fromOwnerId:'owner',toOwnerId:'other',percentage:5,priceCents:null}],eventReceipts:['finance:result:1'],coverage:{funding:true,operating:false}};
}

test('finance operations validator accepts explicit records, unknown stakes and signed report balances',()=>{
  assert.equal(validFinanceOperations(undefined),true);assert.equal(validFinanceOperations(emptyFinanceOperations()),true);
  assert.equal(validFinanceOperations(completeFixture()),true);
  const historical=completeFixture();historical.agreements[0].startDate='2001-01-01';historical.agreements[0].endDate='2001-12-31';historical.agreements[0].createdOn='2001-01-01';assert.equal(validFinanceOperations(historical),true,'Imports do not depend on today’s calendar');
});

test('every nested collection rejects malformed rows, duplicate IDs and wrong references without throwing',()=>{
  const cases:[string,(o:any)=>void][]=[
    ['null opening',o=>{o.opening=null;}],['negative opening cash',o=>{o.opening.cashCents=-1;}],['restricted unknown cash',o=>{o.opening.cashCents=null;}],['restricted exceeds cash',o=>{o.opening.restrictedCents=2_000_000;}],['opening provenance',o=>{o.opening.basis='unknown';}],
    ['counterparty kind',o=>{o.counterparties[0].kind='driver';}],['counterparty duplicate',o=>{o.counterparties.push(o.counterparties[0]);}],['null counterparty',o=>{o.counterparties.push(null);}],
    ['agreement kind',o=>{o.agreements[0].kind='arbitrary';}],['agreement party',o=>{o.agreements[0].partyId='missing';}],['agreement category',o=>{o.agreements[0].category='fake';}],['agreement frequency',o=>{o.agreements[0].frequency='whenever';}],['agreement guarantee',o=>{o.agreements[0].guaranteed='yes';}],['agreement noninteger',o=>{o.agreements[0].amountCents=1.2;}],['agreement revision',o=>{o.agreements[0].revision=0;}],['agreement status',o=>{o.agreements[0].status='deleted';}],['agreement date',o=>{o.agreements[0].startDate='2027-02-30';}],['income relevant',o=>{o.agreements[0].classification='relevant';}],
    ['malformed amendment',o=>{o.agreements[0].amendments=[{date:'2027-01-04',reason:'change',previous:null}];}],['wrong amendment reference',o=>{o.agreements[0].amendments=[{date:'2027-01-04',reason:'change',previous:{...o.agreements[0],id:'other'}}];}],
    ['instalment sum',o=>{o.agreements[0].instalments=[{id:'one',dueDate:'2027-02-01',recognitionDate:'2027-02-01',amountCents:50}];}],['bonus trigger',o=>{o.agreements[0].bonus={trigger:'whenever',amountCents:1,annualCapCents:1};}],['loan shape',o=>{o.agreements[0].kind='loan';o.agreements[0].loan={annualInterestPercent:NaN,repaymentStart:'2027-02-01',repaymentMonths:12};}],
    ['invoice party',o=>{o.invoices[0].partyId='missing';}],['invoice agreement',o=>{o.invoices[0].agreementId='missing';}],['invoice category',o=>{o.invoices[0].category='fake';}],['invoice account',o=>{o.invoices[0].account='bank';}],['invoice classification',o=>{o.invoices[0].classification='ignored';}],['invoice credit',o=>{o.invoices[0].creditCents=300_000;}],['invoice date',o=>{o.invoices[0].recognitionDate='2027-02-30';}],['invoice reason',o=>{o.invoices[0].reason=55;}],['invoice duplicate',o=>{o.invoices.push(o.invoices[0]);}],
    ['settlement amount',o=>{o.settlements[0].amountCents=0;}],['settlement kind',o=>{o.settlements[0].kind='loan';}],['settlement reference',o=>{o.settlements[0].invoiceId='missing';}],['settlement duplicate',o=>{o.settlements.push(o.settlements[0]);}],
    ['budget limit',o=>{o.budgets[0].limitCents=-1;}],['budget department',o=>{o.budgets[0].department='fake';}],['budget date',o=>{o.budgets[0].approvedOn='invalid';}],['budget year',o=>{o.budgets[0].year=2027.5;}],
    ['scenario duplicate items',o=>{o.scenarios[0].items.push(o.scenarios[0].items[0]);}],['scenario null item',o=>{o.scenarios[0].items.push(null);}],['scenario unsafe cash',o=>{o.scenarios[0].items[0].amountCents=Number.MAX_SAFE_INTEGER+1;}],['scenario relevance',o=>{o.scenarios[0].items[0].relevantCents=-1;}],['scenario date',o=>{o.scenarios[0].items[0].dueDate='2027-13-01';}],
    ['period duplicate years',o=>{o.periods.push(o.periods[0]);}],['period NaN',o=>{o.periods[0].cashCents=NaN;}],['period status',o=>{o.periods[0].status='approved';}],['period unresolved',o=>{o.periods[0].unresolvedCents=-1;}],['finding penalty',o=>{o.findings[0].penaltyCents=-1;}],['finding kind',o=>{o.findings[0].kind='automatic-ban';}],
    ['owner duplicate',o=>{o.ownership.owners.push(o.ownership.owners[0]);}],['ownership missing owner',o=>{o.ownership.periods[0].ownerId='missing';}],['ownership reversed dates',o=>{o.ownership.periods[0].until='2026-12-31';}],['ownership overlapping same owner',o=>{o.ownership.periods.push({...o.ownership.periods[0],from:'2027-02-01'});}],['ownership over 100',o=>{o.ownership.periods[0].percentage=80;}],['ownership bad percentage',o=>{o.ownership.periods[0].percentage=NaN;}],['transfer unknown owner',o=>{o.transfers[0].toOwnerId='missing';}],['transfer same owners',o=>{o.transfers[0].toOwnerId='owner';}],['transfer price',o=>{o.transfers[0].priceCents=-1;}],['transfer percentage',o=>{o.transfers[0].percentage=0;}],
    ['coverage flags',o=>{o.coverage.funding='yes';}],['event receipt duplicate',o=>{o.eventReceipts.push(o.eventReceipts[0]);}],['event receipt object',o=>{o.eventReceipts.push({id:'not-text'});}],
  ];
  for(const [label,mutate] of cases){const o=structuredClone(completeFixture());mutate(o);let result=true;assert.doesNotThrow(()=>{result=validFinanceOperations(o);},label);assert.equal(result,false,label);}
  for(const malformed of [null,[],true,1,'object',{version:1},{...emptyFinanceOperations(),agreements:[null]}]){assert.doesNotThrow(()=>validFinanceOperations(malformed));assert.equal(validFinanceOperations(malformed),false);}
});

test('ownership validation accepts adjacent historical periods and null percentages',()=>{
  const o=completeFixture();o.ownership.periods=[{teamId:'mclaren',ownerId:'owner',percentage:60,from:'2027-01-01',until:'2027-06-30',basis:'reference'},{teamId:'mclaren',ownerId:'owner',percentage:40,from:'2027-07-01',until:null,basis:'career_generated'},{teamId:'mclaren',ownerId:'other',percentage:null,from:'2027-01-01',until:null,basis:'reference'}];
  assert.equal(validFinanceOperations(o),true);
});

test('materialised agreements and amendment history remain valid',()=>{
  let c=createCareer('mclaren');c=saveFinanceCounterparty(c,{id:'owner-party',name:'Recorded owner',kind:'owner'});
  const input:FinanceAgreementInput={id:'funding',title:'Recorded equity',partyId:'owner-party',kind:'owner_equity',direction:'income',amountCents:100_000,startDate:c.clock.date,endDate:'2027-12-31',frequency:'once',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity',autoSettle:false,guaranteed:true,note:'Explicit funding approval',basis:'recorded'};
  c=createFinanceAgreement(c,input);assert.equal(validFinanceOperations(getFinanceOperations(c)),true);
  c=amendFinanceAgreement(c,'funding',{amountCents:150_000,startDate:'2027-02-01'},'Agreed revised amount and due date');assert.equal(validFinanceOperations(getFinanceOperations(c)),true);
});
