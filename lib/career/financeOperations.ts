import {projectedCompliance} from './financeCompliance';

import {processAgreementBonuses} from './financeAgreementBonuses';

import type {CareerState} from './types';

import type {FinanceBook,FinanceEntry,FinanceObligation,FinanceRuleSet} from './financeTypes';

import type {FinanceAccount,FinanceAgreement,FinanceAgreementInput,FinanceBudget,FinanceCounterparty,FinanceForecastResult,FinanceInvoice,FinanceInvoiceInput,FinanceInvoiceView,FinanceJournalLine,FinanceOpeningInput,FinanceOperations,FinanceOperationsSummary,FinanceScenario,FinanceClassification,FinanceComplianceFinding} from './financeOperationsTypes';

import {initializeFinance,processFinance,refreshFinance,financeObligations,currentFinanceRules,remainingFinancePayment} from './financeEngine';

import {financeAdjustments,financeCap} from './financeRules';

import {validContractDate} from './negotiation';

import {transferTeamStake,type OwnerIdentity,type OwnershipPeriod} from './teamOwnership';

import ownership from '../../supabase/seed-data/2027-team-ownership.json';



const accounts:FinanceAccount[]=['cash','receivables','payables','prepayments','deferred_income','inventory','fixed_assets','accumulated_depreciation','loans','equity','revenue','expenses','opening_equity'];

const safe=(n:number)=>Number.isSafeInteger(n)&&n>=0;

const required=(s:string)=>typeof s==='string'&&s.trim().length>0;

const date=(s:string)=>validContractDate(s);

const lastDay=(y:number,m:number)=>new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);

const addMonths=(s:string,n:number)=>{const d=new Date(s+'T00:00:00Z'),y=d.getUTCFullYear(),m=d.getUTCMonth()+n;const a=new Date(Date.UTC(y,m,1));return `${a.getUTCFullYear()}-${String(a.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(d.getUTCDate(),Number(lastDay(a.getUTCFullYear(),a.getUTCMonth()+1).slice(-2)))).padStart(2,'0')}`;};

const idate=(c:CareerState,s:string)=>{if(!date(s)||s<c.clock.date)throw new Error('Choose today or a future date.');};

const normalTeam=(id:string)=>id==='red-bull-racing'?'red-bull':id;

export function emptyFinanceOperations():FinanceOperations {

  return {version:1,counterparties:[],agreements:[],invoices:[],settlements:[],budgets:[],scenarios:[],periods:[],findings:[],transfers:[],eventReceipts:[],coverage:{funding:false,operating:false},

    ownership:{owners:ownership.owners.map(o=>({id:o.slug,name:o.name,kind:o.kind})),periods:ownership.relationships.filter(r=>r.relationship!=='backer').map(r=>({teamId:normalTeam(r.team_slug),ownerId:r.owner_slug,percentage:r.percentage,from:'2027-01-01',until:null,basis:'game_assumption' as const}))}};

}

export function getFinanceOperations(career:CareerState):FinanceOperations{return career.finance?.book?.operations??emptyFinanceOperations();}

function put(career:CareerState,operations:FinanceOperations):CareerState{return {...career,finance:{...career.finance!,book:{...career.finance!.book!,operations}}};}

export function initializeFinanceOperations(career:CareerState):CareerState {return career.finance?.book?.operations?career:put(career,emptyFinanceOperations());}

function ready(c:CareerState){return initializeFinanceOperations(initializeFinance(c));}

function editable(c:CareerState,on=c.clock.date){if(getFinanceOperations(c).periods.some(p=>p.year===Number(on.slice(0,4))))throw new Error('This reporting period is closed. Record a correction in an open period.');}

const basis=(value:string)=>value==='recorded'||value==='scenario';

export const INVOICE_TEMPLATES = {
  development:{label:'Chassis design / testing',category:'development',classification:'relevant',rule:'Section D: ordinary chassis development costs'},
  travel:{label:'Race-team travel',category:'travel',classification:'relevant',rule:'Section D: ordinary racing operations'},
  facilities:{label:'Factory operating services',category:'facilities',classification:'relevant',rule:'Section D: ordinary factory operations; equipment purchases use the asset register'},
  driver_pay:{label:'Driver compensation',category:'driver_pay',classification:'excluded',rule:'Section D: driver remuneration exclusion'},
} as const;

const classifications=['relevant','excluded','mixed','unresolved'];

const relevant=(i:Pick<FinanceInvoiceInput,'amountCents'|'classification'|'relevantPercent'>)=>i.classification==='relevant'?i.amountCents:i.classification==='mixed'?Math.round(i.amountCents*i.relevantPercent/100):0;

function validateInvoice(i:FinanceInvoiceInput){

  if(!required(i.id)||!required(i.description)||!required(i.partyId)||!safe(i.amountCents)||i.amountCents===0||!date(i.dueDate)||!date(i.recognitionDate)||!['income','expense'].includes(i.direction)||!classifications.includes(i.classification)||!Number.isFinite(i.relevantPercent)||i.relevantPercent<0||i.relevantPercent>100||!accounts.includes(i.account)||typeof i.autoSettle!=='boolean'||typeof i.note!=='string')throw new Error('Complete the invoice description, counterparty, dates, amount and accounting treatment.');

  if(i.classificationTemplate){const template=INVOICE_TEMPLATES[i.classificationTemplate as keyof typeof INVOICE_TEMPLATES];if(!template||i.category!==template.category||i.direction!=='expense'||i.account!=='expenses'||!['unresolved',template.classification].includes(i.classification))throw new Error('Use the recorded classification policy; uncertain treatment must be sent for review.');}
  if(i.direction==='income'&&['relevant','mixed'].includes(i.classification))throw new Error('Income does not increase or consume the cost cap.');

}

function participant(c:CareerState,id:string){return getFinanceOperations(c).counterparties.find(p=>p.id===id);}

export function saveFinanceCounterparty(career:CareerState,input:FinanceCounterparty):CareerState {

  const c=ready(career),o=getFinanceOperations(c);

  if(!required(input.id)||!required(input.name)||!['owner','sponsor','supplier','lender','employee','championship','customer','other'].includes(input.kind))throw new Error('Record a counterparty name and type.');

  return put(c,{...o,counterparties:[...o.counterparties.filter(p=>p.id!==input.id),{...input,name:input.name.trim()}]});

}

/** A dated bank balance is an anchor: earlier journal movements must not be subtracted again. */

export function recordOpeningPosition(career:CareerState,input:FinanceOpeningInput):CareerState {

  const c=ready(career),o=getFinanceOperations(c),b=c.finance!.book!;editable(c);

  if(input.asOf!==c.clock.date||![input.cashCents,input.restrictedCents,input.debtCents].every(n=>n===null||safe(n))||!basis(input.basis)||!required(input.note))throw new Error('Use today’s balance date, valid amounts or unknown, and record the origin of these values.');

  if(input.restrictedCents!==null&&(input.cashCents===null||input.restrictedCents>input.cashCents))throw new Error('Restricted cash cannot exceed a known cash balance.');

  const cashMovements=b.entries.reduce((s,e)=>s+e.cashCents,0);

  const loanBalance=-b.openingDebtCents+b.entries.flatMap(e=>e.accountLines??[]).filter(l=>l.account==='loans').reduce((s,l)=>s+l.debitCents-l.creditCents,0),loanDelta=input.debtCents===null?0:-input.debtCents-loanBalance;

  const debtAnchor:FinanceEntry={id:`opening-debt:${c.clock.date}:${b.entries.length}`,sourceId:'opening-position',date:c.clock.date,description:`Recorded debt balance · ${input.note}`,category:'other',cashCents:0,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:[{account:'loans',debitCents:Math.max(0,loanDelta),creditCents:Math.max(0,-loanDelta)},{account:'opening_equity',debitCents:Math.max(0,-loanDelta),creditCents:Math.max(0,loanDelta)}]};

  const next=put({...c,finance:{...c.finance!,book:{...b,cashKnown:input.cashCents!==null,debtKnown:input.debtCents!==null,openingCashCents:input.cashCents===null?0:input.cashCents-cashMovements,entries:loanDelta?[...b.entries,debtAnchor]:b.entries}}},{...o,opening:{...input}});

  return refreshFinance(next);

}

