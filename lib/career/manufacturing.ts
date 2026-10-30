import type {CareerState} from './types';

import {teams} from '../data/grid';

import baselines from '../../supabase/seed-data/2027-team-baselines.json';

import {COMPONENTS,OPERATIONAL_RULES,addTesting,dayAfter,inShutdown,noTesting,scaleTesting,testingAllowance,testingFits,testingPeriod,testingPeriods,workingDates,zeroPerformance,type ComponentKind,type DevelopmentFocus,type Performance,type TestingResources} from './manufacturingRules';

import {createManufacturingOrder,cancelManufacturingOrder,updateManufacturedUnit,initializeManufacturingFinance} from './manufacturingFinance';

import {processFinance,refreshFinance} from './financeEngine';

import {processFinanceCompliance} from './financeCompliance';

import {validContractDate} from './negotiation';



export type PartSpecification={id:string;name:string;kind:ComponentKind;version:number;eligibleFrom:number;createdOn:string;projectId?:string;effects:Performance};

export type WorkshopConfig={engineers:number;productionSlots:number;inspectionSlots:number;summerStart:string;previousPosition:number;designCostFactor:number;productionCostFactor:number;shippingDays:number;note:string};

export type FactoryKey='design'|'production'|'tunnel'|'cfd'|'inspection';

export type WorkshopProject={id:string;name:string;kind:'design'|'research'|'production'|'repair'|'facility';component:ComponentKind;specificationId?:string;unitId?:string;facility?:FactoryKey;targetSeason:number;focus:DevelopmentFocus;engineers:number;quantity:number;priority:'normal'|'rush';createdOn:string;plannedFinish:string;workDates:string[];workDone:number;workDays:number;testing:TestingResources;status:'queued'|'working'|'ready'|'cancelled';orderId:string;costCents:number;lastReason?:string;startedOn?:string;finishedOn?:string;effects:Performance};

export type ManufacturingState={version:1;rulesVersion:string;approvedOn:string;processedThrough:string;config:WorkshopConfig;baseline:Record<string,Performance>;specifications:PartSpecification[];projects:WorkshopProject[];facilities:Record<FactoryKey,number>;testing:{id:string;usage:TestingResources;position:number}[];history:{date:string;message:string}[];pu:PowerUnitStock[]};

export type PowerUnitStock={id:string;element:'ICE'|'TC'|'EXH'|'ES'|'CE'|'MGUK'|'ANC';supplier:string;driverId:string;season:number;costCents:number;car:1|2;introducedOn?:string;installed:boolean;usage:number};

export type DesignRequest={id:string;component:ComponentKind;focus:DevelopmentFocus;engineers:number;windHours:number;cfdCompute:number;targetSeason:number;priority:'normal'|'rush';kind:'design'|'research'};

export const DEFAULT_WORKSHOP:WorkshopConfig={engineers:20,productionSlots:2,inspectionSlots:1,summerStart:'2027-08-02',previousPosition:1,designCostFactor:1,productionCostFactor:1,shippingDays:2,note:'Workshop model v1 · game assumptions; no payroll or opening payments generated'};

const unit=(c:CareerState,id:string)=>c.finance?.book?.manufacturing?.units.find(u=>u.id===id);

const model=(c:CareerState)=>{if(!c.manufacturing)throw new Error('Review and activate a workshop starting model first.');return c.manufacturing;};

const withModel=(c:CareerState,m:ManufacturingState):CareerState=>({...c,manufacturing:m});

const open=(c:CareerState)=>{if(c.finance?.book?.operations?.periods.some(p=>p.year===Number(c.clock.date.slice(0,4))))throw new Error('This financial year is closed.');};

const validConfig=(x:WorkshopConfig)=>Number.isInteger(x.engineers)&&x.engineers>=1&&x.engineers<=500&&Number.isInteger(x.productionSlots)&&x.productionSlots>=1&&x.productionSlots<=20&&Number.isInteger(x.inspectionSlots)&&x.inspectionSlots>=1&&x.inspectionSlots<=20&&validContractDate(x.summerStart)&&['07','08'].includes(x.summerStart.slice(5,7))&&dayAfter(x.summerStart,13).slice(5,7)<='08'&&Number.isInteger(x.previousPosition)&&x.previousPosition>=1&&x.previousPosition<=11&&[x.designCostFactor,x.productionCostFactor].every(n=>Number.isFinite(n)&&n>=.1&&n<=10)&&Number.isInteger(x.shippingDays)&&x.shippingDays>=0&&x.shippingDays<=30&&typeof x.note==='string'&&x.note.trim().length>0;

