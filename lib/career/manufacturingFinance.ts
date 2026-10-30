import {checkNewFinanceCommitments} from './financeOperations';
import type {CareerState} from './types';
import type {FinanceAsset,FinanceBook,FinanceObligation} from './financeTypes';
import {assessFinancialCommitment,initializeFinance,processFinance} from './financeEngine';
import {validContractDate} from './negotiation';

export type ManufacturingOrderKind='research'|'design'|'production'|'facility'|'supplier'|'travel';
export type ManufacturingCostKind='external'|'materials'|'tooling'|'overtime'|'testing'|'staff_allocation';
export type ManufacturingCost={id:string;name:string;kind:ManufacturingCostKind;amountCents:number;staffEntryId?:string};
export type ManufacturingInstalment={id:string;date:string;amountCents:number;nonRefundable:boolean};
export type ManufacturingOrder={
  id:string;name:string;kind:ManufacturingOrderKind;counterparty:string;createdOn:string;deliveryOn:string;recognitionOn:string;
  specification:string;quantity:number;costs:ManufacturingCost[];instalments:ManufacturingInstalment[];
  relevantCents:number;status:'ordered'|'delivered'|'cancelled';cancelledOn?:string;deliveredOn?:string;
  capModel?:2; manufactureStartedOn?:string; specificationId?:string; managedProjectId?:string;
  assetLifeMonths?:number;assetResidualCents?:number;assetRelevant?:boolean;notes:string;
};
export type ManufacturedUnit={id:string;orderId:string;specification:string;costCents:number;state:'inspection'|'available'|'installed'|'damaged'|'repair'|'scrapped';changedOn:string;expensed?:boolean;opening?:boolean;specificationId?:string;car?:1|2;condition?:number;firstUsedOn?:string;redundantOn?:string};
export type ManufacturingAudit={id:string;date:string;orderId:string;action:string};
export type ManufacturingFinanceState={version:1;orders:ManufacturingOrder[];units:ManufacturedUnit[];audit:ManufacturingAudit[]};

type ManufacturingBook=FinanceBook&{manufacturing?:ManufacturingFinanceState};
const amount=(value:number)=>Number.isSafeInteger(value)&&value>=0;
const kinds:ManufacturingOrderKind[]=['research','design','production','facility','supplier','travel'];
const costKinds:ManufacturingCostKind[]=['external','materials','tooling','overtime','testing','staff_allocation'];
const unitStates:ManufacturedUnit['state'][]=['inspection','available','installed','damaged','repair','scrapped'];
const stateOf=(career:CareerState)=>(career.finance?.book as ManufacturingBook|undefined)?.manufacturing;
const cashCost=(order:Pick<ManufacturingOrder,'costs'>)=>order.costs.filter(c=>c.kind!=='staff_allocation').reduce((sum,c)=>sum+c.amountCents,0);
const allocatedCost=(order:Pick<ManufacturingOrder,'costs'>)=>order.costs.filter(c=>c.kind==='staff_allocation').reduce((sum,c)=>sum+c.amountCents,0);
function assertOpen(career:CareerState,on=career.clock.date){
  if(career.finance?.book?.operations?.periods.some(p=>p.year===Number(on.slice(0,4))))throw new Error('This financial reporting period is closed. Record changes in an open period.');
}
function withState(career:CareerState,manufacturing:ManufacturingFinanceState):CareerState {
  return {...career,finance:{...career.finance!,book:{...career.finance!.book!,manufacturing} as ManufacturingBook}};
}

export function initializeManufacturingFinance(career:CareerState):CareerState {
  const ready=initializeFinance(career);
  return stateOf(ready)?ready:withState(ready,{version:1,orders:[],units:[],audit:[]});
}
export function manufacturingSummary(career:CareerState){
  const state=stateOf(career)??{version:1 as const,orders:[],units:[],audit:[]};
  return {...state,committedCents:state.orders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+cashCost(o),0),allocatedStaffCents:state.orders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+allocatedCost(o),0)};
}
export function manufacturingScheduleDates(career:CareerState):string[]{
  return [...new Set((stateOf(career)?.orders??[]).filter(o=>o.status==='ordered').flatMap(o=>[o.deliveryOn,...o.instalments.map(i=>i.date)]))].sort();
}