function generateAgreementInvoices(a:FinanceAgreement):FinanceInvoice[] {

  if(a.status==='cancelled'||!a.guaranteed)return [];

  const base={partyId:a.partyId,category:a.category,classification:a.classification,relevantPercent:a.relevantPercent,account:a.account,autoSettle:a.autoSettle,note:a.note,agreementId:a.id,basis:a.basis,direction:a.direction,sourceId:`agreement:${a.id}`,status:'open' as const,createdOn:a.createdOn,creditCents:0,revision:a.revision};

  const prefix=`agreement:${a.id}:r${a.revision}`;

  const rows:FinanceInvoice[]=[];

  const add=(suffix:string,on:string,recognition:string,amountCents:number,description=a.title,patch:Partial<FinanceInvoice>={})=>rows.push({...base,id:`${prefix}:${suffix}`,description,recognitionDate:recognition,dueDate:on,amountCents,...patch});

  if(a.kind==='loan'&&a.loan){

    add('draw',a.startDate,a.startDate,a.amountCents,`${a.title} · loan drawdown`,{account:'loans',direction:'income',classification:'excluded'});

    let outstanding=a.amountCents,previous=a.startDate,allocated=0;

    for(let m=0;m<a.loan.repaymentMonths;m++){

      const on=addMonths(a.loan.repaymentStart,m),cumulative=Math.round(a.amountCents*(m+1)/a.loan.repaymentMonths),principal=cumulative-allocated;allocated=cumulative;

      const days=Math.max(0,(Date.parse(on)-Date.parse(previous))/86400000),interest=Math.round(outstanding*a.loan.annualInterestPercent/100*days/365);

      add(`principal:${m}`,on,on,principal,`${a.title} · principal repayment`,{account:'loans',direction:'expense',classification:'excluded'});

      if(interest)add(`interest:${m}`,on,on,interest,`${a.title} · interest`,{account:'expenses',direction:'expense'});

      outstanding-=principal;previous=on;

    }

  }else if(a.instalments?.length){for(const s of a.instalments)add(s.id,s.dueDate,s.recognitionDate,s.amountCents);}

  else {

    const step=a.frequency==='monthly'?1:a.frequency==='quarterly'?3:12;

    for(let n=0;n<240;n+=step){const on=addMonths(a.startDate,n);if(on>a.endDate)break;add(on,on,on,a.amountCents);if(a.frequency==='once')break;}

  }

  return rows;

}

function checkAgreement(c:CareerState,a:FinanceAgreementInput){

  validateInvoice({...a,description:a.title,dueDate:a.startDate,recognitionDate:a.startDate});

  idate(c,a.startDate);

  if(!['owner_equity','loan','sponsorship','prize','merchandise','hospitality','licensing','supplier','staff','lease','travel','other'].includes(a.kind)||typeof a.guaranteed!=='boolean'||(a.kind==='loan'&&(a.account!=='loans'||a.direction!=='income')))throw new Error('Record the agreement kind, guarantee and correct loan accounting.');

  if(!date(a.endDate)||a.endDate<a.startDate||Number(a.endDate.slice(0,4))-Number(a.startDate.slice(0,4))>20||!basis(a.basis)||!['once','monthly','quarterly','annual'].includes(a.frequency)||!participant(c,a.partyId)||!required(a.note))throw new Error('Record agreement dates, counterparty and the basis of the terms. Terms can cover up to 20 years.');

  if(a.instalments){if(!a.instalments.length||new Set(a.instalments.map(s=>s.id)).size!==a.instalments.length||a.instalments.some(s=>!required(s.id)||!safe(s.amountCents)||!s.amountCents||!date(s.dueDate)||!date(s.recognitionDate)||s.dueDate<a.startDate||s.dueDate>a.endDate||s.recognitionDate<a.startDate)||a.instalments.reduce((s,i)=>s+i.amountCents,0)!==a.amountCents)throw new Error('Instalments must have unique IDs, fall within the agreement and total its value.');}

  if(a.kind==='loan'&&(!a.loan||!Number.isFinite(a.loan.annualInterestPercent)||a.loan.annualInterestPercent<0||a.loan.annualInterestPercent>100||!date(a.loan.repaymentStart)||a.loan.repaymentStart<=a.startDate||!Number.isInteger(a.loan.repaymentMonths)||a.loan.repaymentMonths<1||a.loan.repaymentMonths>240))throw new Error('Record the loan rate, repayment start after drawdown, and 1–240 monthly repayments.');

  if(a.kind==='owner_equity'&&(a.direction!=='income'||a.account!=='equity'))throw new Error('Owner equity must be recorded as incoming equity.');

  if(a.bonus&&(a.direction!=='income'||a.account!=='revenue'||!['race_win','race_podium','constructors_title'].includes(a.bonus.trigger)||!safe(a.bonus.amountCents)||!safe(a.bonus.annualCapCents)))throw new Error('Record valid bonus terms.');

}

function materialize(c:CareerState):CareerState {

  const o=getFinanceOperations(c),known=new Set(o.invoices.map(i=>i.id));

  const rows=o.agreements.flatMap(generateAgreementInvoices).filter(i=>!known.has(i.id));

  return rows.length?put(c,{...o,invoices:[...o.invoices,...rows]}):c;

}

export function createFinanceAgreement(career:CareerState,input:FinanceAgreementInput):CareerState {

  let c=ready(career);const o=getFinanceOperations(c);editable(c);checkAgreement(c,input);

  if(o.agreements.some(a=>a.id===input.id))throw new Error('This agreement ID already exists. Use an amendment.');

  c=materialize(put(c,{...o,agreements:[...o.agreements,{...structuredClone(input),revision:1,status:'active',createdOn:c.clock.date,amendments:[]}]}));

  if(input.guaranteed&&input.direction==='expense')checkNewFinanceCommitments(c);

  return processFinance(c);

}

export function checkNewFinanceCommitments(career:CareerState):void {

  const c=ready(career),o=getFinanceOperations(c),endYear=Math.min(Number(c.clock.date.slice(0,4))+10,Math.max(Number(c.clock.date.slice(0,4)),...o.agreements.map(a=>Number(a.endDate.slice(0,4))),...c.finance!.book!.obligations.map(a=>Number(a.dueDate.slice(0,4))),...c.finance!.book!.assets.map(a=>Number(a.acquiredOn.slice(0,4))+Math.ceil(a.lifeMonths/12)),...(c.finance!.book!.personnel?.staff??[]).map(a=>Number(a.to.slice(0,4))),...(c.contractDesk?.drafts??[]).filter(d=>d.appointment&&d.negotiation).map(d=>Number(d.negotiation!.endDate.slice(0,4))))),forecast=financeForecast(c,{throughYear:endYear});

  if(c.finance!.book!.cashKnown&&forecast.minCash!==null&&forecast.minCash-(o.opening?.restrictedCents??0)<0)throw new Error('This agreement would leave recorded commitments without cash coverage.');

  if(forecast.years.some(y=>y.headroom<financeInvoiceViews(c).filter(i=>i.direction==='expense'&&i.classification==='unresolved'&&i.status!=='cancelled'&&i.recognitionDate.startsWith(String(y.year))).reduce((n,i)=>n+i.amountCents-i.creditCents,0)))throw new Error('This agreement would exceed a season cost cap.');

  if(financeOperationsSummary(c).budgetRows.some(b=>b.remainingCents<0))throw new Error('This agreement exceeds an approved department budget.');

}

