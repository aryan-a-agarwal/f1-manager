import type {CareerState} from './types';

import type {FinanceObligation,FinanceEntry} from './financeTypes';



/** Regulatory adjustments never mutate accounting entries or bank movements. */

export function processFinanceCompliance(career:CareerState,on:string):CareerState {

  const book=career.finance?.book;if(!book)return career;

  const year=Number(on.slice(0,4));

  if(book.operations?.periods.some(p=>p.year===year))return career;

  const entries=[...book.entries];

  const adjust=(sourceId:string,target:number,description:string)=>{

    const existing=entries.filter(e=>e.sourceId===sourceId&&e.date.startsWith(String(year))).reduce((s,e)=>s+e.relevantCents,0);

    const delta=target-existing;if(!delta)return;

    entries.push({id:`${sourceId}:${year}:${entries.length}`,sourceId,date:on,description,category:'other',cashCents:0,relevantCents:delta,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[]} satisfies FinanceEntry);

  };

  for(const asset of book.assets){

    const posted=entries.filter(e=>e.sourceId===`asset:${asset.id}`&&e.category==='depreciation'&&e.kind==='recognition'&&e.date.startsWith(String(year)));

    // Book residual value is retained. Regulatory depreciation has a zero residual.

    const start=new Date((asset.depreciationStartOn??asset.acquiredOn)+'T00:00:00Z');

    const basis=asset.costCents-(asset.regulatoryAccumulatedCents??asset.openingAccumulatedCents??0);

    const difference=asset.relevant?posted.reduce((sum,e)=>{const d=new Date(e.date+'T00:00:00Z'),i=(d.getUTCFullYear()-start.getUTCFullYear())*12+d.getUTCMonth()-start.getUTCMonth();return sum+Math.round(basis*(i+1)/asset.lifeMonths)-Math.round(basis*i/asset.lifeMonths);},0)-entries.filter(e=>e.sourceId===`asset:${asset.id}`&&e.category==='depreciation'&&e.date.startsWith(String(year))).reduce((n,e)=>n+e.relevantCents,0):0;

    adjust(`cap:depreciation:${asset.id}`,difference,`${asset.name} · regulatory depreciation bridge (D6.1.1.k)`);

  }

  if(book.operations?.personnelCoverage){

    const totals=new Map<string,number>(),eligible=new Set<string>();

    for(const staff of book.personnel?.staff??[]){if(staff.relevantPercent>0)eligible.add(staff.personId);for(const e of entries.filter(e=>e.sourceId===`staff:${staff.id}`&&e.date.startsWith(String(year))&&e.kind!=='payment'))totals.set(staff.personId,(totals.get(staff.personId)??0)+e.relevantCents+e.excludedCents);}

    const excluded=new Set([...totals].filter(([id])=>eligible.has(id)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3).map(([id])=>id));

    let target=0;for(const staff of book.personnel?.staff??[])if(excluded.has(staff.personId))target-=entries.filter(e=>e.sourceId===`staff:${staff.id}`&&e.date.startsWith(String(year))).reduce((s,e)=>s+e.relevantCents,0);

    adjust('cap:excluded-personnel',target,'Annual highest-paid eligible personnel exclusion · D5.1.1.d');

  }

  else adjust('cap:excluded-personnel',0,'Personnel exclusion removed pending complete payroll review');

  const manufacturing=book.manufacturing;

  let units=manufacturing?.units??[];

  if(manufacturing){

    units=units.map(u=>{const order=manufacturing.orders.find(o=>o.id===u.orderId);return order?.capModel===2&&!u.firstUsedOn&&!u.redundantOn&&Number((order.manufactureStartedOn??order.createdOn).slice(0,4))<year?{...u,redundantOn:order.deliveryOn>`${year}-01-01`?order.deliveryOn:`${year}-01-01`}:u;});

    units=units.map(u=>{if(!u.expensed&&(u.firstUsedOn&&u.firstUsedOn<=on||u.redundantOn&&u.redundantOn<=on)){entries.push({id:`inventory-consumed:${u.id}`,sourceId:`manufacturing-unit:${u.id}`,date:u.firstUsedOn&&u.firstUsedOn<=on?u.firstUsedOn:u.redundantOn!,description:`${u.specification} · first use / write-off`,category:'production',cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[{account:'expenses',debitCents:u.costCents,creditCents:0},{account:'inventory',debitCents:0,creditCents:u.costCents}]});return {...u,expensed:true};}return u;});

    for(const order of manufacturing.orders.filter(o=>o.capModel===2&&o.kind==='production')){

      const own=units.filter(u=>u.orderId===order.id),cash=order.costs.filter(c=>c.kind!=='staff_allocation').reduce((s,c)=>s+c.amountCents,0),allocation=order.costs.filter(c=>c.kind==='staff_allocation').reduce((s,c)=>s+c.amountCents,0);

      let target=0;

      if(order.status==='cancelled'&&order.cancelledOn?.startsWith(String(year)))target=Math.max(0,entries.filter(e=>e.sourceId===`manufacturing:${order.id}`&&e.kind==='recognition').reduce((n,e)=>n+e.excludedCents,0)-book.obligations.filter(o=>o.sourceId===`manufacturing-credit:${order.id}`).reduce((n,o)=>n+o.amountCents,0));

      for(const u of own){const amount=Math.round(u.costCents*order.relevantCents/Math.max(1,cash+allocation));

        if(u.firstUsedOn?.startsWith(String(year)))target+=amount;

        if(u.redundantOn?.startsWith(String(year))&&!u.firstUsedOn?.startsWith(String(year)))target+=amount;

      }

      const wipSource=`cap:wip:${order.id}`;
      const previousWip=entries.filter(e=>e.sourceId===wipSource).reduce((n,e)=>n+e.relevantCents,0);
      if(order.status==='ordered'&&order.manufactureStartedOn&&Number(order.manufactureStartedOn.slice(0,4))<year&&!previousWip){
        const paid=Math.max(0,-entries.filter(e=>e.sourceId===`manufacturing:${order.id}`&&e.date<`${year}-01-01`).reduce((n,e)=>n+e.cashCents,0));
        adjust(wipSource,Math.round(paid*order.relevantCents/Math.max(1,cash)),`${order.name} · prior-year work in progress review; paid conversion cost basis`);
      }
      const recognisedWip=entries.filter(e=>e.sourceId===wipSource&&e.date.startsWith(String(year))).reduce((n,e)=>n+e.relevantCents,0);
      target=Math.max(0,target-recognisedWip);
      adjust(`cap:inventory:${order.id}`,target,`${order.name} · inventory use / redundancy assessment (2027 rules)`);

    }

  }

  return {...career,finance:{...career.finance!,book:{...book,entries,...(manufacturing?{manufacturing:{...manufacturing,units}}:{})}}};

}