export function workshopBaseline():Record<string,Performance>{return Object.fromEntries(teams.map(t=>{const row=baselines.teams.find(x=>x.team_slug===t.id||x.team_slug==='red-bull-racing'&&t.id==='red-bull');const r=row?.ratings as Record<string,number>|undefined;return [t.id,{low:r?.low_speed_downforce_rating??70,medium:r?.medium_speed_downforce_rating??70,high:r?.high_speed_downforce_rating??70,drag:r?.drag_reduction_rating??70,mechanical:r?.suspension_design_rating??70,cooling:r?.cooling_system_rating??70,durability:r?.component_reliability_rating??70,mass:0}];}));}

export function activateWorkshop(career:CareerState,config:WorkshopConfig):CareerState{

  if(career.manufacturing)throw new Error('The starting model has already been recorded.');

  if(!validConfig(config)||!config.summerStart.startsWith(String(career.season.year)))throw new Error('Record valid workshop capacities, summer dates, cost factors and provenance.');

  open(career);let c=initializeManufacturingFinance(career);const specs:PartSpecification[]=(Object.keys(COMPONENTS) as ComponentKind[]).map(kind=>({id:`opening-${kind}`,name:`${COMPONENTS[kind].name} · starting specification`,kind,version:1,eligibleFrom:career.season.year,createdOn:c.clock.date,effects:zeroPerformance()}));

  const b=c.finance!.book!,m=b.manufacturing!;

  const units=specs.flatMap(s=>[1,2].map(car=>({id:`${s.id}-car-${car}`,orderId:'opening-workshop',opening:true,specification:s.name,specificationId:s.id,costCents:0,state:'installed' as const,changedOn:c.clock.date,car:car as 1|2,condition:100,expensed:true,firstUsedOn:c.clock.date})));

  c={...c,finance:{...c.finance!,book:{...b,manufacturing:{...m,units:[...m.units,...units]}}}};

  return withModel(c,{version:1,rulesVersion:OPERATIONAL_RULES,approvedOn:c.clock.date,processedThrough:c.clock.date,config:{...config},baseline:workshopBaseline(),specifications:specs,projects:[],facilities:{design:1,production:1,tunnel:1,cfd:1,inspection:1},testing:[],pu:[],history:[{date:c.clock.date,message:'Starting model explicitly activated. Existing fitted components use zero incremental opening cost; no historical purchases or payroll created.'}]});

}

function positionFor(c:CareerState,date:string){const m=model(c),p=testingPeriod(date),saved=m.testing.find(x=>x.id===p.id);if(saved)return saved.position;

  const previous=c.seasonHistory.find(s=>s.year===Number(date.slice(0,4))-1)?.championship.teams;

  const firstHalf=m.testing.find(t=>t.id===`${date.slice(0,4)}-4`);if(p.number>=4&&firstHalf)return firstHalf.position;
  const ranks=p.number<=3?previous:(c.season.year===Number(date.slice(0,4))?c.championship.teams:previous);

  if(!ranks||!ranks.some(t=>t.points>0))return m.config.previousPosition;

  const idx=[...ranks].sort((a,b)=>b.points-a.points).findIndex(t=>t.teamId===c.player.teamId);return idx<0?11:idx+1;

}

export function testingOverview(c:CareerState,date=c.clock.date){const m=model(c),period=testingPeriod(date),position=positionFor(c,date),used=m.testing.find(t=>t.id===period.id)?.usage??noTesting();

  const reserved=m.projects.filter(p=>['queued','working'].includes(p.status)).reduce((sum,p)=>addTesting(sum,scaleTesting(p.testing,p.workDates.slice(p.workDone).filter(d=>d>=period.start&&d<=period.end).length/Math.max(1,p.workDays))),noTesting());

  return {period,position,limit:testingAllowance(position),used,reserved};

}

function designEffects(c:CareerState,r:DesignRequest):Performance{const m=model(c),base=zeroPerformance(),kind=COMPONENTS[r.component];

  const gain=Math.min(3,1+Math.sqrt(r.windHours)*(.9+m.facilities.tunnel*.1)/6+Math.sqrt(r.cfdCompute)*(.9+m.facilities.cfd*.1)/3)*(r.priority==='rush'?.8:1);

  for(const k of kind.effects)base[k as keyof Performance]=Number((gain/(kind.effects.length>2?1.5:1)).toFixed(2));

  if(r.focus==='performance'){for(const k of kind.effects)base[k as keyof Performance]*=1.2;base.durability=-.5;base.drag-=.25;}

  if(r.focus==='efficiency'){base.drag+=.7;base.mass=-.2;for(const k of kind.effects)base[k as keyof Performance]*=.8;}

  if(r.focus==='durability'){base.durability=1.5;for(const k of kind.effects)base[k as keyof Performance]*=.7;}

  return base;

}