/** Recognise a recorded order at delivery; instalment payment dates may precede it. */
export function createManufacturingOrder(career:CareerState,input:Omit<ManufacturingOrder,'createdOn'|'status'|'deliveredOn'|'cancelledOn'>):CareerState {
  let state=initializeManufacturingFinance(career);const m=stateOf(state)!;
  assertOpen(state);assertOpen(state,input.recognitionOn);
  if(!input.id||!input.name.trim()||!input.counterparty.trim()||!kinds.includes(input.kind)||!validContractDate(input.deliveryOn)||!validContractDate(input.recognitionOn)||input.deliveryOn<state.clock.date||input.recognitionOn<state.clock.date)throw new Error('Record an order name, supplier and valid future delivery/recognition dates.');
  if(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>10000||(input.kind==='production'&&!input.specification.trim()))throw new Error('Production requires a specification and a quantity from 1 to 10,000.');
  if(!Array.isArray(input.costs)||!input.costs.length||new Set(input.costs.map(c=>c.id)).size!==input.costs.length||input.costs.some(c=>!c.id||!c.name.trim()||!costKinds.includes(c.kind)||!amount(c.amountCents)))throw new Error('Record a valid cost breakdown in whole cents.');
  const total=cashCost(input),allocation=allocatedCost(input);
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(allocation)||total+allocation<=0)throw new Error('The order needs a recorded external cost or a staff allocation.');
  if(!amount(input.relevantCents)||input.relevantCents>total)throw new Error('Relevant new costs cannot exceed the new cash cost; allocated payroll is already recognised.');
  if(input.assetLifeMonths!==undefined&&(!Number.isInteger(input.assetLifeMonths)||input.assetLifeMonths<1||input.assetLifeMonths>600||input.kind!=='facility'))throw new Error('A facility asset requires a useful life from 1 to 600 months.');
  if(input.assetLifeMonths!==undefined&&input.relevantCents!==0)throw new Error('Capital assets use depreciation; the purchase itself must have zero immediate relevant cost.');
  if(input.assetLifeMonths!==undefined&&typeof input.assetRelevant!=='boolean')throw new Error('Record whether this asset depreciation is relevant to the cost cap.');
  if(input.assetResidualCents!==undefined&&(!amount(input.assetResidualCents)||input.assetResidualCents>total))throw new Error('Residual value cannot exceed acquisition cost.');
  if(!Array.isArray(input.instalments)||new Set(input.instalments.map(i=>i.id)).size!==input.instalments.length||input.instalments.some(i=>!i.id||!validContractDate(i.date)||i.date<state.clock.date||!amount(i.amountCents)||i.amountCents===0||typeof i.nonRefundable!=='boolean')||input.instalments.reduce((sum,i)=>sum+i.amountCents,0)!==total)throw new Error('Instalments must add up exactly to external costs and use today or future dates.');
  const existing=m.orders.find(o=>o.id===input.id);
  if(existing){const {createdOn,status,deliveredOn,cancelledOn,...terms}=existing;if(JSON.stringify(terms)!==JSON.stringify(input))throw new Error('An order with this ID already exists with different terms.');return state;}
  for(const cost of input.costs.filter(c=>c.kind==='staff_allocation')){
    const entry=state.finance!.book!.entries.find(e=>e.id===cost.staffEntryId&&e.category==='staff_pay'&&e.kind!=='payment');
    if(!entry)throw new Error('Choose a recognised staff-payroll entry before allocating existing wages.');
    const previous=m.orders.filter(o=>o.status!=='cancelled').flatMap(o=>o.costs).filter(c=>c.staffEntryId===entry.id).reduce((sum,c)=>sum+c.amountCents,0);
    const proposed=input.costs.filter(c=>c.staffEntryId===entry.id).reduce((sum,c)=>sum+c.amountCents,0);
    const recognised=entry.relevantCents+entry.excludedCents;
    if(previous+proposed>recognised)throw new Error('This staff cost is already allocated; allocation cannot exceed recognised payroll.');
  }
  const order:ManufacturingOrder={...structuredClone(input),createdOn:state.clock.date,status:'ordered'};
  let allocated=0;const obligations:FinanceObligation[]=input.instalments.map((i,index)=>{
    const cumulative=Math.round(input.relevantCents*input.instalments.slice(0,index+1).reduce((sum,p)=>sum+p.amountCents,0)/Math.max(1,total));
    const relevant=cumulative-allocated;allocated=cumulative;
    return {id:`manufacturing:${input.id}:${i.id}`,sourceId:`manufacturing:${input.id}`,description:`${input.name} · instalment ${index+1}`,counterparty:input.counterparty,category:input.assetLifeMonths?'capital':input.kind==='production'?'production':input.kind==='facility'?'facilities':input.kind==='travel'?'travel':input.kind==='supplier'?'other':'development',recognitionDate:input.recognitionOn,dueDate:i.date,amountCents:-i.amountCents,relevantCents:input.capModel===2&&input.kind==='production'?0:relevant,account:input.assetLifeMonths?'fixed_assets':input.kind==='production'?'inventory':'expenses',basis:'career_action'};
  });
  const duplicate=obligations.find(o=>state.finance!.book!.obligations.some(p=>p.id===o.id));if(duplicate)throw new Error('The order payment IDs are already in use.');
  const asset:FinanceAsset|undefined=input.assetLifeMonths?{id:`manufacturing:${input.id}`,name:input.name,acquiredOn:input.deliveryOn,costCents:total,lifeMonths:input.assetLifeMonths,relevant:input.assetRelevant!,residualCents:input.assetResidualCents??0}:undefined;
  state=withState(state,{...m,orders:[...m.orders,order],audit:[...m.audit,{id:`created:${input.id}`,date:state.clock.date,orderId:input.id,action:'Order authorised with explicit costs and payment schedule'}]});
  state={...state,finance:{...state.finance!,book:{...state.finance!.book!,obligations:[...state.finance!.book!.obligations,...obligations],assets:[...state.finance!.book!.assets,...(asset?[asset]:[])]}}};
  // New obligations are already in the proposed forecast; check them once as a package.
  checkNewFinanceCommitments(state);const issues=assessFinancialCommitment(state,0,0,state.clock.date);if(issues.length)throw new Error(issues.join(' '));
  return processFinance(processManufacturingFinance(state,state.clock.date));
}

