import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState} from '../lib/career/types';
import {processFinance} from '../lib/career/financeEngine';
import {financeOperationsSummary} from '../lib/career/financeOperations';
import {parseCareerState} from '../lib/career/validation';
import {cancelManufacturingOrder,createManufacturingOrder,creditManufacturingOrder,initializeManufacturingFinance,manufacturingSummary,processManufacturingFinance,updateManufacturedUnit,validManufacturingFinance,type ManufacturingOrder} from '../lib/career/manufacturingFinance';
const at=(c:CareerState,date:string)=>({...c,clock:{...c.clock,date}});
const order=(patch:Partial<ManufacturingOrder>={})=>({id:'wing',name:'Front wing revision B',kind:'production' as const,counterparty:'Recorded supplier',deliveryOn:'2027-01-20',recognitionOn:'2027-01-20',specification:'FW-B',quantity:2,costs:[{id:'materials',name:'Carbon materials',kind:'materials' as const,amountCents:100_000_000}],instalments:[{id:'deposit',date:'2027-01-04',amountCents:25_000_000,nonRefundable:true},{id:'balance',date:'2027-01-20',amountCents:75_000_000,nonRefundable:false}],relevantCents:100_000_000,notes:'Explicit test order',...patch});

test('manufacturing starts empty and never invents costs or assets',()=>{
 const c=initializeManufacturingFinance(createCareer('mclaren')),s=manufacturingSummary(c);assert.equal(s.orders.length,0);assert.equal(s.units.length,0);assert.equal(c.finance!.book!.assets.length,0);assert.equal(c.finance!.book!.entries.length,0);assert.ok(validManufacturingFinance(s));
});
test('explicit instalments settle independently of delivery and inspection units arrive once',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order());assert.equal(c.finance!.book!.entries.filter(e=>e.kind==='payment').reduce((s,e)=>s+e.cashCents,0),-25_000_000);assert.equal(manufacturingSummary(c).units.length,0);
 c=processManufacturingFinance(at(c,'2027-01-20'),'2027-01-20');c=processFinance(c);const s=manufacturingSummary(c);assert.equal(s.orders[0].status,'delivered');assert.equal(s.units.length,2);assert.equal(s.units.reduce((n,u)=>n+u.costCents,0),100_000_000);assert.ok(s.units.every(u=>u.state==='inspection'));
 assert.deepEqual(processManufacturingFinance(c,c.clock.date),c);assert.deepEqual(processFinance(c).finance,c.finance);
 assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='manufacturing:wing').reduce((s,e)=>s+e.relevantCents,0),100_000_000);
});
test('cancellation releases avoidable future costs and preserves paid non-refundable deposit',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order());c=cancelManufacturingOrder(at(c,'2027-01-10'),'wing');
 assert.equal(manufacturingSummary(c).orders[0].status,'cancelled');assert.ok(!c.finance!.book!.obligations.some(o=>o.id==='manufacturing:wing:balance'));assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='manufacturing:wing').reduce((s,e)=>s+e.cashCents,0),-25_000_000);assert.equal(manufacturingSummary(processManufacturingFinance(at(c,'2027-01-25'),'2027-01-25')).units.length,0);
 assert.deepEqual(cancelManufacturingOrder(c,'wing'),c);
});
test('supplier credit is bounded by paid amount and idempotent, and reverses recognised relevant cost',()=>{
 let c=cancelManufacturingOrder(at(createManufacturingOrder(createCareer('mclaren'),order()),'2027-01-10'),'wing');c=creditManufacturingOrder(c,'wing','agreed-refund',10_000_000,'Supplier agreed partial deposit refund');
 assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='manufacturing-credit:wing').reduce((s,e)=>s+e.cashCents,0),10_000_000);assert.ok(c.finance!.book!.entries.some(e=>e.sourceId==='manufacturing-credit:wing'&&e.relevantCents<0));
 assert.deepEqual(creditManufacturingOrder(c,'wing','agreed-refund',10_000_000,'Supplier agreed partial deposit refund'),c);assert.throws(()=>creditManufacturingOrder(c,'wing','too-much',20_000_000,'More than paid'),/exceed/);
});
test('staff allocation uses recognised payroll once and creates no second payment',()=>{
 const c=createCareer('mclaren');c.finance!.book!.entries.push({id:'staff-payroll',sourceId:'staff:one',date:c.clock.date,description:'Recognised engineering wages',category:'staff_pay',cashCents:0,relevantCents:20_000_000,excludedCents:0,kind:'recognition',basis:'career_action'});
 const allocation=order({id:'research',kind:'research',costs:[{id:'engineering',name:'Allocated design team',kind:'staff_allocation',amountCents:10_000_000,staffEntryId:'staff-payroll'}],instalments:[],relevantCents:0});
 const next=createManufacturingOrder(c,allocation);assert.equal(next.finance!.book!.entries.length,c.finance!.book!.entries.length);assert.equal(next.finance!.book!.obligations.length,0);assert.equal(manufacturingSummary(next).allocatedStaffCents,10_000_000);
 assert.throws(()=>createManufacturingOrder(next,{...allocation,id:'over-allocation',costs:[{...allocation.costs[0],amountCents:15_000_000}]}),/allocated/);
});
test('unit state changes require inspection and damage never creates an invented crash charge',()=>{
 let c=processManufacturingFinance(at(createManufacturingOrder(createCareer('mclaren'),order()),'2027-01-20'),'2027-01-20');const id=manufacturingSummary(c).units[0].id;const cash=c.finance!.book!.entries.reduce((sum,e)=>sum+e.cashCents,0),cap=c.finance!.book!.entries.reduce((sum,e)=>sum+e.relevantCents,0);
 assert.throws(()=>updateManufacturedUnit(c,id,'installed'),/cannot/);c=updateManufacturedUnit(c,id,'available');c=updateManufacturedUnit(c,id,'installed');c=updateManufacturedUnit(c,id,'damaged');assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.cashCents,0),cash);assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.relevantCents,0),cap);assert.equal(manufacturingSummary(c).units[0].state,'damaged');assert.ok(c.finance!.book!.entries.some(e=>e.id.startsWith('unit-allocation:')&&e.accountLines?.some(l=>l.account==='inventory'&&l.creditCents>0)));
});
test('facility capital payment and subsequent depreciation do not charge the acquisition twice',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order({id:'rig',kind:'facility',quantity:1,assetLifeMonths:10,assetRelevant:true,relevantCents:0}));assert.equal(c.finance!.book!.assets.length,1);assert.equal(c.finance!.book!.assets[0].acquiredOn,'2027-01-20');
 c=processFinance(at(c,'2027-01-31'));assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='manufacturing:rig'&&e.kind==='payment').reduce((sum,e)=>sum+e.cashCents,0),-100_000_000);assert.ok(c.finance!.book!.entries.some(e=>e.category==='depreciation'&&e.relevantCents===10_000_000));assert.ok(!c.finance!.book!.entries.some(e=>e.id.startsWith('asset-purchase:')));
});
test('malformed schedules and ID reuse are rejected',()=>{
 const c=createCareer('mclaren');assert.throws(()=>createManufacturingOrder(c,order({instalments:[]})),/add up/);assert.throws(()=>createManufacturingOrder(c,order({relevantCents:200_000_000})),/exceed/);const next=createManufacturingOrder(c,order());assert.throws(()=>createManufacturingOrder(next,order({name:'Changed terms'})),/different terms/);assert.ok(!validManufacturingFinance({version:1,orders:[],units:[{id:'bad'}],audit:[]}));
});