export function quoteDesign(c:CareerState,r:DesignRequest){

  const m=model(c);if(!r.id||!COMPONENTS[r.component]||!['balanced','performance','efficiency','durability'].includes(r.focus)||!['normal','rush'].includes(r.priority)||!['design','research'].includes(r.kind)||!Number.isInteger(r.engineers)||r.engineers<1||r.engineers>m.config.engineers+(m.facilities.design-1)*5||![r.windHours,r.cfdCompute].every(n=>Number.isFinite(n)&&n>=0)||r.windHours>92||r.cfdCompute>6.9||!Number.isInteger(r.targetSeason)||r.targetSeason<c.season.year||r.targetSeason>c.season.year+1)throw new Error('Choose a component, available engineers, testing allocation and current/next season.');

  if(r.kind==='research'&&r.targetSeason!==c.season.year+1)throw new Error('Research targets the next season.');

  if(!COMPONENTS[r.component].aero&&(r.windHours||r.cfdCompute))throw new Error('This mechanical project does not use aerodynamic testing.');

  const allocated=m.projects.filter(p=>['queued','working'].includes(p.status)).reduce((s,p)=>s+p.engineers,0);

  if(allocated+r.engineers>m.config.engineers+(m.facilities.design-1)*5)throw new Error('These engineers are already assigned to active projects.');

  const workDays=Math.ceil(COMPONENTS[r.component].work/r.engineers*(r.priority==='rush'?.8:1))+2;

  const dates=workingDates(c.clock.date,workDays,m.config.summerStart),testing={runs:Math.ceil(r.windHours*4),windOn:r.windHours,occupancy:r.windHours*5,geometries:Math.ceil(r.cfdCompute*200),compute:r.cfdCompute};

  for(const period of new Set(dates.map(d=>testingPeriod(d).id))){const day=dates.find(d=>testingPeriod(d).id===period)!,t=testingOverview(c,day);const allocation=scaleTesting(testing,dates.filter(d=>testingPeriod(d).id===period).length/workDays);if(!testingFits(addTesting(addTesting(t.used,t.reserved),allocation),t.limit))throw new Error(`Testing reservations exceed the allowance in period ${period}. Reduce allocation or wait.`);}

  const costCents=Math.round(COMPONENTS[r.component].designCents*m.config.designCostFactor*(r.priority==='rush'?1.4:1));

  return {workDays,dates,testing,costCents,effects:designEffects(c,r),finish:dates.at(-1)!};

}

export function startDesign(career:CareerState,r:DesignRequest){open(career);const m=model(career);if(m.projects.some(p=>p.id===r.id))throw new Error('This project already exists.');const q=quoteDesign(career,r),name=`${COMPONENTS[r.component].name} ${r.kind} · ${r.targetSeason}`;

  let c=createManufacturingOrder(career,{id:`workshop-${r.id}`,managedProjectId:r.id,name,kind:r.kind==='research'?'research':'design',counterparty:'Development department',deliveryOn:q.finish,recognitionOn:career.clock.date,specification:r.component,quantity:1,costs:[{id:'external',name:'Approved design / tooling quote (existing salaries excluded)',kind:'external',amountCents:q.costCents}],instalments:[{id:'approval',date:career.clock.date,amountCents:q.costCents,nonRefundable:true}],relevantCents:q.costCents,notes:`${m.config.note}. Cost incurred on authorisation; existing payroll is separate.`});

  const project:WorkshopProject={...r,name,quantity:1,createdOn:c.clock.date,plannedFinish:q.finish,workDates:q.dates,workDone:0,workDays:q.workDays,testing:q.testing,status:'working',orderId:`workshop-${r.id}`,costCents:q.costCents,effects:q.effects};

  return withModel(c,{...m,projects:[...m.projects,project]});

}

export function quoteProduction(c:CareerState,specId:string,quantity:number,priority:'normal'|'rush'){

  const m=model(c),spec=m.specifications.find(s=>s.id===specId);if(!spec||!Number.isInteger(quantity)||quantity<1||quantity>20||!['normal','rush'].includes(priority))throw new Error('Choose a validated specification and 1–20 units.');

  const workDays=Math.max(1,Math.ceil(COMPONENTS[spec.kind].daysPerUnit*quantity/(1+(m.facilities.production-1)*.2)*(priority==='rush'?.7:1)));

  const active=m.projects.filter(p=>['production','repair'].includes(p.kind)&&['queued','working'].includes(p.status));

  const capacity=m.config.productionSlots+m.facilities.production-1;

  const start=active.length>=capacity?[...active].sort((a,b)=>a.plannedFinish.localeCompare(b.plannedFinish))[Math.max(0,active.length-capacity)].plannedFinish:c.clock.date;

  const dates=workingDates(start,workDays,m.config.summerStart),finish=dayAfter(dates.at(-1)!,m.config.shippingDays);

  return {spec,workDays,dates,finish,costCents:Math.round(COMPONENTS[spec.kind].unitCents*quantity*m.config.productionCostFactor*(priority==='rush'?1.5:1))};

}