export function confirmPersonnelCoverage(career:CareerState,confirmed:boolean):CareerState {

  const book=career.finance!.book!;

  if(!book.operations)throw new Error('Set up financial records first.');
  if(book.operations.periods.some(p=>p.year===Number(career.clock.date.slice(0,4))))throw new Error('This financial year is closed.');

  return processFinanceCompliance({...career,finance:{...career.finance!,book:{...book,operations:{...book.operations,personnelCoverage:confirmed}}}},career.clock.date);

}



export function recordCapDetermination(career:CareerState,year:number,carryForwardCents:number,reference:string):CareerState {

  if(!Number.isInteger(year)||year<career.season.year||!Number.isSafeInteger(carryForwardCents)||carryForwardCents<0||!reference.trim())throw new Error('Record a valid year, amount and determination reference.');

  const book=career.finance!.book!,operations=book.operations!;
  if(operations.periods.some(p=>p.year===year))throw new Error('This financial year is closed.');

  return {...career,finance:{...career.finance!,book:{...book,operations:{...operations,ruleDeterminations:[...(operations.ruleDeterminations??[]).filter(d=>d.year!==year),{year,date:career.clock.date,carryForwardCents,reference}]}}}};

}



export function financeReconciliation(career:CareerState){

  const book=career.finance!.book!;

  const unbalanced=book.entries.filter(e=>e.accountLines?.reduce((s,l)=>s+l.debitCents-l.creditCents,0));

  const legacy=book.entries.filter(e=>!e.accountLines);

  const duplicate=book.entries.length-new Set(book.entries.map(e=>e.id)).size;

  return {unbalanced,legacy,duplicate,adjustments:book.entries.filter(e=>e.sourceId.startsWith('cap:')),cash:book.cashKnown?book.openingCashCents+book.entries.reduce((s,e)=>s+e.cashCents,0):null};

}



