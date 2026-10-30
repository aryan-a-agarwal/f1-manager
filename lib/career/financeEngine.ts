import {processWorkshop} from './manufacturing';

import {processFinanceCompliance,projectedCompliance} from './financeCompliance';

import {validAgreementBonusAwards} from './financeAgreementBonuses';

import type {CareerState, FinanceState} from './types';

import type {FinanceAsset, FinanceBook, FinanceCategory, FinanceEntry, FinanceObligation} from './financeTypes';

import {createFinanceRules, financeAdjustments, financeCap} from './financeRules';

import {salaryBetween, validContractDate} from './negotiation';

import {validChampionshipFinance} from './championshipFinance';

import {contractSalary} from './contracts';

import {teams} from '../data/grid';

import {checkNewFinanceCommitments,processFinanceOperations,financeOperationsObligations,journalLinesForObligation,validFinanceOperations,getFinanceOperations,financeForecast,emptyFinanceOperations,financeOperationsSummary} from './financeOperations';

import {processManufacturingFinance,validManufacturingFinance} from './manufacturingFinance';

import {processPersonnelFinance,personnelFinanceObligations,applyPersonnelPaymentTerms,validPersonnelFinance} from './personnelFinance';



const DAY=86400000;

const cents=(n:number)=>Math.round(n*100);

const lastDay=(year:number,month:number)=>new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);

const shift=(date:string,days:number)=>new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);

const maxDate=(...dates:string[])=>dates.sort().at(-1)!;

const minDate=(...dates:string[])=>dates.sort()[0];

/** Remove generated budgets without removing recorded contracts or gameplay actions. */

function removeAssumedFinance(career:CareerState):CareerState {

  const fin=career.finance!,book=fin.book!;

  const isFiller=(r:{id:string;sourceId:string;basis:string})=>r.sourceId.startsWith('baseline:')||r.id.startsWith('baseline:')||(r.basis==='game_assumption'&&!r.sourceId.startsWith('contract:'));

  const cleaned=refreshFinance({...career,finance:{...fin,book:{...book,version:2,cashKnown:false,debtKnown:false,openingCashCents:0,openingDebtCents:0,

    annual:{},fundedSeasons:[],owners:[],baselineVersion:'career-records-v2',entries:book.entries.filter(e=>!isFiller(e)),obligations:book.obligations.filter(o=>!isFiller(o)),

    rules:book.rules.map(r=>({...r,integrationAdjustmentCents:0,assumptions:r.assumptions.filter(a=>!a.startsWith('Power-unit integration allowances')).concat('No team-specific PU integration allocation is recorded; no relief is applied.')}))}}});

  if(cleaned.scheduler.pendingEvent?.id.startsWith('finance:')&&cleaned.scheduler.pendingEvent.id.endsWith(':warning')&&cleaned.finance!.costCapSpent<=cleaned.finance!.costCapLimit){

    return {...cleaned,clock:{...cleaned.clock,status:'paused',blockingEventId:null},scheduler:{...cleaned.scheduler,pendingEvent:null}};

  }

  return cleaned;

}



/** One-time snapshot; reference edits never reprice an existing career. No historical bills are backfilled. */

export function initializeFinance(career:CareerState):CareerState {

  if(career.finance?.book)return career.finance.book.version===1?removeAssumedFinance(career):career;

  const old=career.finance;

  const book:FinanceBook={version:2,activatedOn:career.clock.date,processedThrough:career.clock.date,baselineVersion:'career-records-v2',cashKnown:!!old,debtKnown:false,

    openingCashCents:old?cents(old.cashBalance):0,openingDebtCents:0,

    openingRelevantCents:old?cents(old.costCapSpent):0,openingExcludedCents:old?cents(old.costCapExemptSpent):0,

    annual:{},fundedSeasons:[],owners:[],

    rules:[createFinanceRules(career.season.year,career.season.calendar.rounds.length,career.season.calendar.rounds.filter(r=>r.sessions.some(s=>s.kind==='sprint')).length)],

    entries:[],obligations:[],assets:[],operations:emptyFinanceOperations()};

  return refreshFinance({...career,finance:{cashBalance:book.openingCashCents/100,costCapLimit:0,costCapSpent:0,costCapExemptSpent:0,transactions:old?.transactions??[],monthlyProjections:{income:0,expenses:0,net:0},book}});

}



export function currentFinanceRules(career:CareerState,year=Number(career.clock.date.slice(0,4))){

  const book=career.finance!.book!;

  const found=book.rules.find(r=>r.year===year)??createFinanceRules(year,career.season.calendar.rounds.length,career.season.calendar.rounds.filter(r=>r.sessions.some(s=>s.kind==='sprint')).length);

  return {...found,assumptions:found.assumptions.filter(note=>!note.startsWith('Staff operating payroll is an aggregate estimate')&&!note.startsWith('Travel is modelled as eligible race travel'))};

}