export function startProduction(career:CareerState,id:string,specId:string,quantity:number,priority:'normal'|'rush'){

  open(career);const m=model(career);if(!id||m.projects.some(p=>p.id===id))throw new Error('Use a unique job ID.');const q=quoteProduction(career,specId,quantity,priority),name=`${q.spec.name} · ${quantity} units`;

  let c=createManufacturingOrder(career,{id:`workshop-${id}`,name,kind:'production',counterparty:'Manufacturing workshop',deliveryOn:q.finish,recognitionOn:q.finish,specification:q.spec.name,specificationId:specId,quantity,costs:[{id:'materials',name:'Materials and conversion',kind:'materials',amountCents:q.costCents}],instalments:[{id:'deposit',date:career.clock.date,amountCents:Math.round(q.costCents/2),nonRefundable:true},{id:'balance',date:q.finish,amountCents:q.costCents-Math.round(q.costCents/2),nonRefundable:false}],relevantCents:q.costCents,notes:m.config.note,capModel:2,managedProjectId:id});

  const p:WorkshopProject={id,name,kind:'production',component:q.spec.kind,specificationId:specId,targetSeason:q.spec.eligibleFrom,focus:'balanced',engineers:0,quantity,priority,createdOn:c.clock.date,plannedFinish:q.finish,workDates:q.dates,workDone:0,workDays:q.workDays,testing:noTesting(),status:'queued',orderId:`workshop-${id}`,costCents:q.costCents,effects:zeroPerformance()};

  return withModel(c,{...m,projects:[...m.projects,p]});

}

export function cancelWorkshopProject(career:CareerState,id:string){open(career);const m=model(career),p=m.projects.find(p=>p.id===id);if(!p||p.status==='ready')throw new Error('Choose an unfinished project.');if(p.status==='cancelled')return career;

  const c=cancelManufacturingOrder(career,p.orderId);return withModel(c,{...m,projects:m.projects.map(p=>p.id===id?{...p,status:'cancelled'}:p),history:[...m.history,{date:c.clock.date,message:`${p.name} cancelled; consumed testing and sunk costs retained.`}]});

}

export function processWorkshop(career:CareerState,on:string):CareerState{

  if(!career.manufacturing)return career;const m=structuredClone(career.manufacturing);if(on<m.processedThrough)throw new Error('Workshop cannot run backwards.');

  for(let date=dayAfter(m.processedThrough);date<=on;date=dayAfter(date)){

    const period=testingPeriod(date);let t=m.testing.find(t=>t.id===period.id);if(!t){t={id:period.id,position:positionFor({...career,manufacturing:m},date),usage:noTesting()};m.testing.push(t);}

    const shutdown=inShutdown(date,`${date.slice(0,4)}${m.config.summerStart.slice(4)}`);

    let slots=m.config.productionSlots+m.facilities.production-1;

    for(const p of m.projects.filter(p=>!['ready','cancelled'].includes(p.status))){
      if(date<=p.createdOn)continue;

      if(p.workDone<p.workDays&&shutdown){p.lastReason='Mandatory shutdown';continue;}

      if(p.workDone<p.workDays&&['production','repair'].includes(p.kind)){if(slots<=0){p.lastReason='Waiting for workshop capacity';continue;}slots--;}

      if(p.workDone<p.workDays){const draw=scaleTesting(p.testing,1/p.workDays);if(!testingFits(addTesting(t.usage,draw),testingAllowance(t.position))){p.lastReason='Waiting for aerodynamic testing allowance';continue;}t.usage=addTesting(t.usage,draw);p.startedOn=p.startedOn??date;p.workDone++;p.status='working';p.lastReason=undefined;}

      if(p.workDone===p.workDays){if(!p.finishedOn)p.finishedOn=date;

        if(p.kind==='production'&&date<dayAfter(p.finishedOn,m.config.shippingDays)){p.lastReason='In transit';continue;}

        p.status='ready';p.plannedFinish=date;

        if(p.kind==='design'||p.kind==='research'){

          const previous=m.specifications.filter(s=>s.kind===p.component&&s.eligibleFrom<=p.targetSeason).sort((a,b)=>b.version-a.version)[0];

          const effects=zeroPerformance();for(const k of Object.keys(effects) as (keyof Performance)[])effects[k]=(previous?.effects[k]??0)+p.effects[k];

          const spec={id:`spec-${p.id}`,name:`${COMPONENTS[p.component].name} · v${(previous?.version??1)+1}`,kind:p.component,version:(previous?.version??1)+1,eligibleFrom:p.targetSeason,createdOn:date,projectId:p.id,effects};m.specifications.push(spec);p.specificationId=spec.id;

        }

        if(p.kind==='facility'&&p.facility)m.facilities[p.facility]++;

        m.history.push({date,message:`${p.name} completed`});

      }

    }

  }

  m.processedThrough=on;

  // Managed deliveries follow completed work, never an independently chosen date.

  const b=career.finance!.book!,f=b.manufacturing!;

  const orders=f.orders.map(o=>{const p=m.projects.find(p=>p.id===o.managedProjectId);if(!p||p.status==='cancelled'||o.status!=='ordered')return o;const date=p.status==='ready'?p.plannedFinish:p.finishedOn?dayAfter(p.finishedOn,m.config.shippingDays):dayAfter(workingDates(on,Math.max(1,p.workDays-p.workDone),m.config.summerStart).at(-1)!,p.kind==='production'?m.config.shippingDays:0);p.plannedFinish=date;return {...o,manufactureStartedOn:p.kind==='production'?p.startedOn:undefined,deliveryOn:date,...(['production','facility'].includes(o.kind)?{recognitionOn:date}:{}),instalments:o.instalments.map(i=>i.id==='balance'?{...i,date}:i)};});

  const obligations=b.obligations.map(o=>{const order=orders.find(r=>o.sourceId===`manufacturing:${r.id}`);if(!order?.managedProjectId||order.status==='cancelled')return o;return {...o,recognitionDate:order.recognitionOn,dueDate:o.id.endsWith(':balance')?order.deliveryOn:o.dueDate};});

  const units=f.units.map(u=>{const p=m.projects.find(p=>p.kind==='repair'&&p.unitId===u.id&&p.status==='ready');return p&&u.state==='repair'?{...u,state:'inspection' as const,condition:100,changedOn:p.plannedFinish}:u;});

  return {...career,manufacturing:m,finance:{...career.finance!,book:{...b,obligations,assets:b.assets.map(a=>{const o=orders.find(o=>a.id===`manufacturing:${o.id}`&&o.managedProjectId);return o?{...a,acquiredOn:o.deliveryOn}:a;}),manufacturing:{...f,orders,units}}}};

}