/** Pure calendar hook: never invoke the finance processor recursively. */
export function processManufacturingFinance(career:CareerState,date:string):CareerState {
  const m=stateOf(career);if(!m)return career;
  if(!validContractDate(date))throw new Error('Choose a valid manufacturing processing date.');
  const due=m.orders.filter(o=>o.status==='ordered'&&o.deliveryOn<=date&&(!o.managedProjectId||career.manufacturing?.projects.some(p=>p.id===o.managedProjectId&&p.status==='ready')));
  if(!due.length)return career;
  let units=[...m.units];
  for(const o of due)if(o.kind==='production'&&!units.some(u=>u.orderId===o.id)){
    const credits=career.finance!.book!.obligations.filter(i=>i.sourceId===`manufacturing-credit:${o.id}`).reduce((sum,i)=>sum+i.amountCents,0);
    const total=cashCost(o)+allocatedCost(o)-credits;let allocated=0;
    for(let i=0;i<o.quantity;i++){const cumulative=Math.round(total*(i+1)/o.quantity),cost=cumulative-allocated;allocated=cumulative;units.push({id:`${o.id}:unit:${i+1}`,orderId:o.id,specification:o.specification,costCents:cost,specificationId:o.specificationId,condition:100,state:'inspection',changedOn:o.deliveryOn});}
  }
  const ids=new Set(due.map(o=>o.id)),book=career.finance!.book!;
  const entries=[...book.entries];
  for(const o of due){const allocation=allocatedCost(o);if(o.kind==='production'&&allocation&&!entries.some(e=>e.id===`staff-allocation:${o.id}`))entries.push({id:`staff-allocation:${o.id}`,sourceId:`manufacturing:${o.id}`,date:o.deliveryOn,description:`${o.name} · existing payroll allocated to inventory`,category:'production',cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[{account:'inventory',debitCents:allocation,creditCents:0},{account:'expenses',debitCents:0,creditCents:allocation}]});}
  return withState({...career,finance:{...career.finance!,book:{...book,entries}}},{...m,orders:m.orders.map(o=>ids.has(o.id)?{...o,status:'delivered',deliveredOn:o.deliveryOn}:o),units,audit:[...m.audit,...due.map(o=>({id:`delivered:${o.id}`,date:o.deliveryOn,orderId:o.id,action:o.kind==='production'?'Production received into inspection':'Recorded work delivered / facility commissioned'}))]});
}