export function refreshFinance(career:CareerState):CareerState {

  const fin=career.finance!,book=fin.book!,year=Number(career.clock.date.slice(0,4));

  const annual=book.entries.filter(e=>e.date.startsWith(String(year)));

  const opening=year===Number(book.activatedOn.slice(0,4));

  const relevant=(opening?book.openingRelevantCents:0)+annual.reduce((s,e)=>s+e.relevantCents,0);

  const excluded=(opening?book.openingExcludedCents:0)+annual.reduce((s,e)=>s+e.excludedCents,0);

  const cash=book.openingCashCents+book.entries.reduce((s,e)=>s+e.cashCents,0);

  if(![cash,relevant,excluded].every(Number.isSafeInteger))throw new Error('Financial totals exceed supported integer-cent precision.');

  return {...career,finance:{...fin,cashBalance:cash/100,costCapLimit:financeCap(currentFinanceRules(career))/100,

    costCapSpent:Math.max(0,relevant-financeAdjustments(currentFinanceRules(career)))/100,costCapExemptSpent:excluded/100}};

}



type PayContract={id:string;name:string;role:string;seat:number;from:string;to:string;annual:number;increase:number;firstIncrease:number;loyalty:number;basis:FinanceEntry['basis']};

function payrollContracts(career:CareerState):PayContract[]{

  const desk=career.contractDesk;if(!desk)return [];

  const signed=desk.drafts.filter(d=>d.teamId===career.player.teamId&&d.appointment&&['scheduled','active','blocked','expired'].includes(d.appointment.status)&&d.negotiation)

    .sort((a,b)=>a.negotiation!.startDate.localeCompare(b.negotiation!.startDate));

  const contracts:PayContract[]=[];

  for(const slot of desk.baseline.slots.filter(s=>s.teamId===career.player.teamId&&s.personId)){

    const f=desk.baseline.facts.find(f=>f.personId===slot.personId&&f.teamId===slot.teamId&&f.role===slot.role);

    if(!f)continue;

    const annual=contractSalary(desk,f).annualCents,end=f.scenarioTerms?.endSeason??f.exactEnd;

    const personId=desk.baseline.people.find(p=>p.id===f.personId)?.careerDriverId??f.personId;

    const terminated=career.workforce.agreements.filter(a=>a.teamId===slot.teamId&&a.personId===personId&&a.role===`${slot.role==='race_driver'?'driver':'reserve'}_${slot.number}`&&a.terminatedOn).map(a=>a.terminatedOn!).sort()[0];

    if(annual==null||end==null)continue;

    const param=(kind:string,key:string)=>Number(f.clausePackage?.clauses.find(c=>c.kind===kind)?.parameters[key]??0);

    contracts.push({id:f.id,name:desk.baseline.people.find(p=>p.id===f.personId)?.name??f.personId,role:slot.role,seat:slot.number,

      from:`${desk.baseline.season}-01-01`,to:terminated?minDate(`${end}-12-31`,shift(terminated,-1)):`${end}-12-31`,annual,increase:param('salary_escalator','annualPercent'),firstIncrease:param('salary_escalator','firstSeason')||desk.baseline.season+1,loyalty:param('loyalty_bonus','annualCents'),basis:'game_assumption'});

  }

  for(const d of signed){const t=d.negotiation!,get=(kind:string)=>t.clauses.find(c=>c.kind===kind)?.value??0;

    contracts.push({id:d.id,name:desk.baseline.people.find(p=>p.id===d.personId)?.name??d.personId,role:d.role,seat:d.seat,from:t.startDate,to:t.endDate,annual:d.salaryCents,increase:get('increase'),firstIncrease:Number(t.startDate.slice(0,4))+1,loyalty:Math.round(get('loyalty')*100),basis:'career_contract'});

  }

  return contracts.map(c=>{const replacement=signed.find(d=>d.id!==c.id&&d.appointment!.status!=='blocked'&&d.role===c.role&&d.seat===c.seat&&d.negotiation!.startDate>=c.from);return replacement?{...c,to:minDate(c.to,shift(replacement.negotiation!.startDate,-1))}:c;});

}



/** Recomputed commitments reflect agreed replacements, while already posted entries are immutable. */