export function recordFinanceInvoice(career:CareerState,input:FinanceInvoiceInput):CareerState {

  const c=ready(career),o=getFinanceOperations(c);editable(c);validateInvoice(input);idate(c,input.recognitionDate);

  if(input.openingBalance){if(input.recognitionDate!==c.clock.date||input.account!=='opening_equity'||input.classification!=='excluded')throw new Error('Opening receivables/payables must use today’s balance date and opening equity, without a new expense.');}

  else idate(c,input.dueDate);

  if(!participant(c,input.partyId))throw new Error('Record the counterparty first.');

  if(o.invoices.some(i=>i.id===input.id))throw new Error('An invoice with this ID is already recorded.');

  return processFinance(put(c,{...o,invoices:[...o.invoices,{...input,status:'open',createdOn:c.clock.date,creditCents:0,revision:1}]}));

}

export function financeInvoicePaid(c:CareerState,id:string){return getFinanceOperations(c).settlements.filter(s=>s.invoiceId===id).reduce((n,s)=>n+(s.kind==='refund'?-s.amountCents:s.amountCents),0);}

export function financeInvoiceViews(career:CareerState):FinanceInvoiceView[]{

  const c=ready(career),o=getFinanceOperations(materialize(c));

  return o.invoices.map(i=>{const obligationId=`invoice:${i.id}`,autoPaid=c.finance!.book!.entries.filter(e=>e.obligationId===obligationId&&e.kind==='payment').reduce((s,e)=>s+Math.abs(e.cashCents),0);

    const paidCents=financeInvoicePaid(c,i.id)+autoPaid,outstandingCents=Math.max(0,i.amountCents-i.creditCents-paidCents);

    const state=i.status!=='open'?i.status:outstandingCents===0?'paid':i.dueDate<c.clock.date?'overdue':paidCents>0?'part_paid':i.dueDate===c.clock.date?'due':'scheduled';

    return {...i,paidCents,outstandingCents,state};});

}

export function financeOperationsObligations(career:CareerState):FinanceObligation[]{

  const o=getFinanceOperations(materialize(career));

  return o.invoices.filter(i=>i.status!=='cancelled'&&i.amountCents>i.creditCents).map(i=>({id:`invoice:${i.id}`,sourceId:i.sourceId??`invoice:${i.id}`,invoiceId:i.id,description:i.description,counterparty:o.counterparties.find(p=>p.id===i.partyId)?.name??i.partyId,category:i.category,

    recognitionDate:i.recognitionDate,dueDate:i.dueDate,amountCents:(i.direction==='income'?1:-1)*(i.amountCents-i.creditCents),relevantCents:i.direction==='expense'?Math.round(relevant(i)*(i.amountCents-i.creditCents)/i.amountCents):0,

    basis:i.basis==='scenario'?'game_assumption':'career_action',autoSettle:i.autoSettle&&i.status!=='disputed',account:i.account,classification:i.classification}));

}

export function journalLinesForObligation(o:FinanceObligation,kind:'recognition'|'payment',amount=Math.abs(o.amountCents),on=o.dueDate):FinanceJournalLine[]{

  const income=o.amountCents>0,account=o.account??(o.category==='capital'?'fixed_assets':o.category==='depreciation'?'expenses':income?'revenue':'expenses');

  if(kind==='recognition'){

    if(o.category==='depreciation')return [{account:'expenses',debitCents:o.recognitionCents??o.relevantCents,creditCents:0},{account:'accumulated_depreciation',debitCents:0,creditCents:o.recognitionCents??o.relevantCents}];

    if(!amount)return [];

    return income?[{account:'receivables',debitCents:amount,creditCents:0},{account,debitCents:0,creditCents:amount}]:[{account,debitCents:amount,creditCents:0},{account:'payables',debitCents:0,creditCents:amount}];

  }

  return income?[{account:'cash',debitCents:amount,creditCents:0},{account:on<o.recognitionDate?'deferred_income':'receivables',debitCents:0,creditCents:amount}]:[{account:on<o.recognitionDate?'prepayments':'payables',debitCents:amount,creditCents:0},{account:'cash',debitCents:0,creditCents:amount}];

}

export function settleFinanceInvoice(career:CareerState,id:string,amountCents:number,settlementId?:string):CareerState {

  let c=ready(career);const o=getFinanceOperations(c),i=financeInvoiceViews(c).find(i=>i.id===id);editable(c);

  if(!i||i.status!=='open')throw new Error('Only an open invoice can be settled.');

  const sid=settlementId??`${id}:${c.clock.date}:${o.settlements.length}`;

  const previous=o.settlements.find(s=>s.id===sid);if(previous){if(previous.invoiceId!==id||previous.amountCents!==amountCents)throw new Error('This settlement ID has different terms.');return c;}

  if(!safe(amountCents)||!amountCents||amountCents>i.outstandingCents)throw new Error('Payment must be positive and no greater than the outstanding amount.');

  const available=financeOperationsSummary(c).accounts.cash-(o.opening?.restrictedCents??0);

  if(i.direction==='expense'&&c.finance!.book!.cashKnown&&available<amountCents)throw new Error('Available cash does not cover this payment. The invoice remains payable.');

  const obligation=financeOperationsObligations(c).find(x=>x.invoiceId===id)!;

  const entry:FinanceEntry={id:`settlement:${sid}`,sourceId:obligation.sourceId,obligationId:obligation.id,date:c.clock.date,description:`${i.description} · settlement`,category:i.category,cashCents:(i.direction==='income'?1:-1)*amountCents,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:journalLinesForObligation(obligation,'payment',amountCents,c.clock.date)};

  c=put({...c,finance:{...c.finance!,book:{...c.finance!.book!,entries:[...c.finance!.book!.entries,entry]}}},{...o,settlements:[...o.settlements,{id:sid,invoiceId:id,date:c.clock.date,amountCents,kind:'payment'}]});

  return processFinance(c);

}

export function disputeFinanceInvoice(career:CareerState,id:string,reason:string):CareerState {

  const c=ready(career),o=getFinanceOperations(c),i=o.invoices.find(i=>i.id===id);editable(c);

  if(!i||!required(reason)||i.status==='cancelled')throw new Error('Choose an invoice and give the dispute reason.');

  return put(c,{...o,invoices:o.invoices.map(i=>i.id===id?{...i,status:i.status==='disputed'?'open':'disputed',reason}:i)});

}