/** Cancellation releases only future cancellable instalments; settled records remain intact. */
export function cancelManufacturingOrder(career:CareerState,id:string):CareerState {
  const state=initializeManufacturingFinance(career),m=stateOf(state)!,order=m.orders.find(o=>o.id===id);
  if(!order)throw new Error('The order does not exist.');
  if(order.status==='cancelled')return state;
  assertOpen(state);
  if(order.status==='delivered'||order.deliveryOn<=state.clock.date)throw new Error('Delivered work cannot be cancelled; record a supplier credit or asset disposal.');
  const book=state.finance!.book!,posted=new Set(book.entries.map(e=>e.id));
  const release=new Set(order.instalments.filter(i=>!i.nonRefundable&&i.date>state.clock.date&&!posted.has(`manufacturing:${id}:${i.id}:payment`)&&!posted.has(`manufacturing:${id}:${i.id}:recognition`)).map(i=>`manufacturing:${id}:${i.id}`));
  const obligations=book.obligations.filter(o=>!release.has(o.id)).map(o=>o.sourceId===`manufacturing:${id}`?{...o,recognitionDate:o.recognitionDate>state.clock.date?state.clock.date:o.recognitionDate,account:'expenses' as const,...(order.assetLifeMonths?{category:'facilities' as const,relevantCents:order.assetRelevant?-o.amountCents:0}:{})}:o);
  const recognisedAsset=book.entries.filter(e=>e.sourceId===`manufacturing:${id}`).flatMap(e=>e.accountLines??[]).filter(l=>l.account==='inventory'||l.account==='fixed_assets').reduce((sum,l)=>sum+l.debitCents-l.creditCents,0);
  const from=order.assetLifeMonths?'fixed_assets' as const:'inventory' as const;
  const adjustment=recognisedAsset>0?[{id:`manufacturing-cancel:${id}`,sourceId:`manufacturing:${id}`,date:state.clock.date,description:`${order.name} · cancellation cost recognised`,category:'facilities' as const,cashCents:0,relevantCents:order.assetLifeMonths&&order.assetRelevant?recognisedAsset:0,excludedCents:order.assetLifeMonths&&!order.assetRelevant?recognisedAsset:0,kind:'adjustment' as const,basis:'career_action' as const,accountLines:[{account:'expenses' as const,debitCents:recognisedAsset,creditCents:0},{account:from,debitCents:0,creditCents:recognisedAsset}]}]:[];
  return processFinance(withState({...state,finance:{...state.finance!,book:{...book,obligations,entries:[...book.entries,...adjustment],assets:book.assets.filter(a=>a.id!==`manufacturing:${id}`)}}},{...m,orders:m.orders.map(o=>o.id===id?{...o,status:'cancelled',cancelledOn:state.clock.date}:o),audit:[...m.audit,{id:`cancelled:${id}`,date:state.clock.date,orderId:id,action:`Cancelled; ${release.size} future cancellable instalment(s) released; paid and non-refundable obligations retained`}]}));
}