export function financeObligations(career:CareerState,throughYear=Number(career.clock.date.slice(0,4))):FinanceObligation[]{

  const book=career.finance!.book!,result:FinanceObligation[]=[...book.obligations,...financeOperationsObligations(career),...personnelFinanceObligations(career,throughYear)],firstYear=Number(book.activatedOn.slice(0,4));

  const put=(o:FinanceObligation)=>{if(o.dueDate>=book.activatedOn)result.push(o);};

  for(let year=firstYear;year<=throughYear;year++){

    for(let month=1;month<=12;month++){

      const monthStart=`${year}-${String(month).padStart(2,'0')}-01`,end=lastDay(year,month),start=maxDate(monthStart,book.activatedOn);

      if(start>end)continue;

      for(const c of payrollContracts(career)){

        const a=maxDate(start,c.from),b=minDate(end,c.to);if(a>b)continue;

        const amount=salaryBetween(c.annual,a,b,Number(c.from.slice(0,4)),c.increase,c.firstIncrease);

        put({id:`salary:${c.id}:${end}`,sourceId:`contract:${c.id}`,description:`${c.name} · ${c.role==='race_driver'?'race':'reserve'} salary`,counterparty:c.name,category:'driver_pay',recognitionDate:end,dueDate:end,amountCents:-amount,relevantCents:0,basis:c.basis});

        if(month===12&&c.to>=end&&c.loyalty>0)put({id:`loyalty:${c.id}:${year}`,sourceId:`contract:${c.id}`,description:`${c.name} · loyalty payment`,counterparty:c.name,category:'driver_bonus',recognitionDate:end,dueDate:end,amountCents:-c.loyalty,relevantCents:0,basis:c.basis});

      }

    }

  }

  for(const d of career.contractDesk?.drafts??[]){

    if(d.teamId!==career.player.teamId||!d.appointment||!['active','scheduled','blocked','expired'].includes(d.appointment.status)||!d.negotiation)continue;

    const date=d.negotiation.startDate,name=career.contractDesk!.baseline.people.find(p=>p.id===d.personId)?.name??d.personId;

    const payment=(suffix:string,description:string,amount:number,category:FinanceCategory)=>{if(amount>0)put({id:`${suffix}:${d.id}`,sourceId:`contract:${d.id}`,description,counterparty:name,category,recognitionDate:date,dueDate:date,amountCents:-amount,relevantCents:0,basis:'career_contract'});};

    payment('signing',`${name} · signing payment`,Math.round((d.negotiation.clauses.find(c=>c.kind==='signing')?.value??0)*100),'driver_bonus');

    payment('exit','Outgoing driver compensation',d.appointment.terminationCents,'contract_exit');

    payment('release',`${name} · release payment`,d.appointment.releaseCents,'contract_exit');

  }

  for(const asset of book.assets){

    const start=new Date((asset.depreciationStartOn??asset.acquiredOn)+'T00:00:00Z');let allocated=0;

    for(let i=0;i<asset.lifeMonths;i++){

      const date=lastDay(start.getUTCFullYear(),start.getUTCMonth()+i+1);

      const cumulative=Math.round((asset.costCents-(asset.openingAccumulatedCents??0)-(asset.residualCents??0))*(i+1)/asset.lifeMonths),amount=cumulative-allocated;allocated=cumulative;

      if(Number(date.slice(0,4))>throughYear||(asset.disposedOn&&date>=asset.disposedOn))break;

      put({id:`depreciation:${asset.id}:${date}`,sourceId:`asset:${asset.id}`,description:`${asset.name} · depreciation`,counterparty:'Asset register',category:'depreciation',recognitionDate:date,dueDate:date,amountCents:0,recognitionCents:amount,relevantCents:asset.relevant?amount:0,basis:'career_action',account:'fixed_assets'});

    }

  }

  return applyPersonnelPaymentTerms(career,result).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||Number(b.amountCents>0)-Number(a.amountCents>0)||a.id.localeCompare(b.id));

}



/** A partial settlement reduces the remaining payment without recognising an expense twice. */

export function remainingFinancePayment(career:CareerState,o:FinanceObligation):number {

  const entries=career.finance!.book!.entries;

  const paid=entries.filter(e=>e.obligationId===o.id||e.id===`${o.id}:payment`||e.id.startsWith(`${o.id}:reconcile:`)).reduce((n,e)=>n+e.cashCents,0);

  return o.amountCents>0?Math.max(0,o.amountCents-paid):o.amountCents<0?Math.min(0,o.amountCents-paid):0;

}



/** Post recognition and payment separately, once each, including when a multi-day skip crosses bills. */

