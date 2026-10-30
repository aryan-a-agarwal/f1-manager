import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState,SessionOutput} from '../lib/career/types';
import {processFinance,financeSummary,recordOpeningFinanceAsset,disposeFinanceAsset,financePaymentShortfall,validFinanceState} from '../lib/career/financeEngine';
import {recordOpeningPosition,saveFinanceCounterparty,recordFinanceInvoice,financeOperationsSummary,createFinanceAgreement,financeInvoiceViews,financeForecast,getFinanceOperations,recordFinanceStake,saveFinanceOwner,recordFinanceOwnershipTransfer} from '../lib/career/financeOperations';
import {recordChampionshipPrizePolicy,awardChampionshipEntitlement,championshipFinanceState} from '../lib/career/championshipFinance';
import {saveContractDraft} from '../lib/career/contracts';
import {respondToOffer} from '../lib/career/offerNegotiation';
import {recordDriverReleaseAgreement,driverReleaseReplacementCandidates} from '../lib/career/personnelFinance';
import {signAgreedContract} from '../lib/career/contractAppointments';
import {processRivalFinances,financeTeamCareer} from '../lib/career/rivalFinance';
import {parseCareerState} from '../lib/career/validation';
const at=(c:CareerState,date:string):CareerState=>({...c,clock:{...c.clock,date}});
const blank=():CareerState=>({...createCareer('mclaren'),contractDesk:undefined});

test('opening assets and excluded depreciation preserve cash, carrying value and a balanced disposal journal',()=>{
 let c=recordOpeningPosition(blank(),{asOf:'2027-01-04',cashCents:100_000,restrictedCents:0,debtCents:0,basis:'scenario',note:'Recorded test position'});
 c=recordOpeningFinanceAsset(c,{id:'existing',name:'Recorded equipment',acquiredOn:'2026-01-01',costCents:1_200_000,lifeMonths:12,relevant:false},600_000);
 assert.equal(financeSummary(c).cash,100_000);
 c=processFinance(at(c,'2027-01-31'));
 assert.equal(financeSummary(c).relevant,0);assert.equal(financeSummary(c).excluded,50_000);
 assert.equal(financeOperationsSummary(c).accounts.accumulated_depreciation,-650_000);
 c=disposeFinanceAsset(c,'existing',550_000,'Agreed sale');
 const s=financeOperationsSummary(c);assert.equal(s.accounts.fixed_assets,0);assert.equal(s.accounts.accumulated_depreciation,0);assert.equal(s.accounts.cash,650_000);assert.ok(s.journalBalanced);
 assert.equal(processFinance(at(c,'2027-02-28')).finance!.book!.entries.filter(e=>e.category==='depreciation').length,2); // recognition and zero-cash settlement
});

test('conditional funding never becomes a guaranteed receipt or an automatic bank deposit',()=>{
 let c=saveFinanceCounterparty(blank(),{id:'owner',name:'Recorded owner',kind:'owner'});
 c=createFinanceAgreement(c,{id:'conditional',title:'Funding awaiting approval',partyId:'owner',kind:'owner_equity',direction:'income',amountCents:1_000_000,startDate:c.clock.date,endDate:'2027-12-31',frequency:'monthly',category:'owner_funding',classification:'excluded',relevantPercent:0,account:'equity',autoSettle:true,guaranteed:false,note:'Only after further approval',basis:'recorded'});
 assert.equal(financeInvoiceViews(c).length,0);assert.equal(financeForecast(c,{throughYear:2028}).years[0].income,0);
 assert.equal(financeSummary(processFinance(at(c,'2027-12-31'))).income,0);
});

test('opening payables carry prior costs without creating a new current-year expense',()=>{
 let c=saveFinanceCounterparty(blank(),{id:'supplier',name:'Recorded supplier',kind:'supplier'});
 c=recordFinanceInvoice(c,{id:'old-payable',description:'Existing unpaid supplier balance',partyId:'supplier',direction:'expense',amountCents:20_000,recognitionDate:c.clock.date,dueDate:'2026-12-20',category:'other',classification:'excluded',relevantPercent:0,account:'opening_equity',autoSettle:false,note:'Already recognised in prior accounts',basis:'recorded',openingBalance:true});
 assert.equal(financeInvoiceViews(c)[0].state,'overdue');assert.equal(financeSummary(c).relevant,0);assert.equal(financeSummary(c).excluded,0);assert.equal(financeOperationsSummary(c).accounts.payables,-20_000);assert.equal(financeOperationsSummary(c).accounts.expenses,0);
 assert.ok(parseCareerState(JSON.stringify(c)));
});