/** Supplier credits require an explicit amount and reason, bounded by recorded settlement. */
export function creditManufacturingOrder(career:CareerState,id:string,creditId:string,amountCents:number,reason:string):CareerState {
  const state=initializeManufacturingFinance(career),m=stateOf(state)!,order=m.orders.find(o=>o.id===id),book=state.finance!.book!;
  assertOpen(state);
  if(!order||!creditId||!amount(amountCents)||!amountCents||!reason.trim())throw new Error('Record an order, unique credit ID, positive amount and credit reason.');
  const obligationId=`manufacturing-credit:${id}:${creditId}`;
  const existing=book.obligations.find(o=>o.id===obligationId);
  if(existing){if(existing.amountCents!==amountCents||existing.description!==`${order.name} · supplier credit: ${reason}`)throw new Error('This supplier credit ID already exists with different terms.');return state;}
  const paid=-book.entries.filter(e=>e.sourceId===`manufacturing:${id}`).reduce((sum,e)=>sum+e.cashCents,0);
  const credited=book.obligations.filter(o=>o.sourceId===`manufacturing-credit:${id}`).reduce((sum,o)=>sum+o.amountCents,0);
  if(credited+amountCents>paid)throw new Error('Supplier credits cannot exceed the amount already paid.');
  const obligation:FinanceObligation={id:obligationId,sourceId:`manufacturing-credit:${id}`,description:`${order.name} · supplier credit: ${reason}`,counterparty:order.counterparty,category:'other',recognitionDate:state.clock.date,dueDate:state.clock.date,amountCents,relevantCents:0,account:order.status==='cancelled'?'expenses':order.assetLifeMonths?'fixed_assets':order.kind==='production'?'inventory':'expenses',basis:'career_action'};
  // A credit reverses applicable recognised expense, not merely the bank payment.
  const recognised=book.entries.filter(e=>e.sourceId===`manufacturing:${id}`).reduce((sum,e)=>sum+e.relevantCents,0);
  const priorReversal=-book.entries.filter(e=>e.sourceId===`manufacturing-credit:${id}`).reduce((sum,e)=>sum+e.relevantCents,0);
  const retained=book.obligations.filter(o=>o.sourceId===`manufacturing:${id}`),retainedTotal=retained.reduce((sum,o)=>sum-o.amountCents,0),retainedRelevant=retained.reduce((sum,o)=>sum+o.relevantCents,0);
  const reversal=Math.min(Math.max(0,recognised-priorReversal),Math.round((order.status==='cancelled'?retainedRelevant/Math.max(1,retainedTotal):order.relevantCents/Math.max(1,cashCost(order)))*amountCents));
  const entry={id:`${obligationId}:adjustment`,sourceId:obligation.sourceId,date:state.clock.date,description:obligation.description,category:'other' as const,cashCents:0,relevantCents:-reversal,excludedCents:0,kind:'adjustment' as const,basis:'career_action' as const};
  const asset=book.assets.find(a=>a.id===`manufacturing:${id}`);
  const assets=book.assets.map(a=>a.id===asset?.id?{...a,costCents:Math.max(0,a.costCents-amountCents),residualCents:Math.min(a.residualCents??0,Math.max(0,a.costCents-amountCents))}:a);
  const depreciationEntries=[];
  if(asset&&asset.relevant){
    // Correct already recognised depreciation explicitly; future instalments use the reduced basis.
    const month=(s:string)=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
    const months=Math.max(0,Math.min(asset.lifeMonths,month(state.clock.date)-month(asset.acquiredOn)+(state.clock.date===new Date(Date.UTC(Number(state.clock.date.slice(0,4)),Number(state.clock.date.slice(5,7)),0)).toISOString().slice(0,10)?1:0)));
    const source=`asset:${asset.id}`,posted=book.entries.filter(e=>e.sourceId===source).reduce((sum,e)=>sum+e.relevantCents,0);
    const reduced=assets.find(a=>a.id===asset.id)!;
    const should=Math.round((reduced.costCents-(reduced.residualCents??0))*months/asset.lifeMonths),adjustment=Math.min(0,should-posted);
    if(adjustment)depreciationEntries.push({...entry,id:`${obligationId}:depreciation`,sourceId:source,description:`${order.name} · depreciation correction for supplier credit`,category:'depreciation' as const,relevantCents:adjustment,accountLines:[{account:'accumulated_depreciation' as const,debitCents:-adjustment,creditCents:0},{account:'expenses' as const,debitCents:0,creditCents:-adjustment}]});
  }
  const orderUnits=m.units.filter(u=>u.orderId===id);let reduction=0,expenseReversal=0;
  const units=m.units.map(u=>{const index=orderUnits.findIndex(p=>p.id===u.id);if(index<0)return u;const cumulative=Math.round(amountCents*(index+1)/orderUnits.length),delta=cumulative-reduction;reduction=cumulative;if(u.expensed)expenseReversal+=delta;return {...u,costCents:u.costCents-delta};});
  const reclass=expenseReversal?[{...entry,id:`${obligationId}:inventory-credit`,relevantCents:0,accountLines:[{account:'inventory' as const,debitCents:expenseReversal,creditCents:0},{account:'expenses' as const,debitCents:0,creditCents:expenseReversal}]}]:[];
  return processFinance(withState({...state,finance:{...state.finance!,book:{...book,assets,obligations:[...book.obligations,obligation],entries:[...book.entries,entry,...depreciationEntries,...reclass]}}},{...m,units,audit:[...m.audit,{id:obligationId,date:state.clock.date,orderId:id,action:`Supplier credit recorded: ${reason}`}]}));
}