export function processFinance(career:CareerState,date=career.clock.date):CareerState {

  let state=initializeFinance(career);

  state=processFinanceOperations(processManufacturingFinance(processWorkshop(processPersonnelFinance(state,date),date),date),date);

  const fin=state.finance!,book=fin.book!;

  if(!validContractDate(date)||date<book.processedThrough)throw new Error('Finance cannot be processed backwards.');

  const entries=[...book.entries],ids=new Set(entries.map(e=>e.id));let rules=[...book.rules];

  for(let year=Number(book.processedThrough.slice(0,4));year<=Number(date.slice(0,4));year++)if(!rules.some(r=>r.year===year))rules.push(currentFinanceRules(state,year));

  for(const o of financeObligations(state,Number(date.slice(0,4)))){

    if(o.recognitionDate<=date&&!ids.has(`${o.id}:recognition`)){

      const excluded=o.category==='depreciation'?(o.recognitionCents??0)-o.relevantCents:o.classification==='unresolved'?0:o.amountCents<0&&o.category!=='capital'&&!['fixed_assets','inventory','loans','equity','revenue','opening_equity'].includes(o.account??'')?Math.max(0,-o.amountCents-o.relevantCents):o.amountCents>0&&o.category==='driver_bonus'?-o.amountCents:0;

      entries.push({id:`${o.id}:recognition`,sourceId:o.sourceId,date:o.recognitionDate,description:o.description,category:o.category,cashCents:0,relevantCents:o.relevantCents,excludedCents:excluded,kind:'recognition',basis:o.basis,accountLines:journalLinesForObligation(o,'recognition')});ids.add(`${o.id}:recognition`);

    }

    const proposed={...state,finance:{...fin,book:{...book,entries}}};

    const remaining=remainingFinancePayment(proposed,o),available=book.openingCashCents+entries.reduce((s,e)=>s+e.cashCents,0)-(getFinanceOperations(state).opening?.restrictedCents??0);

    if(o.dueDate<=date&&o.autoSettle!==false&&!ids.has(`${o.id}:payment`)&&(!book.cashKnown||remaining>=0||available>=-remaining)){

      const paidOn=o.dueDate<book.processedThrough?date:o.dueDate;

      entries.push({id:`${o.id}:payment`,sourceId:o.sourceId,obligationId:o.id,date:paidOn,description:o.description,category:o.category,cashCents:remaining,relevantCents:0,excludedCents:0,kind:'payment',basis:o.basis,accountLines:journalLinesForObligation(o,'payment',Math.abs(remaining),paidOn)});ids.add(`${o.id}:payment`);

    }

    // A replacement signed on payday can shorten an already settled salary. Preserve

    // the original journal and post the difference, rather than paying that day twice.

    if(['driver_pay','staff_pay'].includes(o.category)&&o.dueDate<=date&&ids.has(`${o.id}:payment`)){

      const prefix=`${o.id}:reconcile:`;

      const paid=entries.filter(e=>e.id===`${o.id}:payment`||e.id.startsWith(prefix)).reduce((sum,e)=>sum+e.cashCents,0);

      const delta=o.amountCents-paid;

      if(delta)entries.push({id:`${prefix}${entries.filter(e=>e.id.startsWith(prefix)).length}`,sourceId:o.sourceId,date,description:`${o.description} · replacement adjustment`,category:o.category,cashCents:delta,relevantCents:o.category==='staff_pay'?Math.round(-delta*o.relevantCents/Math.max(1,-o.amountCents)):0,excludedCents:o.category==='driver_pay'?-delta:o.category==='staff_pay'?Math.round(-delta*(1-o.relevantCents/Math.max(1,-o.amountCents))):0,kind:'adjustment',basis:'career_contract',accountLines:[{account:'cash',debitCents:Math.max(0,delta),creditCents:Math.max(0,-delta)},{account:'expenses',debitCents:Math.max(0,-delta),creditCents:Math.max(0,delta)}]});

    }

  }

  // Clear previously paid advances when the service or goods are recognised.

  for(const o of financeObligations(state,Number(date.slice(0,4)))){

    if(o.recognitionDate>date||!ids.has(`${o.id}:recognition`))continue;

    const advance=entries.filter(e=>e.obligationId===o.id||e.id===`${o.id}:payment`).flatMap(e=>e.accountLines??[]).filter(l=>l.account==='prepayments'||l.account==='deferred_income').reduce((n,l)=>n+(l.account==='prepayments'?l.debitCents-l.creditCents:l.creditCents-l.debitCents),0);

    const id=`advance-release:${o.id}`;

    if(advance&&!ids.has(id)){entries.push({id,sourceId:o.sourceId,date:o.recognitionDate,description:`${o.description} · advance applied`,category:o.category,cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:o.basis,accountLines:o.amountCents<0?[{account:'payables',debitCents:advance,creditCents:0},{account:'prepayments',debitCents:0,creditCents:advance}]:[{account:'deferred_income',debitCents:advance,creditCents:0},{account:'receivables',debitCents:0,creditCents:advance}]});ids.add(id);}

  }

  if(entries.length===book.entries.length&&date===book.processedThrough&&rules.length===book.rules.length)return refreshFinance(processFinanceCompliance(state,date));

  return refreshFinance(processFinanceCompliance({...state,finance:{...fin,book:{...book,rules,entries,processedThrough:date}}},date));

}