export function workshopScheduleDates(c:CareerState){if(!c.manufacturing)return [];const m=c.manufacturing;return [...new Set([...m.projects.filter(p=>!['ready','cancelled'].includes(p.status)).flatMap(p=>[...p.workDates.filter(d=>d>m.processedThrough),p.plannedFinish]),...testingPeriods(c.season.year).map(p=>p.start)])];}

export function carPerformance(c:CareerState,teamId:string,car:1|2):Performance|null{

  const m=c.manufacturing;if(!m)return null;const base=m.baseline[teamId];if(!base)return null;const result={...base};if(teamId!==c.player.teamId)return result;

  for(const u of c.finance?.book?.manufacturing?.units??[]){if(u.state!=='installed'||u.car!==car)continue;const spec=m.specifications.find(s=>s.id===u.specificationId);if(!spec||spec.eligibleFrom>c.season.year)continue;for(const k of Object.keys(result) as (keyof Performance)[])result[k]+=spec.effects[k];}

  for(const k of Object.keys(result) as (keyof Performance)[])result[k]=k==='mass'?result[k]:Math.max(0,Math.min(99,result[k]));return result;

}

export function carChangeRestriction(c:CareerState){const round=c.season.calendar.rounds.find(r=>r.id===c.weekendOperations.activeWeekendId);if(!round)return null;if(round.sessions.some(s=>s.status==='running'))return 'A session is running.';

  for(const [q,r] of [['sprint_qualifying','sprint'],['qualifying','race']]){const qual=round.sessions.find(s=>s.kind===q),race=round.sessions.find(s=>s.kind===r);if(qual&&['running','completed'].includes(qual.status)&&race&&!['completed','cancelled'].includes(race.status))return 'Parc fermé: configuration is locked until the next permitted window.';}

  return null;

}

export function fitWorkshopUnit(career:CareerState,id:string,car:1|2){open(career);const m=model(career),u=unit(career,id),s=m.specifications.find(s=>s.id===u?.specificationId);if(!u||!s||(u.condition??100)<=0||!['available','installed'].includes(u.state)||s.eligibleFrom>career.season.year||![1,2].includes(car))throw new Error('Choose an inspected, compatible part and a car.');const restriction=carChangeRestriction(career);if(restriction)throw new Error(restriction);if(u.car&&u.car!==car)throw new Error('This physical unit is fitted to the other car.');

  const book=career.finance!.book!,f=book.manufacturing!;

  const units=f.units.map(x=>x.id===id?{...x,state:'installed' as const,car,changedOn:career.clock.date}:x.car===car&&m.specifications.find(s=>s.id===x.specificationId)?.kind===s.kind?{...x,state:'available' as const,car:undefined,changedOn:career.clock.date}:x);

  return {...career,finance:{...career.finance!,book:{...book,manufacturing:{...f,units}}}};

}

export function inspectWorkshopUnit(career:CareerState,id:string){const m=model(career);const used=m.history.filter(h=>h.date===career.clock.date&&h.message.startsWith('Inspection:')).length;if(used>=m.config.inspectionSlots+m.facilities.inspection-1)throw new Error('Inspection capacity is used for today.');const u=unit(career,id);if(!u||u.state!=='inspection')throw new Error('Select a unit awaiting inspection.');const c=updateManufacturedUnit(career,id,'available');return withModel(c,{...m,history:[...m.history,{date:c.clock.date,message:`Inspection: ${u.specification} passed`}]});}