/** Forecast bridge; unused ordered stock is conservatively reserved at delivery, not posted. */

export function projectedCompliance(c:CareerState,obligations:FinanceObligation[],year:number):number{

  const b=c.finance!.book!,inYear=(d:string)=>d.startsWith(String(year));let extra=0;

  for(const a of b.assets.filter(a=>a.relevant)){

    const rows=obligations.filter(o=>o.sourceId===`asset:${a.id}`&&inYear(o.recognitionDate)&&!b.entries.some(e=>e.id===`${o.id}:recognition`));

    const start=new Date((a.depreciationStartOn??a.acquiredOn)+'T00:00:00Z'),basis=a.costCents-(a.regulatoryAccumulatedCents??a.openingAccumulatedCents??0);

    for(const o of rows){const d=new Date(o.recognitionDate+'T00:00:00Z'),i=(d.getUTCFullYear()-start.getUTCFullYear())*12+d.getUTCMonth()-start.getUTCMonth();extra+=Math.round(basis*(i+1)/a.lifeMonths)-Math.round(basis*i/a.lifeMonths)-o.relevantCents;}

  }

  if(b.operations?.personnelCoverage){

    const totals=new Map<string,{gross:number;relevant:number}>();

    for(const s of b.personnel?.staff??[]){if(s.relevantPercent<=0)continue;const prev=totals.get(s.personId)??{gross:0,relevant:0};

      for(const e of b.entries.filter(e=>e.sourceId===`staff:${s.id}`&&inYear(e.date)&&e.kind!=='payment')){prev.gross+=e.relevantCents+e.excludedCents;prev.relevant+=e.relevantCents;}

      for(const o of obligations.filter(o=>o.sourceId===`staff:${s.id}`&&inYear(o.recognitionDate)&&!b.entries.some(e=>e.id===`${o.id}:recognition`))){prev.gross+=Math.max(0,-o.amountCents);prev.relevant+=o.relevantCents;}

      totals.set(s.personId,prev);

    }

    const target=-[...totals].sort((a,b)=>b[1].gross-a[1].gross||a[0].localeCompare(b[0])).slice(0,3).reduce((n,[,v])=>n+v.relevant,0);

    extra+=target-b.entries.filter(e=>e.sourceId==='cap:excluded-personnel'&&inYear(e.date)).reduce((n,e)=>n+e.relevantCents,0);

  }

  for(const o of b.manufacturing?.orders??[]){if(o.capModel!==2||o.kind!=='production'||o.status==='cancelled'||!inYear(o.deliveryOn))continue;

    const used=b.entries.filter(e=>[ `cap:inventory:${o.id}`, `cap:wip:${o.id}` ].includes(e.sourceId)&&inYear(e.date)).reduce((n,e)=>n+e.relevantCents,0);

    const credits=b.obligations.filter(x=>x.sourceId===`manufacturing-credit:${o.id}`).reduce((n,x)=>n+x.amountCents,0);

    extra+=Math.max(0,o.relevantCents-credits-used);

  }

  return extra;

}