export function financeSummary(career:CareerState,year=Number(career.clock.date.slice(0,4))){

  const state=initializeFinance(career),fin=state.finance!,book=fin.book!,rules=currentFinanceRules(state,year);

  const ids=new Set(book.entries.map(e=>e.id));

  const all=financeObligations(state,year),upcoming=all.map(o=>({...o,amountCents:remainingFinancePayment(state,o)})).filter(o=>o.amountCents!==0||o.category==='depreciation'&&!ids.has(`${o.id}:recognition`));

  const opening=year===Number(book.activatedOn.slice(0,4));

  const entries=book.entries.filter(e=>e.date.startsWith(String(year)));

  const grossRelevant=(opening?book.openingRelevantCents:0)+entries.reduce((n,e)=>n+e.relevantCents,0);

  const committedRelevant=all.filter(o=>o.recognitionDate.startsWith(String(year))&&!ids.has(`${o.id}:recognition`)).reduce((n,o)=>n+o.relevantCents,0);

  const relevant=Math.max(0,grossRelevant-financeAdjustments(rules)),forecastRelevant=Math.max(0,grossRelevant+committedRelevant+projectedCompliance(state,all,year)-financeAdjustments(rules));

  const cap=financeCap(rules),cash=book.openingCashCents+book.entries.reduce((n,e)=>n+e.cashCents,0);

  let projectedCash=cash,minCash=cash,minDate=state.clock.date;

  const months:{date:string;income:number;expenses:number;cash:number}[]=[];

  for(let m=Number(state.clock.date.slice(5,7));m<=12;m++){

    const date=lastDay(year,m),monthPayments=upcoming.filter(o=>o.dueDate<=date&&o.dueDate>=(months.at(-1)?.date?shift(months.at(-1)!.date,1):book.processedThrough));

    const income=monthPayments.reduce((n,o)=>n+Math.max(0,o.amountCents),0),expenses=monthPayments.reduce((n,o)=>n+Math.max(0,-o.amountCents),0);

    // Assess end-of-day liquidity rather than arbitrary ordering of simultaneous payments.

    const days=[...new Set(monthPayments.map(o=>o.dueDate))].sort();

    for(const day of days){projectedCash+=monthPayments.filter(o=>o.dueDate===day).reduce((n,o)=>n+o.amountCents,0);if(projectedCash<minCash){minCash=projectedCash;minDate=day;}}

    months.push({date,income,expenses,cash:projectedCash});

  }

  return {cash,cap,relevant,grossRelevant,excluded:(opening?book.openingExcludedCents:0)+entries.reduce((n,e)=>n+e.excludedCents,0),committedRelevant,forecastRelevant,headroom:cap-relevant,forecastHeadroom:cap-forecastRelevant,

    committedCash:upcoming.filter(o=>o.dueDate<=`${year}-12-31`).reduce((n,o)=>n+Math.max(0,-o.amountCents),0),income:entries.reduce((n,e)=>n+Math.max(0,e.cashCents),0),expenses:entries.reduce((n,e)=>n+Math.max(0,-e.cashCents),0),

    projectedCash,minCash,minDate,months,upcoming,rules,entries,book,cashKnown:book.cashKnown===true,debtKnown:book.debtKnown===true};

}



export function financeWarnings(career:CareerState):string[]{

  const s=financeSummary(career),warnings:string[]=[];

  if(s.cashKnown&&s.cash<0)warnings.push('Cash is negative. New spending commitments are blocked; existing bills remain payable.');

  else if(s.cashKnown&&s.minCash<0)warnings.push(`Forecast cash falls below zero on ${s.minDate}.`);

  if(s.relevant>s.cap)warnings.push('Recognised relevant costs exceed the season cost cap.');

  else if(s.forecastRelevant>s.cap)warnings.push('Existing commitments forecast a cost-cap overspend.');

  else if(s.forecastRelevant>s.cap*.95)warnings.push('Less than 5% of the cost cap remains after planned costs.');

  const operations=financeOperationsSummary(career);

  if(operations.overdueCents>0)warnings.push('Recorded invoices are overdue. Review outstanding payments and any agreed funding.');

  if(operations.unresolvedCents>0)warnings.push('Some costs await classification; displayed cap headroom is not fully resolved.');

  return warnings;

}