export function classifyFinanceInvoice(career:CareerState,id:string,classification:FinanceClassification,relevantPercent:number,reason:string):CareerState {

  const c=ready(career),o=getFinanceOperations(c),i=o.invoices.find(i=>i.id===id);editable(c);

  if(!i||!classifications.includes(classification)||!Number.isFinite(relevantPercent)||relevantPercent<0||relevantPercent>100||!required(reason))throw new Error('Choose an invoice, cost treatment and supporting reason.');

  if(i.direction==='income'&&classification!=='excluded')throw new Error('Income is excluded from relevant costs.');

  if(i.classificationTemplate&&classification!=='unresolved'&&classification!==INVOICE_TEMPLATES[i.classificationTemplate as keyof typeof INVOICE_TEMPLATES]?.classification)throw new Error('This cost uses a fixed classification policy. Mark it unresolved for review; do not exclude ordinary development spending.');
  const next={...i,classification,relevantPercent,note:`${i.note}\nClassification: ${reason}`,revision:i.revision+1},b=c.finance!.book!,recognized=b.entries.some(e=>e.id===`invoice:${id}:recognition`);

  const amount=i.amountCents-i.creditCents,oldRelevant=Math.round(relevant(i)*amount/i.amountCents),newRelevant=Math.round(relevant(next)*amount/i.amountCents);

  const oldExcluded=i.direction==='expense'&&i.account==='expenses'&&i.classification!=='unresolved'?amount-oldRelevant:0,newExcluded=i.direction==='expense'&&i.account==='expenses'&&classification!=='unresolved'?amount-newRelevant:0;

  const entry:FinanceEntry={id:`classification:${id}:${next.revision}`,sourceId:i.sourceId??`invoice:${id}`,date:c.clock.date,description:`${i.description} · classification: ${reason}`,category:i.category,cashCents:0,relevantCents:newRelevant-oldRelevant,excludedCents:newExcluded-oldExcluded,kind:'adjustment',basis:'career_action',accountLines:[]};

  return refreshFinance(put({...c,finance:{...c.finance!,book:{...b,entries:recognized?[...b.entries,entry]:b.entries}}},{...o,invoices:o.invoices.map(row=>row.id===id?next:row)}));

}

export function recordFinanceFinding(career:CareerState,input:FinanceComplianceFinding):CareerState {

  let c=ready(career);const o=getFinanceOperations(c);if(!required(input.id)||o.findings.some(f=>f.id===input.id)||!Number.isInteger(input.year)||!date(input.date)||input.date!==c.clock.date||!['warning','overspend','late_report','resolved'].includes(input.kind)||!required(input.description)||!required(input.source)||!safe(input.penaltyCents))throw new Error('Record the review date, finding, supporting decision and any explicitly assessed penalty.');

  c=put(c,{...o,findings:[...o.findings,input]});

  if(input.penaltyCents){

    c=saveFinanceCounterparty(c,{id:'regulatory-administration',name:'Regulatory administration',kind:'other'});

    c=recordFinanceInvoice(c,{id:`penalty:${input.id}`,partyId:'regulatory-administration',description:input.description,direction:'expense',amountCents:input.penaltyCents,recognitionDate:c.clock.date,dueDate:c.clock.date,category:'other',classification:'excluded',relevantPercent:0,account:'expenses',autoSettle:false,note:input.source,sourceId:`finding:${input.id}`,basis:'recorded'});

  }

  return c;

}

export function creditFinanceInvoice(career:CareerState,id:string,amountCents:number,reason:string):CareerState {

  const c=ready(career),o=getFinanceOperations(c),i=o.invoices.find(i=>i.id===id);editable(c);

  if(!i||i.status==='cancelled'||!safe(amountCents)||!amountCents||amountCents>i.amountCents-i.creditCents||!required(reason))throw new Error('Record a credit within the remaining invoice value and its reason.');

  const b=c.finance!.book!,recognised=b.entries.some(e=>e.id===`invoice:${id}:recognition`),fraction=amountCents/i.amountCents;

  const old=financeOperationsObligations(c).find(x=>x.invoiceId===id)!;

  const correction:FinanceEntry={id:`credit:${id}:${i.creditCents+amountCents}`,sourceId:old.sourceId,date:c.clock.date,description:`${i.description} · credit: ${reason}`,category:i.category,cashCents:0,relevantCents:i.direction==='expense'?-Math.round(relevant(i)*fraction):0,excludedCents:i.direction==='expense'&&i.account==='expenses'?-Math.round((i.amountCents-relevant(i))*fraction):0,kind:'adjustment',basis:'career_action',accountLines:journalLinesForObligation(old,'recognition',amountCents).map(l=>({account:l.account,debitCents:l.creditCents,creditCents:l.debitCents}))};

  return refreshFinance(put({...c,finance:{...c.finance!,book:{...b,entries:recognised?[...b.entries,correction]:b.entries}}},{...o,invoices:o.invoices.map(row=>row.id===id?{...row,creditCents:row.creditCents+amountCents,revision:row.revision+1,reason}:row)}));

}

export function cancelFinanceInvoice(career:CareerState,id:string,reason:string):CareerState {

  const c=ready(career),i=financeInvoiceViews(c).find(i=>i.id===id);if(!i)throw new Error('Invoice not found.');

  if(i.paidCents>0)throw new Error('Issue a credit and record an agreed refund for a paid invoice.');

  const next=i.amountCents>i.creditCents?creditFinanceInvoice(c,id,i.amountCents-i.creditCents,reason):c,o=getFinanceOperations(next);

  return put(next,{...o,invoices:o.invoices.map(row=>row.id===id?{...row,status:'cancelled',reason}:row)});

}

export function refundFinanceInvoice(career:CareerState,id:string,amountCents:number,reason:string):CareerState {

  let c=ready(career);const o=getFinanceOperations(c),i=financeInvoiceViews(c).find(i=>i.id===id);editable(c);

  if(!i||!safe(amountCents)||!amountCents||amountCents>Math.max(0,i.paidCents-(i.amountCents-i.creditCents))||!required(reason))throw new Error('A refund requires an issued credit and an overpaid balance.');

  const sid=`refund:${id}:${o.settlements.length}`,income=i.direction==='income';

  if(income&&c.finance!.book!.cashKnown&&financeOperationsSummary(c).accounts.cash<amountCents)throw new Error('Cash does not cover the customer refund.');

  const entry:FinanceEntry={id:sid,sourceId:i.sourceId??`invoice:${id}`,obligationId:`invoice:${id}`,date:c.clock.date,description:`${i.description} · refund: ${reason}`,category:i.category,cashCents:(income?-1:1)*amountCents,relevantCents:0,excludedCents:0,kind:'adjustment',basis:'career_action',accountLines:income?[{account:c.clock.date<i.recognitionDate?'deferred_income':'receivables',debitCents:amountCents,creditCents:0},{account:'cash',debitCents:0,creditCents:amountCents}]:[{account:'cash',debitCents:amountCents,creditCents:0},{account:c.clock.date<i.recognitionDate?'prepayments':'payables',debitCents:0,creditCents:amountCents}]};

  c=put({...c,finance:{...c.finance!,book:{...c.finance!.book!,entries:[...c.finance!.book!.entries,entry]}}},{...o,settlements:[...o.settlements,{id:sid,invoiceId:id,date:c.clock.date,amountCents,kind:'refund'}]});return refreshFinance(c);

}