export function markWorkshopUse(career:CareerState,sessionId:string){if(!career.manufacturing)return career;const m=model(career);
  for(const car of [1,2])for(const kind of Object.keys(COMPONENTS)){if(!career.finance!.book!.manufacturing!.units.some(u=>u.car===car&&u.state==='installed'&&(u.condition??100)>0&&m.specifications.some(s=>s.id===u.specificationId&&s.kind===kind&&s.eligibleFrom<=career.season.year)))throw new Error(`Car ${car} needs a serviceable ${COMPONENTS[kind as ComponentKind].name} before running.`);}
if(m.history.some(h=>h.message===`Session use: ${sessionId}`))return career;const book=career.finance!.book!,f=book.manufacturing!;

  let c={...career,manufacturing:{...m,history:[...m.history,{date:career.clock.date,message:`Session use: ${sessionId}`}]},finance:{...career.finance!,book:{...book,manufacturing:{...f,units:f.units.map(u=>u.state==='installed'?{...u,firstUsedOn:u.firstUsedOn??career.clock.date}:u)}}}};

  return refreshFinance(processFinanceCompliance(c,c.clock.date));

}

export function upgradeWorkshop(career:CareerState,id:string,key:FactoryKey,costCents:number,days:number){open(career);const m=model(career);if(!Object.hasOwn(m.facilities,key)||!Number.isSafeInteger(costCents)||costCents<=0||!Number.isInteger(days)||days<1||days>730||m.projects.some(p=>p.facility===key&&!['ready','cancelled'].includes(p.status)))throw new Error('Choose a facility, positive quote and duration without an overlapping upgrade.');const dates=workingDates(career.clock.date,days,m.config.summerStart),finish=dates.at(-1)!;

  const c=createManufacturingOrder(career,{id:`workshop-${id}`,managedProjectId:id,name:`${key} facility upgrade`,kind:'facility',counterparty:'Recorded facility contractor',deliveryOn:finish,recognitionOn:finish,specification:key,quantity:1,costs:[{id:'equipment',name:'Approved equipment quote',kind:'external',amountCents:costCents}],instalments:[{id:'approval',date:career.clock.date,amountCents:costCents,nonRefundable:true}],relevantCents:0,assetLifeMonths:60,assetRelevant:true,notes:'Explicit facility quote. Five-year useful life is the game equipment convention; no land or building purchase.'});

  const p:WorkshopProject={id,name:`${key} facility upgrade`,kind:'facility',facility:key,component:'front_wing',targetSeason:c.season.year,focus:'balanced',engineers:0,quantity:1,priority:'normal',createdOn:c.clock.date,plannedFinish:finish,workDates:dates,workDone:0,workDays:days,testing:noTesting(),status:'working',orderId:`workshop-${id}`,costCents,effects:zeroPerformance()};return withModel(c,{...m,projects:[...m.projects,p]});

}

export function repairWorkshopUnit(career:CareerState,id:string,jobId:string,costCents:number,days:number){open(career);const m=model(career),u=unit(career,id),s=m.specifications.find(s=>s.id===u?.specificationId);if(!u||!s||u.state!=='damaged'||!Number.isSafeInteger(costCents)||costCents<=0||!Number.isInteger(days)||days<1||days>365)throw new Error('Choose a damaged unit and an agreed repair cost and duration.');const dates=workingDates(career.clock.date,days,m.config.summerStart),finish=dates.at(-1)!;

  let c=createManufacturingOrder(career,{id:`workshop-${jobId}`,managedProjectId:jobId,name:`Repair ${u.specification}`,kind:'supplier',counterparty:'Workshop repairs',deliveryOn:finish,recognitionOn:career.clock.date,specification:s.id,quantity:1,costs:[{id:'repair',name:'Agreed repair',kind:'external',amountCents:costCents}],instalments:[{id:'approval',date:career.clock.date,amountCents:costCents,nonRefundable:true}],relevantCents:costCents,notes:'Explicit repair; no automatic damage fee'});c=updateManufacturedUnit(c,id,'repair');

  const p:WorkshopProject={id:jobId,name:`Repair ${u.specification}`,kind:'repair',unitId:id,component:s.kind,targetSeason:c.season.year,focus:'durability',engineers:0,quantity:1,priority:'normal',createdOn:c.clock.date,plannedFinish:finish,workDates:dates,workDone:0,workDays:days,testing:noTesting(),status:'queued',orderId:`workshop-${jobId}`,costCents,effects:zeroPerformance()};return withModel(c,{...m,projects:[...m.projects,p]});

}