export function financePaymentShortfall(career:CareerState,on=career.clock.date):boolean {

  if(!career.finance?.book?.cashKnown)return false;

  const b=career.finance.book,available=b.openingCashCents+b.entries.reduce((s,e)=>s+e.cashCents,0)-(getFinanceOperations(career).opening?.restrictedCents??0);

  const due=financeObligations(career).filter(o=>o.dueDate<=on&&o.amountCents<0).reduce((s,o)=>s-Math.min(0,remainingFinancePayment(career,o)),0);

  return due>Math.max(0,available);

}



export function assessFinancialCommitment(career:CareerState,cashCents:number,relevantCents:number,dueDate:string):string[]{

  if(!Number.isSafeInteger(cashCents)||cashCents<0||!Number.isSafeInteger(relevantCents)||relevantCents<0||!validContractDate(dueDate))throw new Error('Invalid financial commitment.');

  const s=financeSummary(career),issues:string[]=[];

  if(dueDate<career.clock.date)issues.push('Choose today or a future payment date.');

  const futureYear=Number(dueDate.slice(0,4));

  if(futureYear>s.rules.year+10)issues.push('This commitment is beyond the ten-season financial planning horizon.');

  const lastYear=Math.min(s.rules.year+10,Math.max(futureYear,s.rules.year,...s.book.obligations.map(o=>Number(o.dueDate.slice(0,4))),...(s.book.operations?.agreements??[]).map(a=>Number(a.endDate.slice(0,4)))));

  const all=financeObligations(career,lastYear),pending=all.map(o=>({...o,remaining:remainingFinancePayment(career,o)}));

  if(s.cashKnown){let balance=s.cash-(getFinanceOperations(career).opening?.restrictedCents??0);

    for(const day of [...new Set([dueDate,...pending.map(o=>o.dueDate<career.clock.date?career.clock.date:o.dueDate)])].sort()){

      balance+=pending.filter(o=>(o.dueDate<career.clock.date?career.clock.date:o.dueDate)===day).reduce((n,o)=>n+o.remaining,0);

      if(day===dueDate)balance-=cashCents;

      if(balance<0){issues.push(`This commitment leaves recorded payments unfunded by available cash on ${day}.`);break;}

    }

  }

  if(futureYear<=s.rules.year+10){const forecast=financeForecast(career,{throughYear:lastYear});

    if(forecast.years.some(y=>y.relevant+(y.year===futureYear?relevantCents:0)>y.cap))issues.push('This commitment would exceed a forecast season cost cap.');

  }

  const unresolved=financeOperationsSummary(career).unresolvedCents;

  if(futureYear===s.rules.year&&s.forecastRelevant+unresolved+relevantCents>s.cap)issues.push('The commitment would exceed the forecast season cost cap including unresolved classifications.');

  return issues;

}



/** Shared command for future project/supplier purchases; recognition and settlement have independent dates. */

export function commitFinanceObligation(career:CareerState,obligation:FinanceObligation):CareerState {

  const state=initializeFinance(career),book=state.finance!.book!;

  const existing=book.obligations.find(o=>o.id===obligation.id);

  if(existing){if(JSON.stringify(existing)!==JSON.stringify(obligation))throw new Error('This obligation already exists with different terms.');return state;}

  if(!validObligation(obligation)||obligation.recognitionDate<book.activatedOn||obligation.dueDate<career.clock.date)throw new Error('Invalid obligation dates or amounts.');

  const issues=assessFinancialCommitment(state,Math.max(0,-obligation.amountCents),obligation.relevantCents,obligation.dueDate);if(issues.length)throw new Error(issues.join(' '));

  const budget=financeOperationsSummary(state).budgetRows.find(b=>b.year===Number(obligation.recognitionDate.slice(0,4))&&b.department===obligation.category);

  if(budget&&Math.max(0,-obligation.amountCents)>budget.remainingCents)throw new Error('The approved department budget does not cover this commitment.');

  const proposed={...state,finance:{...state.finance!,book:{...book,obligations:[...book.obligations,obligation]}}};checkNewFinanceCommitments(proposed);return processFinance(proposed);

}