export function amendFinanceAgreement(career:CareerState,id:string,patch:Partial<FinanceAgreementInput>,reason:string):CareerState {

  let c=ready(career),o=getFinanceOperations(c);const old=o.agreements.find(a=>a.id===id);editable(c);

  if(!old||!required(reason))throw new Error('Choose an agreement and record the reason for the amendment.');

  if(old.kind==='loan'&&financeInvoiceViews(c).some(i=>i.agreementId===id&&i.direction==='income'&&i.paidCents>0))throw new Error('A drawn loan remains payable. Record refinancing as a new loan and settle the old balance explicitly.');

  const nextDue=o.invoices.filter(i=>i.agreementId===id&&!i.sourceId?.startsWith('agreement-bonus:')&&i.status==='open'&&i.dueDate>=c.clock.date&&financeInvoiceViews(c).find(v=>v.id===i.id)!.paidCents===0).map(i=>i.dueDate).sort()[0]??c.clock.date;

  const input={...old,...patch,id,startDate:patch.startDate??nextDue};checkAgreement(c,input);

  if(o.invoices.some(i=>i.agreementId===id&&i.recognitionDate>=input.startDate&&financeInvoiceViews(c).find(v=>v.id===i.id)!.paidCents>0))throw new Error('Credit or refund prepaid future invoices before amending their covered period.');

  for(const i of o.invoices.filter(i=>i.agreementId===id&&!i.sourceId?.startsWith('agreement-bonus:')&&i.status==='open'&&i.recognitionDate>=c.clock.date&&financeInvoiceViews(c).find(v=>v.id===i.id)!.paidCents===0))c=cancelFinanceInvoice(c,i.id,reason);

  o=getFinanceOperations(c);

  const next:FinanceAgreement={...input,revision:old.revision+1,createdOn:old.createdOn,status:'active',amendments:[...old.amendments,{date:c.clock.date,reason,previous:structuredClone(old)}]};

  return processFinance(materialize(put(c,{...o,agreements:o.agreements.map(a=>a.id===id?next:a)})));

}

export function cancelFinanceAgreement(career:CareerState,id:string,reason:string):CareerState {

  let c=ready(career),o=getFinanceOperations(c);editable(c);if(!o.agreements.some(a=>a.id===id)||!required(reason))throw new Error('Record the cancellation reason.');

  if(loanOutstandingCents(c,id)>0)throw new Error('A drawn loan cannot be cancelled while principal remains outstanding. Record repayment or refinancing.');

  for(const i of o.invoices.filter(i=>i.agreementId===id&&!i.sourceId?.startsWith('agreement-bonus:')&&i.status==='open'&&i.recognitionDate>=c.clock.date&&financeInvoiceViews(c).find(v=>v.id===i.id)!.paidCents===0))c=cancelFinanceInvoice(c,i.id,reason);

  o=getFinanceOperations(c);return put(c,{...o,agreements:o.agreements.map(a=>a.id===id?{...a,status:'cancelled',cancelledOn:c.clock.date,note:`${a.note}\nCancelled: ${reason}`} :a)});

}

export function loanOutstandingCents(career:CareerState,id:string):number {

  if(!getFinanceOperations(career).agreements.some(a=>a.id===id&&a.kind==='loan'))return 0;

  const invoices=financeInvoiceViews(career).filter(i=>i.agreementId===id&&i.account==='loans');

  return Math.max(0,invoices.reduce((s,i)=>s+(i.direction==='income'?i.paidCents:-i.paidCents),0));

}

export function repayFinanceLoanEarly(career:CareerState,id:string,feeCents:number,reference:string):CareerState {

  let c=ready(career),o=getFinanceOperations(c),loan=o.agreements.find(a=>a.id===id&&a.kind==='loan');editable(c);

  const outstanding=loanOutstandingCents(c,id);

  if(!loan||!outstanding||!safe(feeCents)||!required(reference))throw new Error('Choose an outstanding loan and record the agreed early-repayment terms and fee (including zero).');

  if(c.finance!.book!.cashKnown&&financeOperationsSummary(c).accounts.cash-(o.opening?.restrictedCents??0)<outstanding+feeCents)throw new Error('Cash does not cover full principal and the agreed repayment fee.');

  // Existing accrued interest remains payable; future principal/interest schedules

  // are replaced by the explicit early principal settlement.

  const rows=financeInvoiceViews(c).filter(i=>i.agreementId===id&&i.direction==='expense'&&i.state!=='paid'&&i.status==='open');

  for(const i of rows)if(i.account==='loans'||i.recognitionDate>c.clock.date){if(i.outstandingCents)c=creditFinanceInvoice(c,i.id,i.outstandingCents,reference);}

  c=recordFinanceInvoice(c,{id:`early-repayment:${id}:${c.clock.date}`,agreementId:id,sourceId:`agreement:${id}`,partyId:loan.partyId,description:`${loan.title} · agreed early principal repayment`,direction:'expense',amountCents:outstanding,recognitionDate:c.clock.date,dueDate:c.clock.date,category:'other',classification:'excluded',relevantPercent:0,account:'loans',autoSettle:true,note:reference,basis:'recorded'});

  if(feeCents)c=recordFinanceInvoice(c,{id:`early-repayment-fee:${id}:${c.clock.date}`,agreementId:id,sourceId:`agreement:${id}`,partyId:loan.partyId,description:`${loan.title} · agreed repayment fee`,direction:'expense',amountCents:feeCents,recognitionDate:c.clock.date,dueDate:c.clock.date,category:'other',classification:loan.classification,relevantPercent:loan.relevantPercent,account:'expenses',autoSettle:true,note:reference,basis:'recorded'});

  return c;

}

export function saveFinanceBudget(career:CareerState,input:FinanceBudget):CareerState {

  const c=ready(career),o=getFinanceOperations(c);editable(c);if(!required(input.id)||!Number.isInteger(input.year)||input.year<Number(c.clock.date.slice(0,4))||!safe(input.limitCents)||!required(input.note))throw new Error('Record a future/current year, budget limit and approval note.');

  return put(c,{...o,budgets:[...o.budgets.filter(b=>b.year!==input.year||b.department!==input.department),{...input,approvedOn:c.clock.date}]});

}

export function saveFinanceScenario(career:CareerState,input:FinanceScenario):CareerState {

  const c=ready(career),o=getFinanceOperations(c);if(!required(input.id)||!required(input.name)||!Array.isArray(input.items)||new Set(input.items.map(i=>i.id)).size!==input.items.length||input.items.some(i=>!required(i.id)||!required(i.description)||!date(i.dueDate)||i.dueDate<c.clock.date||!Number.isSafeInteger(i.amountCents)||!safe(i.relevantCents)))throw new Error('Record valid dated scenario items.');

  return put(c,{...o,scenarios:[...o.scenarios.filter(s=>s.id!==input.id),structuredClone(input)]});

}

export function setFinanceCoverage(career:CareerState,input:{funding:boolean;operating:boolean}):CareerState {const c=ready(career),o=getFinanceOperations(c);return put(c,{...o,coverage:{...input}});}