test('supplier credits reduce capital basis and reverse excess past depreciation without cash duplication',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order({id:'rig-credit',kind:'facility',quantity:1,assetLifeMonths:10,assetRelevant:true,relevantCents:0}));c=processFinance(at(c,'2027-01-31'));
 c=creditManufacturingOrder(c,'rig-credit','capital-credit',20_000_000,'Agreed equipment price adjustment');
 assert.equal(c.finance!.book!.assets[0].costCents,80_000_000);assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='asset:manufacturing:rig-credit').reduce((sum,e)=>sum+e.relevantCents,0),8_000_000);
 c=processFinance(at(c,'2027-02-28'));assert.equal(c.finance!.book!.entries.filter(e=>e.sourceId==='asset:manufacturing:rig-credit').reduce((sum,e)=>sum+e.relevantCents,0),16_000_000);
 assert.throws(()=>creditManufacturingOrder(c,'rig-credit','capital-credit',10_000_000,'Changed terms'),/different terms/);
});

test('a supplier credit before delivery reduces manufactured unit cost rather than creating negative inventory later',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order());c=creditManufacturingOrder(c,'wing','pre-delivery-credit',10_000_000,'Supplier agreed revised materials price');c=processFinance(at(c,'2027-01-20'));
 assert.equal(manufacturingSummary(c).units.reduce((sum,u)=>sum+u.costCents,0),90_000_000);
});