export function updateManufacturedUnit(career:CareerState,id:string,next:ManufacturedUnit['state']):CareerState {
  const state=initializeManufacturingFinance(career),m=stateOf(state)!,unit=m.units.find(u=>u.id===id);
  assertOpen(state);
  if(!unit||!unitStates.includes(next))throw new Error('Choose an existing manufactured unit and supported state.');
  if(next===unit.state)return state;
  const transitions:Record<ManufacturedUnit['state'],ManufacturedUnit['state'][]>= {inspection:['available','damaged','scrapped'],available:['installed','damaged','scrapped'],installed:['available','damaged','scrapped'],damaged:['repair','scrapped'],repair:['inspection','scrapped'],scrapped:[]};
  if(!transitions[unit.state].includes(next))throw new Error(`A ${unit.state} unit cannot move directly to ${next}.`);
  const order=m.orders.find(o=>o.id===unit.orderId);
  const consume=(next==='installed'&&order?.capModel!==2||next==='scrapped')&&!unit.expensed,restore=false;
  const expensed=consume?true:restore?false:unit.expensed??false;
  const entries=[...state.finance!.book!.entries];
  if(consume||restore)entries.push({id:`unit-allocation:${id}:${m.audit.length}`,sourceId:`manufacturing-unit:${id}`,date:state.clock.date,description:`${unit.specification} · ${consume?'inventory consumed':'removed unit returned to inventory'}`,category:'production',cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:consume?[{account:'expenses',debitCents:unit.costCents,creditCents:0},{account:'inventory',debitCents:0,creditCents:unit.costCents}]:[{account:'inventory',debitCents:unit.costCents,creditCents:0},{account:'expenses',debitCents:0,creditCents:unit.costCents}]});
  return withState({...state,finance:{...state.finance!,book:{...state.finance!.book!,entries}}},{...m,units:m.units.map(u=>u.id===id?{...u,state:next,changedOn:state.clock.date,expensed,...(next!=='installed'?{car:undefined}:{}),...(next==='scrapped'?{redundantOn:unit.redundantOn??state.clock.date}:{})}:u),audit:[...m.audit,{id:`unit:${id}:${m.audit.length}`,date:state.clock.date,orderId:unit.orderId,action:`${unit.specification}: ${unit.state} → ${next}`} ]});
}