export function financeOperationsSummary(career:CareerState):FinanceOperationsSummary {

  const c=ready(career),b=c.finance!.book!,o=getFinanceOperations(c),invoices=financeInvoiceViews(c),ledger=Object.fromEntries(accounts.map(a=>[a,0])) as Record<FinanceAccount,number>;

  ledger.cash=b.openingCashCents;ledger.loans=b.openingDebtCents?-b.openingDebtCents:0;ledger.opening_equity=-b.openingCashCents+b.openingDebtCents;

  let journalBalanced=true;

  for(const e of b.entries){let lines=e.accountLines;

    if(!lines){if(e.kind==='payment'||e.cashCents)lines=[{account:'cash',debitCents:Math.max(0,e.cashCents),creditCents:Math.max(0,-e.cashCents)},{account:'opening_equity',debitCents:Math.max(0,-e.cashCents),creditCents:Math.max(0,e.cashCents)}];else lines=[];}

    if(lines.reduce((n,l)=>n+l.debitCents-l.creditCents,0)!==0)journalBalanced=false;

    for(const l of lines)ledger[l.account]+=l.debitCents-l.creditCents;

  }

  const year=Number(c.clock.date.slice(0,4)),all=financeObligations(c,Math.max(year,...o.budgets.map(b=>b.year))),unresolvedCents=invoices.filter(i=>i.direction==='expense'&&i.classification==='unresolved'&&i.status!=='cancelled'&&i.recognitionDate.startsWith(String(year))).reduce((s,i)=>s+i.amountCents-i.creditCents,0);

  return {operations:o,invoices,accounts:ledger,journalBalanced,entries:b.entries,receivableCents:Math.max(0,ledger.receivables),payableCents:Math.max(0,-ledger.payables),overdueCents:invoices.filter(i=>i.state==='overdue'&&i.direction==='expense').reduce((s,i)=>s+i.outstandingCents,0),debtCents:b.debtKnown?Math.max(0,-ledger.loans):null,restrictedCents:o.opening?.restrictedCents??null,unresolvedCents,

    budgetRows:o.budgets.map(budget=>{const spentCents=b.entries.filter(e=>{const order=b.manufacturing?.orders.find(o=>e.sourceId===`manufacturing-credit:${o.id}`);const department=order?(order.assetLifeMonths?'capital':order.kind==='production'?'production':order.kind==='facility'?'facilities':order.kind==='travel'?'travel':order.kind==='supplier'?'other':'development'):e.category;return e.date.startsWith(String(budget.year))&&department===budget.department&&e.kind!=='payment';}).reduce((s,e)=>s+(e.accountLines?e.accountLines.filter(l=>['expenses','inventory','fixed_assets'].includes(l.account)).reduce((n,l)=>n+l.debitCents-l.creditCents,0):e.relevantCents+e.excludedCents),0),committedCents=all.filter(x=>x.category===budget.department&&x.recognitionDate.startsWith(String(budget.year))&&!b.entries.some(e=>e.id===`${x.id}:recognition`)).reduce((s,x)=>s+Math.max(0,-x.amountCents),0);return {...budget,spentCents,committedCents,remainingCents:budget.limitCents-spentCents-committedCents};})};

}

export function financeForecast(career:CareerState,{throughYear,scenarioId}:{throughYear:number;scenarioId?:string}):FinanceForecastResult {

  const c=ready(career),b=c.finance!.book!,o=getFinanceOperations(c),year=Number(c.clock.date.slice(0,4));

  if(!Number.isInteger(throughYear)||throughYear<year||throughYear>year+10)throw new Error('Choose a forecast of up to ten future seasons.');

  const all=financeObligations(c,throughYear),payments=all.map(x=>({...x,remaining:remainingFinancePayment(c,x)})).filter(x=>x.remaining!==0),scenario=o.scenarios.find(s=>s.id===scenarioId);

  let cash=b.cashKnown?b.openingCashCents+b.entries.reduce((s,e)=>s+e.cashCents,0):null,scenarioCash=cash,minCash=cash,minDate=c.clock.date;

  const months:FinanceForecastResult['months']=[],years:FinanceForecastResult['years']=[];

  for(let y=year;y<=throughYear;y++){

    let income=0,expenses=0;const rules=currentFinanceRules(c,y),recorded=b.entries.filter(e=>e.date.startsWith(String(y))).reduce((s,e)=>s+e.relevantCents,0),planned=all.filter(p=>p.recognitionDate.startsWith(String(y))&&!b.entries.some(e=>e.id===`${p.id}:recognition`)).reduce((s,p)=>s+p.relevantCents,0);

    const relevant=Math.max(0,recorded+planned+projectedCompliance(c,all,y)+(y===Number(b.activatedOn.slice(0,4))?b.openingRelevantCents:0)-financeAdjustments(rules));

    for(let m=y===year?Number(c.clock.date.slice(5,7)):1;m<=12;m++){

      const end=lastDay(y,m),start=`${y}-${String(m).padStart(2,'0')}-01`,rows=payments.filter(p=>p.dueDate<=end&&(p.dueDate>=start||months.length===0)),mi=rows.reduce((s,p)=>s+Math.max(0,p.remaining),0),me=rows.reduce((s,p)=>s+Math.max(0,-p.remaining),0);

      income+=mi;expenses+=me;

      if(cash!==null){for(const d of [...new Set(rows.map(p=>p.dueDate))].sort()){cash+=rows.filter(p=>p.dueDate===d).reduce((s,p)=>s+p.remaining,0);if(minCash===null||cash<minCash){minCash=cash;minDate=d<c.clock.date?c.clock.date:d;}}}

      if(scenarioCash!==null)scenarioCash+=mi-me+(scenario?.items.filter(i=>i.dueDate>=start&&i.dueDate<=end).reduce((s,i)=>s+i.amountCents,0)??0);

      const recognised=b.entries.filter(e=>e.date>=start&&e.date<=end).reduce((s,e)=>s+e.relevantCents,0);

      const toRecognise=all.filter(p=>p.recognitionDate>=start&&p.recognitionDate<=end&&!b.entries.some(e=>e.id===`${p.id}:recognition`)).reduce((s,p)=>s+p.relevantCents,0);

      months.push({date:end,income:mi,expenses:me,cash,relevant:recognised+toRecognise,scenarioCash});

    }

    years.push({year:y,income,expenses,cash,relevant,cap:financeCap(rules),headroom:financeCap(rules)-relevant-(scenario?.items.filter(i=>i.dueDate.startsWith(String(y))).reduce((s,i)=>s+i.relevantCents,0)??0)});

  }

  const missing=[...(!b.cashKnown?['Opening cash is not recorded.']:[]),...(!o.coverage.funding?['Funding and income coverage has not been confirmed.']:[]),...(!o.coverage.operating?['Operating cost coverage has not been confirmed.']:[])];

  return {months,years,minCash,minDate,complete:missing.length===0,missing,scenarioName:scenario?.name??null};

}

export function closeFinancePeriod(career:CareerState,year:number,note:string,audited=false):CareerState {

  let c=ready(career);const o=getFinanceOperations(c);if(!Number.isInteger(year)||`${year}-12-31`>c.clock.date||!required(note))throw new Error('A reporting year can close only after its end, with a review note.');

  if(o.periods.some(p=>p.year===year))throw new Error('This period is already closed.');

  c=processFinance(c);const summary=financeOperationsSummary(c),b=c.finance!.book!,entries=b.entries.filter(e=>e.date.startsWith(String(year))),rules=currentFinanceRules(c,year),unresolved=summary.invoices.filter(i=>i.recognitionDate.startsWith(String(year))&&i.classification==='unresolved'&&i.status!=='cancelled').reduce((s,i)=>s+i.amountCents-i.creditCents,0);

  if(unresolved)throw new Error('Resolve cost-cap classifications before closing the year.');

  if(!summary.journalBalanced)throw new Error('Resolve the journal imbalance before closing the year.');

  const relevant=Math.max(0,entries.reduce((s,e)=>s+e.relevantCents,0)+(year===Number(b.activatedOn.slice(0,4))?b.openingRelevantCents:0)-financeAdjustments(rules));

  return put(c,{...getFinanceOperations(c),periods:[...o.periods,{year,status:audited?'audited':'closed',closedOn:c.clock.date,cashCents:b.cashKnown?b.openingCashCents+b.entries.filter(e=>e.date<=`${year}-12-31`).reduce((s,e)=>s+e.cashCents,0):null,incomeCents:entries.flatMap(e=>e.accountLines??[]).filter(l=>l.account==='revenue').reduce((s,l)=>s+l.creditCents-l.debitCents,0),expenseCents:entries.flatMap(e=>e.accountLines??[]).filter(l=>l.account==='expenses').reduce((s,l)=>s+l.debitCents-l.creditCents,0),relevantCents:relevant,excludedCents:entries.reduce((s,e)=>s+e.excludedCents,0),unresolvedCents:unresolved,capCents:financeCap(rules),note}]});

}