test('inventory consumption and supplier credits reconcile the asset account without duplicating cap costs',()=>{
 let c=processFinance(at(createManufacturingOrder(createCareer('mclaren'),order()),'2027-01-20'));const units=manufacturingSummary(c).units;c=updateManufacturedUnit(c,units[0].id,'available');c=updateManufacturedUnit(c,units[0].id,'installed');
 c=creditManufacturingOrder(c,'wing','goods-credit',20_000_000,'Agreed delivered-part price adjustment');const s=financeOperationsSummary(c);assert.equal(s.accounts.inventory,40_000_000);assert.equal(s.accounts.expenses,40_000_000);assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.relevantCents,0),80_000_000);assert.ok(s.journalBalanced);
 c=updateManufacturedUnit(c,units[1].id,'scrapped');assert.equal(financeOperationsSummary(c).accounts.inventory,0);assert.equal(financeOperationsSummary(c).accounts.expenses,80_000_000);
});

test('a cancelled equipment deposit becomes a recorded cancellation cost and a credit reverses that cost',()=>{
 let c=createManufacturingOrder(createCareer('mclaren'),order({id:'cancel-rig',kind:'facility',assetLifeMonths:10,assetRelevant:true,relevantCents:0}));c=cancelManufacturingOrder(at(c,'2027-01-10'),'cancel-rig');assert.equal(c.finance!.book!.assets.length,0);assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.relevantCents,0),25_000_000);
 c=creditManufacturingOrder(c,'cancel-rig','cancel-credit',10_000_000,'Supplier agreed refund');assert.equal(c.finance!.book!.entries.reduce((sum,e)=>sum+e.relevantCents,0),15_000_000);assert.equal(financeOperationsSummary(c).accounts.expenses,15_000_000);
});

test('manufacturing records survive a career export and cannot alter a closed reporting period',()=>{
 const c=createManufacturingOrder(createCareer('mclaren'),order());assert.deepEqual(parseCareerState(JSON.stringify(c))!.finance!.book!.manufacturing,c.finance!.book!.manufacturing);
 const closed={...c,finance:{...c.finance!,book:{...c.finance!.book!,operations:{...c.finance!.book!.operations!,periods:[{year:2027,status:'closed' as const,closedOn:'2027-12-31',cashCents:null,incomeCents:0,expenseCents:0,relevantCents:0,excludedCents:0,unresolvedCents:0,capCents:21_500_000_000,note:'Test closed period'}]}}}};
 assert.throws(()=>cancelManufacturingOrder(closed,'wing'),/closed/);assert.throws(()=>creditManufacturingOrder(closed,'wing','late',1,'Late change'),/closed/);
});