export function registerFinanceAsset(career:CareerState,asset:FinanceAsset):CareerState {

  const state=initializeFinance(career),book=state.finance!.book!;

  const existing=book.assets.find(a=>a.id===asset.id);

  if(existing){if(JSON.stringify(existing)!==JSON.stringify(asset))throw new Error('This asset already exists with different terms.');return state;}

  if(!asset.id||!asset.name||!validContractDate(asset.acquiredOn)||asset.acquiredOn<career.clock.date||!Number.isSafeInteger(asset.costCents)||asset.costCents<=0||!Number.isInteger(asset.lifeMonths)||asset.lifeMonths<1||asset.lifeMonths>600)throw new Error('Invalid asset.');

  const withAsset={...state,finance:{...state.finance!,book:{...book,assets:[...book.assets,asset]}}};

  // The forecast now contains this asset's depreciation before affordability is checked.

  return commitFinanceObligation(withAsset,{id:`asset-purchase:${asset.id}`,sourceId:`asset:${asset.id}`,description:asset.name,counterparty:'Equipment supplier',category:'capital',amountCents:-asset.costCents,relevantCents:0,recognitionDate:asset.acquiredOn,dueDate:asset.acquiredOn,basis:'career_action'});

}



export function recordOpeningFinanceAsset(career:CareerState,asset:FinanceAsset,accumulatedCents:number):CareerState {

  const state=initializeFinance(career),book=state.finance!.book!;

  if(book.assets.some(a=>a.id===asset.id)||!asset.id||!asset.name||!validContractDate(asset.acquiredOn)||asset.acquiredOn>career.clock.date||!Number.isSafeInteger(asset.costCents)||asset.costCents<=0||!Number.isSafeInteger(accumulatedCents)||accumulatedCents<0||accumulatedCents+(asset.residualCents??0)>asset.costCents||!Number.isInteger(asset.lifeMonths)||asset.lifeMonths<1||asset.lifeMonths>600)throw new Error('Record an existing asset, its accumulated depreciation and remaining useful life.');

  const entry:FinanceEntry={id:`opening-asset:${asset.id}`,sourceId:`asset:${asset.id}`,date:state.clock.date,description:`${asset.name} · opening asset`,category:'capital',cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[{account:'fixed_assets',debitCents:asset.costCents,creditCents:0},{account:'accumulated_depreciation',debitCents:0,creditCents:accumulatedCents},{account:'opening_equity',debitCents:0,creditCents:asset.costCents-accumulatedCents}]};

  return refreshFinance({...state,finance:{...state.finance!,book:{...book,assets:[...book.assets,{...asset,openingAccumulatedCents:accumulatedCents,depreciationStartOn:state.clock.date}],entries:[...book.entries,entry]}}});

}

export function disposeFinanceAsset(career:CareerState,id:string,proceedsCents:number,reason:string):CareerState {

  const state=processFinance(career),book=state.finance!.book!,asset=book.assets.find(a=>a.id===id);

  if(!asset||asset.disposedOn||asset.acquiredOn>state.clock.date||!Number.isSafeInteger(proceedsCents)||proceedsCents<0||!reason.trim())throw new Error('Choose a commissioned asset, valid disposal proceeds and a reason.');

  const depreciated=(asset.openingAccumulatedCents??0)+book.entries.filter(e=>e.sourceId===`asset:${id}`&&e.category==='depreciation').reduce((s,e)=>s+(e.accountLines?.filter(l=>l.account==='expenses').reduce((n,l)=>n+l.debitCents-l.creditCents,0)??e.relevantCents+e.excludedCents),0),carrying=asset.costCents-depreciated,gain=proceedsCents-carrying;

  const entry:FinanceEntry={id:`disposal:${id}`,sourceId:`asset:${id}`,date:state.clock.date,description:`${asset.name} · disposal: ${reason}`,category:'capital',cashCents:proceedsCents,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[{account:'cash',debitCents:proceedsCents,creditCents:0},{account:'fixed_assets',debitCents:0,creditCents:asset.costCents},{account:'accumulated_depreciation',debitCents:depreciated,creditCents:0},...(gain>=0?[{account:'revenue' as const,debitCents:0,creditCents:gain}]:[{account:'expenses' as const,debitCents:-gain,creditCents:0}])]};

  return refreshFinance({...state,finance:{...state.finance!,book:{...book,assets:book.assets.map(a=>a.id===id?{...a,disposedOn:state.clock.date,disposalProceedsCents:proceedsCents}:a),entries:[...book.entries,entry]}}});

}



const safe=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v);

const nonnegative=(v:unknown)=>safe(v)&&Number(v)>=0;

const categories:FinanceCategory[]=['owner_funding','sponsorship','prize_receipts','commercial_income','driver_pay','driver_bonus','contract_exit','staff_pay','facilities','travel','development','production','capital','depreciation','other'];

function validObligation(o:FinanceObligation){return !!o&&typeof o.id==='string'&&!!o.id&&typeof o.sourceId==='string'&&typeof o.description==='string'&&typeof o.counterparty==='string'&&categories.includes(o.category)&&validContractDate(o.recognitionDate)&&validContractDate(o.dueDate)&&safe(o.amountCents)&&nonnegative(o.relevantCents)&&['game_assumption','career_contract','career_action','legacy'].includes(o.basis);}