export function recordFinanceRules(career:CareerState,rule:FinanceRuleSet,note:string):CareerState {

  const c=ready(career),b=c.finance!.book!;editable(c,`${rule.year}-12-31`);

  if(!Number.isInteger(rule.year)||rule.year<Number(c.clock.date.slice(0,4))||![rule.baseCapCents,rule.extraRaceCents,rule.sprintAdjustmentCents,rule.carryForwardCents,rule.integrationAdjustmentCents].every(safe)||!Number.isFinite(rule.indexationPercent)||rule.indexationPercent<0||!required(note))throw new Error('Record valid season rules and their supporting reference.');

  if(rule.carryForwardCents>Math.round(200_000_000*(1+rule.indexationPercent/100)))throw new Error('The unused-cap allowance exceeds the season limit.');

  if(rule.carryForwardCents>0&&!getFinanceOperations(c).ruleDeterminations?.some(d=>d.year===rule.year&&d.carryForwardCents>=rule.carryForwardCents))throw new Error('Carry-forward needs a recorded regulatory determination.');

  if(rule.carryForwardCents>0&&!getFinanceOperations(c).periods.some(p=>p.year===rule.year-1&&p.status==='audited'&&p.capCents-p.relevantCents>=rule.carryForwardCents))throw new Error('Carry-forward needs an audited prior-year surplus.');

  return refreshFinance({...c,finance:{...c.finance!,book:{...b,rules:[...b.rules.filter(r=>r.year!==rule.year),{...rule,assumptions:[...rule.assumptions,note]}]}}});

}

export function saveFinanceOwner(career:CareerState,owner:OwnerIdentity):CareerState {

  const c=ready(career),o=getFinanceOperations(c);if(!required(owner.id)||!required(owner.name)||!required(owner.kind))throw new Error('Record the owner identity.');

  return saveFinanceCounterparty(put(c,{...o,ownership:{...o.ownership,owners:[...o.ownership.owners.filter(p=>p.id!==owner.id),owner]}}),{id:owner.id,name:owner.name,kind:'owner'});

}

export function recordFinanceStake(career:CareerState,input:OwnershipPeriod):CareerState {

  const c=ready(career),o=getFinanceOperations(c);if(!o.ownership.owners.some(p=>p.id===input.ownerId)||!date(input.from)||(input.percentage!==null&&(!Number.isFinite(input.percentage)||input.percentage<0||input.percentage>100)))throw new Error('Record an owner, effective date and valid stake or unknown.');

  const periods=o.ownership.periods.filter(p=>!(p.teamId===input.teamId&&p.ownerId===input.ownerId&&p.from===input.from));

  if(input.percentage!==null&&periods.filter(p=>p.teamId===input.teamId&&p.from<=input.from&&(!p.until||p.until>=input.from)).reduce((s,p)=>s+(p.percentage??0),0)+input.percentage>100.00001)throw new Error('Recorded ownership exceeds 100%.');

  return put(c,{...o,ownership:{...o.ownership,periods:[...periods,{...input,basis:'career_generated'}]}});

}

export function recordFinanceOwnershipTransfer(career:CareerState,input:FinanceOperations['transfers'][number]):CareerState {

  const c=ready(career),o=getFinanceOperations(c);idate(c,input.date);if(!required(input.id)||o.transfers.some(t=>t.id===input.id)||(input.priceCents!==null&&!safe(input.priceCents)))throw new Error('Record a unique transfer and valid price or unknown.');

  return put(c,{...o,ownership:transferTeamStake(o.ownership,input),transfers:[...o.transfers,{...input}]});

}

/** Materialise only explicit agreements. No funding, price or operating assumptions are added. */

export function processFinanceOperations(career:CareerState,on:string):CareerState {return processAgreementBonuses(materialize(initializeFinanceOperations(career)),on);}

export function financeOperationsScheduleDates(c:CareerState):string[]{return [...new Set(financeOperationsObligations(c).flatMap(i=>[i.dueDate,i.recognitionDate]))];}