export function validManufacturingFinance(value:unknown):boolean {
  if(value===undefined)return true;
  if(!value||typeof value!=='object')return false;
  const m=value as ManufacturingFinanceState;
  try {
    if(m.version!==1||!Array.isArray(m.orders)||!Array.isArray(m.units)||!Array.isArray(m.audit))return false;
    const validOrders=m.orders.every(o=>{
      if(!o||typeof o.id!=='string'||!o.id||typeof o.name!=='string'||!o.name||typeof o.counterparty!=='string'||!kinds.includes(o.kind))return false;
      if(o.capModel!==undefined&&o.capModel!==2||o.manufactureStartedOn!==undefined&&!validContractDate(o.manufactureStartedOn)||o.managedProjectId!==undefined&&typeof o.managedProjectId!=='string'||o.specificationId!==undefined&&typeof o.specificationId!=='string')return false;
      if(!validContractDate(o.createdOn)||!validContractDate(o.deliveryOn)||!validContractDate(o.recognitionOn)||o.deliveryOn<o.createdOn||o.recognitionOn<o.createdOn)return false;
      if(!Number.isInteger(o.quantity)||o.quantity<1||o.quantity>10000||!['ordered','delivered','cancelled'].includes(o.status)||typeof o.specification!=='string'||typeof o.notes!=='string'||!amount(o.relevantCents))return false;
      if(!Array.isArray(o.costs)||!o.costs.every(c=>!!c&&typeof c.id==='string'&&typeof c.name==='string'&&costKinds.includes(c.kind)&&amount(c.amountCents)&&(c.kind!=='staff_allocation'||typeof c.staffEntryId==='string'))||new Set(o.costs.map(c=>c.id)).size!==o.costs.length)return false;
      if(o.assetLifeMonths!==undefined&&(o.kind!=='facility'||!Number.isInteger(o.assetLifeMonths)||o.assetLifeMonths<1||o.assetLifeMonths>600||o.relevantCents!==0||typeof o.assetRelevant!=='boolean'))return false;
      if(o.assetResidualCents!==undefined&&(!amount(o.assetResidualCents)||o.assetResidualCents>cashCost(o)))return false;
      if(!Array.isArray(o.instalments)||!o.instalments.every(i=>!!i&&typeof i.id==='string'&&validContractDate(i.date)&&i.date>=o.createdOn&&amount(i.amountCents)&&typeof i.nonRefundable==='boolean')||new Set(o.instalments.map(i=>i.id)).size!==o.instalments.length)return false;
      return Number.isSafeInteger(cashCost(o))&&Number.isSafeInteger(allocatedCost(o))&&cashCost(o)+allocatedCost(o)>0&&o.instalments.reduce((sum,i)=>sum+i.amountCents,0)===cashCost(o)&&o.relevantCents<=cashCost(o);
    });
    return validOrders&&new Set(m.orders.map(o=>o.id)).size===m.orders.length
      &&new Set(m.units.map(u=>u.id)).size===m.units.length&&m.units.every(u=>!!u&&typeof u.id==='string'&&(u.opening===true&&u.orderId==='opening-workshop'&&u.costCents===0||m.orders.some(o=>o.id===u.orderId&&o.kind==='production'&&o.status==='delivered'))&&typeof u.specification==='string'&&amount(u.costCents)&&unitStates.includes(u.state)&&validContractDate(u.changedOn)&&(u.expensed===undefined||typeof u.expensed==='boolean')&&(u.car===undefined||u.car===1||u.car===2)&&(u.condition===undefined||Number.isFinite(u.condition)&&u.condition>=0&&u.condition<=100)&&(u.firstUsedOn===undefined||validContractDate(u.firstUsedOn))&&(u.redundantOn===undefined||validContractDate(u.redundantOn)))
      &&m.orders.filter(o=>o.kind==='production'&&o.status==='delivered').every(o=>m.units.filter(u=>u.orderId===o.id).length===o.quantity)
      &&m.audit.every(a=>!!a&&typeof a.id==='string'&&typeof a.orderId==='string'&&validContractDate(a.date)&&typeof a.action==='string');
  }catch{return false;}
}