export function validWorkshop(value:unknown):boolean{

  if(value===undefined)return true;try{const m=value as ManufacturingState;const number=(n:unknown)=>typeof n==='number'&&Number.isFinite(n);const perf=(p:Performance)=>p&&Object.keys(zeroPerformance()).every(k=>number(p[k as keyof Performance]));

    return m.version===1&&m.rulesVersion===OPERATIONAL_RULES&&validContractDate(m.approvedOn)&&validContractDate(m.processedThrough)&&validConfig(m.config)&&!!m.baseline&&teams.every(t=>perf(m.baseline[t.id]))&&!!m.facilities&&['design','production','tunnel','cfd','inspection'].every(k=>Number.isInteger(m.facilities[k as FactoryKey])&&m.facilities[k as FactoryKey]>=1)&&Array.isArray(m.specifications)&&new Set(m.specifications.map(s=>s.id)).size===m.specifications.length&&m.specifications.every(s=>!!s.id&&!!s.name&&!!COMPONENTS[s.kind]&&Number.isInteger(s.version)&&s.version>0&&Number.isInteger(s.eligibleFrom)&&validContractDate(s.createdOn)&&perf(s.effects))&&Array.isArray(m.projects)&&new Set(m.projects.map(p=>p.id)).size===m.projects.length&&m.projects.every(p=>!!p.id&&['design','research','production','repair','facility'].includes(p.kind)&&!!COMPONENTS[p.component]&&['queued','working','ready','cancelled'].includes(p.status)&&Number.isInteger(p.workDone)&&p.workDone>=0&&Number.isInteger(p.workDays)&&p.workDays>=1&&p.workDone<=p.workDays&&Number.isInteger(p.engineers)&&p.engineers>=0&&Number.isInteger(p.quantity)&&p.quantity>0&&Number.isSafeInteger(p.costCents)&&p.costCents>0&&validContractDate(p.createdOn)&&validContractDate(p.plannedFinish)&&Array.isArray(p.workDates)&&p.workDates.every(validContractDate)&&perf(p.effects)&&Object.keys(noTesting()).every(k=>number(p.testing[k as keyof TestingResources])&&p.testing[k as keyof TestingResources]>=0))&&Array.isArray(m.testing)&&new Set(m.testing.map(t=>t.id)).size===m.testing.length&&m.testing.every(t=>Number.isInteger(t.position)&&t.position>=1&&t.position<=11&&Object.keys(noTesting()).every(k=>number(t.usage[k as keyof TestingResources])&&t.usage[k as keyof TestingResources]>=0))&&Array.isArray(m.history)&&m.history.every(h=>validContractDate(h.date)&&typeof h.message==='string')&&Array.isArray(m.pu)&&new Set(m.pu.map(u=>u.id)).size===m.pu.length&&m.pu.every(u=>!!u.id&&!!PU_ALLOWANCES[u.element]&&[1,2].includes(u.car)&&typeof u.supplier==='string'&&u.supplier.length>0&&Number.isInteger(u.season)&&Number.isSafeInteger(u.costCents)&&u.costCents>=0&&number(u.usage)&&u.usage>=0&&typeof u.installed==='boolean'&&(u.introducedOn===undefined||validContractDate(u.introducedOn)));

  }catch{return false;}

}



export function damageWorkshopUnit(c:CareerState,id:string,condition:number,reason:string){

  open(c);const m=model(c),u=unit(c,id);if(carChangeRestriction(c))throw new Error(carChangeRestriction(c)!);if(!u||!Number.isFinite(condition)||condition<0||condition>=100||!reason.trim())throw new Error('Record condition below 100 and a supported damage/inspection reason.');

  const next=updateManufacturedUnit(c,id,'damaged'),b=next.finance!.book!,f=b.manufacturing!;

  return {...next,manufacturing:{...m,history:[...m.history,{date:c.clock.date,message:`Damage: ${id} · ${reason}`}]},finance:{...next.finance!,book:{...b,manufacturing:{...f,units:f.units.map(u=>u.id===id?{...u,condition}:u)}}}};

}

export function scrapWorkshopUnit(c:CareerState,id:string){open(c);if(carChangeRestriction(c))throw new Error(carChangeRestriction(c)!);return refreshFinance(processFinanceCompliance(updateManufacturedUnit(c,id,'scrapped'),c.clock.date));}

export function workshopStage(p:WorkshopProject){if(p.status==='ready')return 'Ready';if(p.status==='cancelled')return 'Cancelled';if(p.lastReason)return p.lastReason;if(['design','research'].includes(p.kind))return p.workDone>=p.workDays-2?'Validation':'Design';return p.status==='queued'?'Queued':'Manufacturing';}