export function validFinanceOperations(value:unknown):boolean {

  if(value===undefined)return true;

  const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);

  const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;

  const whole=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v);

  const unsigned=(v:unknown):v is number=>whole(v)&&v>=0;

  const positive=(v:unknown):v is number=>unsigned(v)&&v>0;

  const isDate=(v:unknown):v is string=>validContractDate(v);

  const year=(v:unknown):v is number=>whole(v)&&v>=1950&&v<=9999;

  const percent=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100;

  const option=(v:unknown,choices:readonly string[])=>typeof v==='string'&&choices.includes(v);

  const uniqueIds=(rows:unknown[])=>rows.every(r=>object(r)&&text(r.id))&&new Set(rows.map(r=>(r as {id:string}).id)).size===rows.length;

  const category=(v:unknown)=>option(v,['owner_funding','sponsorship','prize_receipts','commercial_income','driver_pay','driver_bonus','contract_exit','staff_pay','facilities','travel','development','production','capital','depreciation','other']);

  try{

    if(!object(value)||value.version!==1)return false;

    const arrayKeys=['counterparties','agreements','invoices','settlements','budgets','scenarios','periods','findings','transfers','eventReceipts'];

    if(!arrayKeys.every(k=>Array.isArray(value[k])))return false;

    const o=value as unknown as FinanceOperations;

    if(!['counterparties','agreements','invoices','settlements','budgets','scenarios','findings','transfers'].every(k=>uniqueIds(value[k] as unknown[])))return false;

    if(o.personnelCoverage!==undefined&&typeof o.personnelCoverage!=='boolean')return false;

    if(o.ruleDeterminations!==undefined&&(!Array.isArray(o.ruleDeterminations)||!o.ruleDeterminations.every(d=>object(d)&&year(d.year)&&isDate(d.date)&&text(d.reference)&&unsigned(d.carryForwardCents))))return false;

    if(o.appliedProfiles!==undefined&&(!Array.isArray(o.appliedProfiles)||!o.appliedProfiles.every(p=>object(p)&&text(p.id)&&text(p.version)&&text(p.note)&&isDate(p.appliedOn))))return false;

    if(!object(o.coverage)||typeof o.coverage.funding!=='boolean'||typeof o.coverage.operating!=='boolean')return false;

    if(!o.eventReceipts.every(text)||new Set(o.eventReceipts).size!==o.eventReceipts.length)return false;

    if(o.opening!==undefined){const p=o.opening;if(!object(p)||!isDate(p.asOf)||![p.cashCents,p.restrictedCents,p.debtCents].every(n=>n===null||unsigned(n))||!option(p.basis,['recorded','scenario'])||!text(p.note))return false;

      if(p.restrictedCents!==null&&(p.cashCents===null||Number(p.restrictedCents)>Number(p.cashCents)))return false;

    }

    if(!o.counterparties.every(p=>object(p)&&text(p.id)&&text(p.name)&&option(p.kind,['owner','sponsor','supplier','lender','employee','championship','customer','other'])))return false;

    const parties=new Set(o.counterparties.map(p=>p.id)),agreementIds=new Set(o.agreements.map(a=>a.id)),invoiceIds=new Set(o.invoices.map(i=>i.id));

    const invoiceShape=(i:unknown)=>object(i)&&text(i.id)&&text(i.description)&&text(i.partyId)&&parties.has(i.partyId)&&option(i.direction,['income','expense'])&&positive(i.amountCents)&&isDate(i.recognitionDate)&&isDate(i.dueDate)&&category(i.category)&&option(i.classification,['relevant','excluded','mixed','unresolved'])&&percent(i.relevantPercent)&&option(i.account,accounts)&&typeof i.autoSettle==='boolean'&&typeof i.note==='string'&&(i.basis===undefined||option(i.basis,['recorded','scenario']))&&(i.sourceId===undefined||text(i.sourceId))&&(i.agreementId===undefined||(text(i.agreementId)&&agreementIds.has(i.agreementId)))&&!(i.direction==='income'&&['relevant','mixed'].includes(String(i.classification)));

    const agreementShape=(a:unknown):boolean=>{

      if(!object(a)||!text(a.id)||!text(a.title)||!text(a.partyId)||!parties.has(a.partyId)||!option(a.kind,['owner_equity','loan','sponsorship','prize','merchandise','hospitality','licensing','supplier','staff','lease','travel','other'])||!option(a.direction,['income','expense'])||!positive(a.amountCents)||!isDate(a.startDate)||!isDate(a.endDate)||a.endDate<a.startDate||Number(a.endDate.slice(0,4))-Number(a.startDate.slice(0,4))>20||!option(a.frequency,['once','monthly','quarterly','annual'])||!category(a.category)||!option(a.classification,['relevant','excluded','mixed','unresolved'])||!percent(a.relevantPercent)||!option(a.account,accounts)||typeof a.autoSettle!=='boolean'||typeof a.guaranteed!=='boolean'||!text(a.note)||!option(a.basis,['recorded','scenario']))return false;

      if(a.direction==='income'&&['relevant','mixed'].includes(String(a.classification)))return false;

      if(a.kind==='owner_equity'&&(a.direction!=='income'||a.account!=='equity'))return false;

      if(a.instalments!==undefined){if(!Array.isArray(a.instalments)||!a.instalments.length||!uniqueIds(a.instalments)||!a.instalments.every(s=>object(s)&&positive(s.amountCents)&&isDate(s.dueDate)&&isDate(s.recognitionDate)&&s.dueDate>=String(a.startDate)&&s.dueDate<=String(a.endDate)&&s.recognitionDate>=String(a.startDate))||a.instalments.reduce((sum,s)=>sum+Number(s.amountCents),0)!==a.amountCents)return false;}

      if(a.loan!==undefined){if(!object(a.loan)||!percent(a.loan.annualInterestPercent)||!isDate(a.loan.repaymentStart)||a.loan.repaymentStart<=a.startDate||!whole(a.loan.repaymentMonths)||a.loan.repaymentMonths<1||a.loan.repaymentMonths>240)return false;}

      if(a.kind==='loan'&&a.loan===undefined)return false;

      if(a.bonus!==undefined&&(!object(a.bonus)||!option(a.bonus.trigger,['race_win','race_podium','constructors_title'])||!unsigned(a.bonus.amountCents)||!unsigned(a.bonus.annualCapCents)))return false;

      return true;

    };

    if(!o.agreements.every(a=>agreementShape(a)&&positive(a.revision)&&option(a.status,['active','cancelled'])&&isDate(a.createdOn)&&Array.isArray(a.amendments)&&a.amendments.every(m=>object(m)&&isDate(m.date)&&text(m.reason)&&agreementShape(m.previous)&&m.previous.id===a.id)))return false;

    if(!o.invoices.every(i=>invoiceShape(i)&&option(i.status,['open','cancelled','disputed'])&&unsigned(i.creditCents)&&i.creditCents<=i.amountCents&&positive(i.revision)&&isDate(i.createdOn)&&(i.reason===undefined||text(i.reason))))return false;

    if(!o.settlements.every(s=>object(s)&&text(s.id)&&text(s.invoiceId)&&invoiceIds.has(s.invoiceId)&&isDate(s.date)&&positive(s.amountCents)&&option(s.kind,['payment','refund'])))return false;

    if(!o.budgets.every(b=>object(b)&&text(b.id)&&year(b.year)&&category(b.department)&&unsigned(b.limitCents)&&isDate(b.approvedOn)&&text(b.note)))return false;

    if(!o.scenarios.every(s=>object(s)&&text(s.id)&&text(s.name)&&Array.isArray(s.items)&&uniqueIds(s.items)&&s.items.every(i=>object(i)&&text(i.description)&&isDate(i.dueDate)&&whole(i.amountCents)&&unsigned(i.relevantCents))))return false;

    if(!o.periods.every(p=>object(p)&&year(p.year)&&option(p.status,['closed','audited'])&&isDate(p.closedOn)&&(p.cashCents===null||whole(p.cashCents))&&unsigned(p.incomeCents)&&unsigned(p.expenseCents)&&unsigned(p.relevantCents)&&whole(p.excludedCents)&&unsigned(p.unresolvedCents)&&unsigned(p.capCents)&&text(p.note))||new Set(o.periods.map(p=>p.year)).size!==o.periods.length)return false;

    if(!o.findings.every(f=>object(f)&&text(f.id)&&year(f.year)&&isDate(f.date)&&option(f.kind,['warning','overspend','late_report','resolved'])&&text(f.description)&&unsigned(f.penaltyCents)&&text(f.source)))return false;

    if(!object(o.ownership)||!Array.isArray(o.ownership.owners)||!Array.isArray(o.ownership.periods)||!uniqueIds(o.ownership.owners)||!o.ownership.owners.every(p=>object(p)&&text(p.name)&&text(p.kind)))return false;

    const ownerIds=new Set(o.ownership.owners.map(p=>p.id)),periods=o.ownership.periods;

    if(!periods.every(p=>object(p)&&text(p.teamId)&&text(p.ownerId)&&ownerIds.has(p.ownerId)&&(p.percentage===null||percent(p.percentage))&&isDate(p.from)&&(p.until===null||(isDate(p.until)&&p.until>=p.from))&&option(p.basis,['reference','game_assumption','career_generated'])))return false;

    for(let i=0;i<periods.length;i++){

      const p=periods[i];

      if(periods.slice(i+1).some(q=>p.teamId===q.teamId&&p.ownerId===q.ownerId&&p.from<=(q.until??'9999-12-31')&&q.from<=(p.until??'9999-12-31')))return false;

      if(periods.filter(q=>q.teamId===p.teamId&&q.from<=p.from&&(q.until===null||q.until>=p.from)).reduce((sum,q)=>sum+(q.percentage??0),0)>100.00001)return false;

    }

    if(!o.transfers.every(t=>object(t)&&text(t.id)&&isDate(t.date)&&text(t.teamId)&&text(t.fromOwnerId)&&text(t.toOwnerId)&&t.fromOwnerId!==t.toOwnerId&&ownerIds.has(t.fromOwnerId)&&ownerIds.has(t.toOwnerId)&&percent(t.percentage)&&t.percentage>0&&(t.priceCents===null||unsigned(t.priceCents))))return false;

    return true;

  }catch{return false;}

}
