import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import type {CareerState} from '../lib/career/types';
import {activateWorkshop,DEFAULT_WORKSHOP,startDesign,startProduction,inspectWorkshopUnit,fitWorkshopUnit,carPerformance,markWorkshopUse,cancelWorkshopProject,upgradeWorkshop,quoteDesign,testingOverview,damageWorkshopUnit,repairWorkshopUnit,recordWorkshopDistance,validWorkshop,recordPowerUnit,installPowerUnit} from '../lib/career/manufacturing';
import {dayAfter,testingPeriods,testingAllowance,inShutdown} from '../lib/career/manufacturingRules';
import {processFinance,financeSummary} from '../lib/career/financeEngine';
import {financeOperationsSummary,saveFinanceBudget} from '../lib/career/financeOperations';
import {parseCareerState} from '../lib/career/validation';
import {continueCareerToNextSession} from '../lib/career/calendarPersistence';
import {prepareWeekendSession,startSessionAttempt,finishSessionAttempt} from '../lib/career/weekend';
import {simulatedSessionEngine} from '../lib/career/sessionEngine';
const at=(c:CareerState,date:string)=>({...c,clock:{...c.clock,date}});
const advance=(c:CareerState,date:string)=>processFinance(at(c,date));
const setup=()=>activateWorkshop(createCareer('mclaren'),{...DEFAULT_WORKSHOP,inspectionSlots:3});
const request={id:'wing-design',component:'front_wing' as const,focus:'balanced' as const,engineers:10,windHours:4,cfdCompute:.2,targetSeason:2027,priority:'normal' as const,kind:'design' as const};
test('explicit workshop starts with two unique car assemblies and no payments',()=>{const c=setup();assert.equal(c.finance!.book!.entries.length,0);assert.equal(c.finance!.book!.manufacturing!.units.length,12);assert.ok(validWorkshop(c.manufacturing));assert.ok(parseCareerState(JSON.stringify(c)));assert.throws(()=>activateWorkshop(c,DEFAULT_WORKSHOP),/already/);});
test('design, three units, two cars, one spare: first use reconciles cash, inventory and cap once',()=>{
 let c=setup();const baseline=carPerformance(c,'mclaren',1)!;c=startDesign(c,request);const designCost=c.manufacturing!.projects[0].costCents;
 c=advance(c,c.manufacturing!.projects[0].plannedFinish);const s=c.manufacturing!.specifications.find(s=>s.projectId===request.id)!;assert.ok(s);
 c=startProduction(c,'three-wings',s.id,3,'normal');const price=c.manufacturing!.projects[1].costCents;assert.equal(financeSummary(c).grossRelevant,designCost);
 c=advance(c,c.manufacturing!.projects[1].plannedFinish);const units=c.finance!.book!.manufacturing!.units.filter(u=>u.orderId==='workshop-three-wings');assert.equal(units.length,3);
 for(const u of units)c=inspectWorkshopUnit(c,u.id);c=fitWorkshopUnit(c,units[0].id,1);c=fitWorkshopUnit(c,units[1].id,2);
 assert.throws(()=>fitWorkshopUnit(c,units[0].id,2),/other car/);assert.equal(carPerformance(c,'mclaren',1)!.low,baseline.low+s.effects.low);
 assert.equal(financeOperationsSummary(c).accounts.inventory,price);c=markWorkshopUse(c,'test-session');assert.equal(financeOperationsSummary(c).accounts.inventory,price/3);assert.equal(financeSummary(c).grossRelevant,designCost+price*2/3);
 assert.deepEqual(markWorkshopUse(c,'test-session'),c);assert.ok(parseCareerState(JSON.stringify(c)));assert.equal(c.finance!.book!.manufacturing!.units.filter(u=>u.orderId==='workshop-three-wings'&&u.state==='available').length,1);
 c=fitWorkshopUnit(c,'opening-front_wing-car-1',1);c=fitWorkshopUnit(c,units[0].id,1);c=markWorkshopUse(c,'second-session');assert.equal(financeSummary(c).grossRelevant,designCost+price*2/3);assert.equal(financeOperationsSummary(c).accounts.inventory,price/3);
});
test('daily progression and one skip produce equal project progress, units, costs and testing',()=>{
 const c=startDesign(setup(),request),date=c.manufacturing!.projects[0].plannedFinish;let daily=c;for(let d=dayAfter(c.clock.date);d<=date;d=dayAfter(d))daily=advance(daily,d);const skip=advance(c,date);
 assert.deepEqual(skip.manufacturing,daily.manufacturing);assert.deepEqual(skip.finance!.book!.entries,daily.finance!.book!.entries);assert.ok(parseCareerState(JSON.stringify(skip)));
});
test('shutdown pauses work, and consumed testing is preserved after cancellation',()=>{
 let c=advance(setup(),'2027-07-31');c=startDesign(c,{...request,id:'summer'});c=advance(c,'2027-08-15');assert.equal(c.manufacturing!.projects[0].workDone,1);const used=testingOverview(c).used.windOn;assert.ok(used>0);c=cancelWorkshopProject(c,'summer');assert.equal(testingOverview(c).used.windOn,used);assert.equal(testingOverview(c).reserved.windOn,0);
});
test('resource and department caps apply before any order is saved',()=>{
 let c=setup();c=startDesign(c,{...request,engineers:20});assert.throws(()=>startDesign(c,{...request,id:'second'}),/already assigned/);
 assert.throws(()=>quoteDesign(setup(),{...request,windHours:80}),/allowance/);
 c=saveFinanceBudget(setup(),{id:'production-budget',department:'production',year:2027,limitCents:1,approvedOn:'2027-01-04',note:'Strict test limit'});
 assert.throws(()=>startProduction(c,'over-budget','opening-front_wing',1,'normal'),/budget/);
});
test('research does not affect the current car and facilities commission before increasing capacity',()=>{
 let c=startDesign(setup(),{...request,id:'research',kind:'research',targetSeason:2028});const before=carPerformance(c,'mclaren',1);c=advance(c,c.manufacturing!.projects[0].plannedFinish);assert.deepEqual(carPerformance(c,'mclaren',1),before);assert.equal(c.manufacturing!.specifications.at(-1)!.eligibleFrom,2028);
 c=upgradeWorkshop(c,'new-tunnel','tunnel',6_000_000,3);assert.equal(c.manufacturing!.facilities.tunnel,1);c=advance(c,c.manufacturing!.projects.at(-1)!.plannedFinish);assert.equal(c.manufacturing!.facilities.tunnel,2);assert.equal(testingOverview(c).limit.windOn,56);assert.ok(parseCareerState(JSON.stringify(c)));
});
test('repairs use a paid finite job and return units to inspection; distance cannot reroll',()=>{
 let c=setup();c=damageWorkshopUnit(c,'opening-front_wing-car-1',60,'Recorded inspection damage');c=repairWorkshopUnit(c,'opening-front_wing-car-1','repair',100_000,2);assert.equal(c.finance!.book!.manufacturing!.units[0].state,'repair');c=advance(c,c.manufacturing!.projects[0].plannedFinish);assert.equal(c.finance!.book!.manufacturing!.units[0].state,'inspection');c=inspectWorkshopUnit(c,'opening-front_wing-car-1');c=fitWorkshopUnit(c,'opening-front_wing-car-1',1);c=recordWorkshopDistance(c,'distance',{1:300,2:300});assert.ok(c.finance!.book!.manufacturing!.units[0].condition!<100);assert.deepEqual(recordWorkshopDistance(c,'distance',{1:300,2:300}),c);
});
test('ATP boundaries, bottom-team entitlement and shutdowns use the season rules',()=>{const p=testingPeriods(2027);assert.equal(p.length,6);assert.equal(p[0].end,'2027-03-07');assert.equal(p[3].end,'2027-09-05');assert.equal(p[5].end,'2027-12-31');assert.equal(testingAllowance(11).runs,368);assert.equal(testingAllowance(11).windOn,92);assert.ok(inShutdown('2028-01-01','2028-08-02'));assert.ok(!inShutdown('2028-01-02','2028-08-02'));});
test('received supplier units follow car seat and cannot be introduced above the ordinary quota',()=>{
 let c=setup();for(let i=1;i<=4;i++){c=recordPowerUnit(c,{id:`ice-${i}`,element:'ICE',car:1,driverId:'norris',supplier:'Mercedes',costCents:0},0);c=installPowerUnit(c,`ice-${i}`);c=recordWorkshopDistance(c,`use-${i}`,{1:10});}
 c=recordPowerUnit(c,{id:'ice-5',element:'ICE',car:1,driverId:'norris',supplier:'Mercedes',costCents:0},0);assert.throws(()=>installPowerUnit(c,'ice-5'),/penalty/);assert.ok(parseCareerState(JSON.stringify(c)));
});
test('quick sessions freeze current car performance and record supported use without changing archived inputs',async()=>{
 const memory=new Map<string,string>(),storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};
 let c=continueCareerToNextSession(setup(),storage).career;
 const session=c.clock.blockingEventId!;c=prepareWeekendSession(c,session,storage);c=startSessionAttempt(c,session,simulatedSessionEngine,storage);
 const input=structuredClone(c.weekendOperations.inputs.at(-1)!);assert.equal(input.carPerformance?.version,1);assert.equal(Object.keys(input.carPerformance!.scores).length,22);
 c=await finishSessionAttempt(c,session,simulatedSessionEngine,storage);assert.deepEqual(c.weekendOperations.inputs.at(-1),input);assert.ok(c.manufacturing!.history.some(h=>h.message===`Distance: ${session}`));assert.ok(parseCareerState(JSON.stringify(c)));
 const original=await simulatedSessionEngine.run(input),altered={...input,carPerformance:{...input.carPerformance!,scores:{...input.carPerformance!.scores,norris:1000}}};
 const boosted=await simulatedSessionEngine.run(altered);assert.equal(boosted.classification[0].driverId,'norris');assert.deepEqual((await simulatedSessionEngine.run(input)).classification,original.classification);
});