export function validFinanceState(value:unknown):boolean{

  if(value===undefined)return true;

  if(!value||typeof value!=='object')return false;

  const f=value as FinanceState;

  if(![f.cashBalance,f.costCapLimit,f.costCapSpent,f.costCapExemptSpent].every(Number.isFinite)||!Array.isArray(f.transactions))return false;

  if(f.teamBooks&&(typeof f.teamBooks!=='object'||Array.isArray(f.teamBooks)||Object.entries(f.teamBooks).some(([id,book])=>!teams.some(t=>t.id===id)||!validFinanceState({...f,teamBooks:undefined,book}))))return false;

  if(!f.book)return true;

  const b=f.book;

  return (b.version===1||(b.version===2&&typeof b.cashKnown==='boolean'&&typeof b.debtKnown==='boolean'))&&validContractDate(b.activatedOn)&&validContractDate(b.processedThrough)&&b.processedThrough>=b.activatedOn&&safe(b.openingCashCents)&&[b.openingDebtCents,b.openingRelevantCents,b.openingExcludedCents].every(nonnegative)

    &&!!b.annual&&Object.values(b.annual).every(nonnegative)&&Array.isArray(b.owners)&&b.owners.every(o=>typeof o==='string')&&typeof b.baselineVersion==='string'

    &&Array.isArray(b.fundedSeasons)&&b.fundedSeasons.every(y=>Number.isInteger(y)&&y>=1950)

    &&Array.isArray(b.entries)&&new Set(b.entries.map(e=>e.id)).size===b.entries.length&&b.entries.every(e=>!!e&&typeof e.id==='string'&&typeof e.sourceId==='string'&&validContractDate(e.date)&&typeof e.description==='string'&&categories.includes(e.category)&&safe(e.cashCents)&&safe(e.relevantCents)&&safe(e.excludedCents)&&['recognition','payment','adjustment'].includes(e.kind)&&(e.accountLines===undefined||(Array.isArray(e.accountLines)&&e.accountLines.every(l=>['cash','receivables','payables','prepayments','deferred_income','inventory','fixed_assets','accumulated_depreciation','loans','equity','revenue','expenses','opening_equity'].includes(l.account)&&nonnegative(l.debitCents)&&nonnegative(l.creditCents))&&e.accountLines.reduce((n,l)=>n+l.debitCents-l.creditCents,0)===0)))

    &&Array.isArray(b.obligations)&&new Set(b.obligations.map(o=>o.id)).size===b.obligations.length&&b.obligations.every(validObligation)

    &&Array.isArray(b.assets)&&new Set(b.assets.map(a=>a.id)).size===b.assets.length&&b.assets.every(a=>!!a&&typeof a.id==='string'&&typeof a.name==='string'&&validContractDate(a.acquiredOn)&&nonnegative(a.costCents)&&Number.isInteger(a.lifeMonths)&&a.lifeMonths>0&&a.lifeMonths<=600&&typeof a.relevant==='boolean'&&(a.residualCents===undefined||(nonnegative(a.residualCents)&&a.residualCents<=a.costCents))&&(a.openingAccumulatedCents===undefined||(nonnegative(a.openingAccumulatedCents)&&a.openingAccumulatedCents+(a.residualCents??0)<=a.costCents))&&(a.regulatoryAccumulatedCents===undefined||nonnegative(a.regulatoryAccumulatedCents)&&a.regulatoryAccumulatedCents<=a.costCents)&&(a.depreciationStartOn===undefined||validContractDate(a.depreciationStartOn))&&(a.disposedOn===undefined||validContractDate(a.disposedOn))&&(a.disposalProceedsCents===undefined||nonnegative(a.disposalProceedsCents)))

    &&validFinanceOperations(b.operations)&&validManufacturingFinance(b.manufacturing)&&validPersonnelFinance(b.personnel)&&validChampionshipFinance(b.championshipFinance)&&validAgreementBonusAwards(b.agreementBonusAwards)

    &&Array.isArray(b.rules)&&b.rules.length>0&&new Set(b.rules.map(r=>r.year)).size===b.rules.length&&b.rules.every(r=>!!r&&Number.isInteger(r.year)&&r.year>=1950&&r.currency==='USD'&&[r.baseCapCents,r.extraRaceCents,r.sprintAdjustmentCents,r.carryForwardCents,r.integrationAdjustmentCents].every(nonnegative)&&Number.isFinite(r.indexationPercent)&&r.indexationPercent>=0&&Array.isArray(r.assumptions)&&typeof r.sourceUrl==='string');

}