export function carPerformanceScore(p:Performance,trackId:string){

  // Coarse circuit-demand categories are game assumptions, not measured aero maps.

  const slow=['monaco','singapore','hungaroring'].includes(trackId),fast=['silverstone','suzuka','spa-francorchamps'].includes(trackId),straight=['monza','baku','jeddah','las-vegas'].includes(trackId);

  const w=slow?[.30,.15,.05,.10,.25,.10,.05]:fast?[.05,.15,.35,.20,.10,.10,.05]:straight?[.10,.10,.10,.40,.15,.10,.05]:[.15,.20,.20,.20,.10,.10,.05];

  return Math.max(0,Math.min(100,[p.low,p.medium,p.high,p.drag,p.mechanical,p.cooling,p.durability].reduce((n,v,i)=>n+v*w[i],0)-p.mass*.15));

}



export const PU_ALLOWANCES:Record<PowerUnitStock['element'],number>={ICE:4,TC:4,EXH:4,ES:3,CE:3,MGUK:3,ANC:6};

export function recordPowerUnit(c:CareerState,input:Omit<PowerUnitStock,'introducedOn'|'installed'|'usage'|'season'>,relevantCents:number){

  open(c);const m=model(c);if(!input.id||m.pu.some(u=>u.id===input.id)||!Object.hasOwn(PU_ALLOWANCES,input.element)||![1,2].includes(input.car)||!input.supplier.trim()||!Number.isSafeInteger(input.costCents)||input.costCents<0||!Number.isSafeInteger(relevantCents)||relevantCents<0||relevantCents>input.costCents)throw new Error('Record a unique sealed unit, car, supplier, agreed cost and classification.');

  let next=c;

  if(input.costCents)next=createManufacturingOrder(c,{id:`pu-${input.id}`,name:`${input.supplier} ${input.element}`,kind:'supplier',counterparty:input.supplier,deliveryOn:c.clock.date,recognitionOn:c.clock.date,specification:input.element,quantity:1,costs:[{id:'supply',name:'Explicit supply quote',kind:'external',amountCents:input.costCents}],instalments:[{id:'supply',date:c.clock.date,amountCents:input.costCents,nonRefundable:true}],relevantCents,notes:'Recorded customer supply component; classification confirmed by player.'});

  return withModel(next,{...m,pu:[...m.pu,{...input,season:c.season.year,installed:false,usage:0}],history:[...m.history,{date:c.clock.date,message:`Supplier unit ${input.id} received${input.costCents?'':' · included in existing supply; no extra purchase'}`} ]});

}

export function installPowerUnit(c:CareerState,id:string){open(c);const m=model(c),unit=m.pu.find(u=>u.id===id);if(!unit||unit.season!==c.season.year)throw new Error('Choose a unit registered for this season.');const restriction=carChangeRestriction(c);if(restriction)throw new Error(restriction);

  const introduced=m.pu.filter(u=>u.season===unit.season&&u.car===unit.car&&u.element===unit.element&&u.introducedOn).length;

  if(!unit.introducedOn&&introduced>=PU_ALLOWANCES[unit.element])throw new Error('This change requires a sporting penalty or an approved allowance exception. Ordinary fitting only is supported; keep a previously used eligible unit.');

  return withModel(c,{...m,pu:m.pu.map(u=>u.id===id?{...u,installed:true}:u.car===unit.car&&u.element===unit.element?{...u,installed:false}:u)});

}

export function recordWorkshopDistance(c:CareerState,sessionId:string,distances:Partial<Record<1|2,number>>){const m=c.manufacturing;if(!m||m.history.some(h=>h.message===`Distance: ${sessionId}`))return c;

  const b=c.finance!.book!,f=b.manufacturing!;

  const units=f.units.map(u=>{if(u.state!=='installed'||!u.car)return u;const km=Math.max(0,distances[u.car]??0),durability=carPerformance(c,c.player.teamId,u.car)?.durability??70;return {...u,condition:Math.max(0,(u.condition??100)-km/1000*(1+(100-durability)/100))};});

  return {...c,manufacturing:{...m,pu:m.pu.map(u=>u.installed&&u.season===c.season.year?{...u,introducedOn:u.introducedOn??c.clock.date,usage:u.usage+Math.max(0,distances[u.car]??0)}:u),history:[...m.history,{date:c.clock.date,message:`Distance: ${sessionId}`}]},finance:{...c.finance!,book:{...b,manufacturing:{...f,units}}}};

}


export function validWorkshopLinks(c:CareerState):boolean{const m=c.manufacturing;if(!m)return true;const f=c.finance?.book?.manufacturing;if(!f)return false;
  const located=new Set<string>();
  for(const u of f.units.filter(u=>u.specificationId)){const spec=m.specifications.find(s=>s.id===u.specificationId);if(!spec)return false;if(u.car){if(u.state!=='installed')return false;const slot=`${u.car}:${spec.kind}`;if(located.has(slot))return false;located.add(slot);}}
  return m.projects.every(p=>f.orders.some(o=>o.id===p.orderId&&o.managedProjectId===p.id))&&m.specifications.every(s=>!s.projectId||m.projects.some(p=>p.id===s.projectId&&p.status==='ready'));
}