test('a known cash shortfall keeps the actual invoice outstanding without creating an overdraft',()=>{
 let c=recordOpeningPosition(blank(),{asOf:'2027-01-04',cashCents:50_000,restrictedCents:0,debtCents:0,basis:'scenario',note:'Recorded test position'});
 c=saveFinanceCounterparty(c,{id:'supplier',name:'Recorded supplier',kind:'supplier'});
 c=recordFinanceInvoice(c,{id:'invoice',description:'Delivered work',partyId:'supplier',direction:'expense',amountCents:100_000,recognitionDate:c.clock.date,dueDate:c.clock.date,category:'development',classification:'relevant',relevantPercent:100,account:'expenses',autoSettle:true,note:'Agreed invoice',basis:'recorded'});
 assert.equal(financeSummary(c).cash,50_000);assert.equal(financeInvoiceViews(c)[0].outstandingCents,100_000);assert.ok(financePaymentShortfall(c));
 c=processFinance(at(c,'2027-01-05'));assert.equal(financeInvoiceViews(c)[0].state,'overdue');assert.equal(financeOperationsSummary(c).accounts.loans,0);
});

test('only an explicit championship policy produces the final entitlement and its agreed instalments',()=>{
 let c=recordChampionshipPrizePolicy(blank(),{id:'policy',year:2027,name:'Approved game distribution',basis:'scenario',reference:'Explicit test policy',payoutsCents:Array.from({length:11},(_,i)=>110_000-i*10_000),paymentDates:['2028-01-31','2028-02-29']});
 const race=c.season.calendar.rounds[0].sessions.find(s=>s.kind==='race')!;
 const output:SessionOutput={schemaVersion:1,id:'result',attemptId:'attempt',sessionId:race.id,completionMode:'simulated',classification:[],distancePercent:100,provenance:'engine_generated',engineId:'test',engineVersion:'1',createdAt:'2027-12-31T00:00:00Z'};
 c={...at(c,'2027-12-31'),season:{...c.season,phase:'offseason',calendar:{...c.season.calendar,rounds:c.season.calendar.rounds.map(r=>({...r,status:'archived'}))}},championship:{...c.championship,teams:c.championship.teams.map(t=>({...t,points:t.teamId==='mclaren'?100:0}))},weekendOperations:{...c.weekendOperations,outputs:[output]}};
 c=awardChampionshipEntitlement(c);assert.equal(championshipFinanceState(c).entitlements[0].position,1);assert.equal(financeInvoiceViews(c).length,2);assert.equal(financeSummary(c).income,0);
 const awarded=awardChampionshipEntitlement(c);assert.equal(financeInvoiceViews(awarded).length,2);
 const received=processFinance(at(c,'2028-02-29'));assert.equal(financeSummary(received).income,110_000);
 assert.ok(validFinanceState(received.finance));
});

test('ownership transfer preserves team cash and never treats a share sale as a capital injection',()=>{
 let c=blank();c=saveFinanceOwner(c,{id:'seller-test',name:'Recorded seller',kind:'company'});c=saveFinanceOwner(c,{id:'buyer-test',name:'Recorded buyer',kind:'company'});
 c=recordFinanceStake(c,{teamId:'mclaren',ownerId:'seller-test',percentage:20,from:'2027-01-04',until:null,basis:'career_generated'});
 const cash=financeSummary(c).cash;
 c=recordFinanceOwnershipTransfer(c,{id:'stake-transfer',teamId:'mclaren',fromOwnerId:'seller-test',toOwnerId:'buyer-test',date:'2027-01-05',percentage:10,priceCents:500_000});
 assert.equal(financeSummary(c).cash,cash);assert.equal(getFinanceOperations(c).transfers.length,1);
 assert.ok(parseCareerState(JSON.stringify(c)));
});

test('agreed release fees appear once as the releasing team receipt and its old salary stops',()=>{
 let c=createCareer('mclaren');const role='race_driver' as const,personId='max-verstappen',terms={startDate:c.clock.date,endDate:'2027-12-31',clauses:[]};
 const offer={role,seat:1 as const,salaryCents:1_000_000_000,terms};
 const response=respondToOffer(undefined,offer,null,{personId,teamId:'mclaren',date:c.clock.date,roleSalaryCents:{[role]:100_000_000}});
 c=saveContractDraft(c,{id:'release-test',personId,role,seat:1,startSeason:2027,seasons:1,salaryCents:offer.salaryCents,negotiation:terms,offerState:response});
 const replacement=driverReleaseReplacementCandidates(c,'red-bull',c.clock.date)[0];assert.ok(replacement);
 c=recordDriverReleaseAgreement(c,{id:'consent',personId,fromTeamId:'red-bull',toTeamId:'mclaren',role,startsOn:c.clock.date,amountCents:200_000,agreedOn:c.clock.date,agreementReference:'Recorded releasing-team agreement',replacementDriverId:replacement.id});
 c=processRivalFinances(signAgreedContract(c,'release-test'));
 const receiver=financeTeamCareer(c,'red-bull');assert.equal(financeInvoiceViews(receiver).find(i=>i.id==='release-receipt:consent')!.paidCents,200_000);
 assert.equal(financeSummary(receiver).income,200_000);
 assert.equal(financeSummary(financeTeamCareer(processRivalFinances(c),'red-bull')).income,200_000);
 assert.ok(parseCareerState(JSON.stringify(c)));
});
