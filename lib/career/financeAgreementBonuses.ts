import type {CareerState,CalendarSession,SessionOutput,WeekendSnapshot} from './types';
import type {FinanceBook} from './financeTypes';
import type {FinanceAgreement,FinanceAgreementInput,FinanceInvoice} from './financeOperationsTypes';
import {creditFinanceInvoice} from './financeOperations';
import {validContractDate} from './negotiation';
import {compareStandings} from './scoring';

type BonusTerms={trigger:'race_win'|'race_podium'|'constructors_title';amountCents:number;annualCapCents:number};
export type AgreementBonusAward={id:string;agreementId:string;year:number;eventId:string;amountCents:number;fingerprint:string;revision:number;earnedOn:string;partyId:string;title:string;category:FinanceAgreement['category'];basis:FinanceAgreement['basis'];autoSettle:boolean;terms:BonusTerms};
type BonusBook=FinanceBook&{agreementBonusAwards?:AgreementBonusAward[]};
const min=(a:string,b:string)=>a<b?a:b;
const max=(a:string,b:string)=>a>b?a:b;
function stamp(value:unknown){const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function selectedTerms(a:FinanceAgreement,on:string,old:AgreementBonusAward|undefined):{terms:BonusTerms;partyId:string;title:string;category:FinanceAgreement['category'];basis:FinanceAgreement['basis'];autoSettle:boolean}|null{
  // An earned entitlement retains its agreed terms when an agreement is amended.
  if(old)return {terms:old.terms,partyId:old.partyId,title:old.title,category:old.category,basis:old.basis,autoSettle:old.autoSettle};
  const cancelledOn=(a as FinanceAgreement&{cancelledOn?:string}).cancelledOn;
  if(a.status==='cancelled'&&(!cancelledOn||on>=cancelledOn))return null;
  const amendments=[...a.amendments].sort((x,y)=>x.date.localeCompare(y.date));
  let selected:FinanceAgreementInput=a;
  for(let i=0;i<amendments.length;i++){
    const next=amendments[i+1]?.previous??a,effective=max(amendments[i].date,next.startDate);
    if(on<effective){selected=amendments[i].previous;break;}
  }
  if(on<selected.startDate||on>selected.endDate||!selected.bonus)return null;
  return {terms:structuredClone(selected.bonus),partyId:selected.partyId,title:selected.title,category:selected.category,basis:selected.basis,autoSettle:selected.autoSettle};
}
type ResultEvent={eventId:string;on:string;session:CalendarSession;result:SessionOutput|undefined;snapshot:WeekendSnapshot|undefined};
function results(c:CareerState):ResultEvent[]{return c.season.calendar.rounds.flatMap(round=>round.sessions.filter(s=>s.kind==='race').map(session=>({eventId:session.id,on:session.date,session,result:c.weekendOperations.outputs.filter(r=>r.sessionId===session.id).at(-1),snapshot:c.weekendOperations.snapshots.find(s=>s.roundId===round.id)}))).sort((a,b)=>a.on.localeCompare(b.on)||a.eventId.localeCompare(b.eventId));}
function invoiceOutstanding(c:CareerState,i:FinanceInvoice):number{
  const o=c.finance!.book!.operations!,automatic=c.finance!.book!.entries.filter(e=>e.obligationId===`invoice:${i.id}`&&e.kind==='payment').reduce((sum,e)=>sum+Math.abs(e.cashCents),0);
  const manual=o.settlements.filter(s=>s.invoiceId===i.id).reduce((sum,s)=>sum+(s.kind==='refund'?-s.amountCents:s.amountCents),0);
  return Math.max(0,i.amountCents-i.creditCents-automatic-manual);
}
function appendInvoice(c:CareerState,invoice:FinanceInvoice):CareerState{
  const b=c.finance!.book!,o=b.operations!;
  if(o.invoices.some(i=>i.id===invoice.id))return c;
  return {...c,finance:{...c.finance!,book:{...b,operations:{...o,invoices:[...o.invoices,invoice]}}}};
}

/** Explicit agreement bonuses become receivables only when an actual result earns them. */
export function processAgreementBonuses(career:CareerState,date=career.clock.date):CareerState{
  const book=career.finance?.book as BonusBook|undefined,operations=book?.operations;if(!book||!operations)return career;
  const oldAwards=book.agreementBonusAwards??[];
  if(!operations.agreements.some(a=>a.bonus)&&!oldAwards.length)return career;
  const desired=new Map<string,Omit<AgreementBonusAward,'revision'>>(),events=results(career).filter(e=>e.on>=book.activatedOn&&e.on<=date);
  for(const agreement of operations.agreements){
    if(!agreement.bonus&&!oldAwards.some(a=>a.agreementId===agreement.id))continue;
    const used=new Map<number,number>();
    for(const e of events){
      const id=`${agreement.id}:${e.eventId}`,old=oldAwards.find(a=>a.id===id),policy=selectedTerms(agreement,e.on,old);
      if(!policy||policy.terms.trigger==='constructors_title')continue;
      const final=e.session.status==='completed'&&e.result?.completionMode==='simulated'&&e.snapshot!==undefined;
      if(!final&&e.session.status!=='cancelled'&&!old)continue;
      const eligibleIds=new Set(e.snapshot?.participants.filter(p=>p.teamId===career.player.teamId).map(p=>p.driverId)??[]);
      const qualified=final&&e.result!.classification.some(r=>eligibleIds.has(r.driverId)&&r.status==='classified'&&(policy.terms.trigger==='race_win'?r.position===1:r.position<=3));
      const year=Number(e.on.slice(0,4)),remaining=Math.max(0,policy.terms.annualCapCents-(used.get(year)??0)),amount=qualified?Math.min(policy.terms.amountCents,remaining):0;
      used.set(year,(used.get(year)??0)+amount);
      if(amount||old)desired.set(id,{id,agreementId:agreement.id,year,eventId:e.eventId,amountCents:amount,fingerprint:stamp({resultId:e.result?.id,classification:e.result?.classification,status:e.session.status,mode:e.result?.completionMode,participants:e.snapshot?.participants.map(p=>[p.teamId,p.driverId]),amount}),earnedOn:e.on,...policy});
    }
    const titleId=`${agreement.id}:constructors-title:${career.season.year}`,oldTitle=oldAwards.find(a=>a.id===titleId),finalRaceDate=career.season.calendar.rounds.flatMap(r=>r.sessions.filter(s=>s.kind==='race').map(s=>s.date)).sort().at(-1)??date;
    const titleTerms=selectedTerms(agreement,finalRaceDate,oldTitle);
    const seasonFinal=career.season.phase==='offseason'&&career.season.calendar.rounds.every(r=>r.status==='archived')&&career.championship.teams.some(t=>t.points>0);
    if(titleTerms?.terms.trigger==='constructors_title'&&(seasonFinal||oldTitle)){
      const standings=[...career.championship.teams].sort(compareStandings),qualified=seasonFinal&&standings[0]?.teamId===career.player.teamId,amount=qualified?Math.min(titleTerms.terms.amountCents,titleTerms.terms.annualCapCents):0;
      if(amount||oldTitle)desired.set(titleId,{id:titleId,agreementId:agreement.id,year:career.season.year,eventId:`constructors-title:${career.season.year}`,amountCents:amount,fingerprint:stamp({standings:standings.map(t=>[t.teamId,t.points,t.wins,t.finishes]),final:seasonFinal,amount}),earnedOn:min(date,`${career.season.year}-12-31`),...titleTerms});
    }
  }
  let c=career,awards=[...oldAwards],changed=false;
  for(const [id,wanted] of desired){
    const old=awards.find(a=>a.id===id),delta=wanted.amountCents-(old?.amountCents??0);
    if(delta===0&&old?.fingerprint===wanted.fingerprint)continue;
    const revision=(old?.revision??0)+1;awards=awards.filter(a=>a.id!==id).concat({...wanted,revision});changed=true;
    const sourceId=`agreement-bonus:${id}`,recognitionDate=old?date:wanted.earnedOn;
    const invoice=(amountCents:number,direction:'income'|'expense',suffix=''):FinanceInvoice=>({id:`${sourceId}:r${revision}${suffix}`,agreementId:wanted.agreementId,sourceId,partyId:wanted.partyId,description:`${wanted.title} · ${wanted.terms.trigger==='constructors_title'?'constructors’ championship':wanted.terms.trigger==='race_win'?'Grand Prix win':'Grand Prix podium'} bonus${old?' correction':''}`,direction,amountCents,recognitionDate,dueDate:max(date,recognitionDate),category:wanted.category,classification:'excluded',relevantPercent:0,account:'revenue',autoSettle:wanted.autoSettle,note:`Earned agreement term. Event ${wanted.eventId}; revision ${revision}.`,basis:wanted.basis,status:'open',createdOn:date,creditCents:0,revision:1});
    if(delta>0)c=appendInvoice(c,invoice(delta,'income'));
    if(delta<0){
      let reduction=-delta;
      // Credit unpaid receivables first. Received income instead becomes an agreed
      // recovery payable, which can remain overdue if cash is insufficient.
      const priorIncome=[...c.finance!.book!.operations!.invoices].filter(i=>i.sourceId===sourceId&&i.direction==='income'&&i.status!=='cancelled').reverse();
      for(const i of priorIncome){if(!reduction)break;const credit=Math.min(reduction,invoiceOutstanding(c,i));if(credit){c=creditFinanceInvoice(c,i.id,credit,`Corrected result ${wanted.eventId}`);reduction-=credit;}}
      if(reduction)c=appendInvoice(c,invoice(reduction,'expense',':recovery'));
    }
  }
  if(!changed)return career;
  const b=c.finance!.book!;
  return {...c,finance:{...c.finance!,book:{...b,agreementBonusAwards:awards} as BonusBook}};
}

export function validAgreementBonusAwards(value:unknown):boolean{
  if(value===undefined)return true;
  const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v),text=(v:unknown)=>typeof v==='string'&&v.trim().length>0,unsigned=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
  const categories=['owner_funding','sponsorship','prize_receipts','commercial_income','driver_pay','driver_bonus','contract_exit','staff_pay','facilities','travel','development','production','capital','depreciation','other'];
  try{return Array.isArray(value)&&new Set(value.map(a=>a.id)).size===value.length&&value.every(a=>record(a)&&text(a.id)&&text(a.agreementId)&&text(a.eventId)&&unsigned(a.year)&&Number(a.year)>=1950&&Number(a.year)<=9999&&unsigned(a.amountCents)&&text(a.fingerprint)&&unsigned(a.revision)&&Number(a.revision)>0&&validContractDate(a.earnedOn)&&Number(a.earnedOn.slice(0,4))===a.year&&text(a.partyId)&&text(a.title)&&categories.includes(String(a.category))&&['recorded','scenario'].includes(String(a.basis))&&typeof a.autoSettle==='boolean'&&record(a.terms)&&['race_win','race_podium','constructors_title'].includes(String(a.terms.trigger))&&unsigned(a.terms.amountCents)&&unsigned(a.terms.annualCapCents));}catch{return false;}
}
