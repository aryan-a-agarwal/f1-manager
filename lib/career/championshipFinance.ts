import type {CareerState} from './types';
import {getFinanceOperations,recordFinanceInvoice,saveFinanceCounterparty} from './financeOperations';
import {validContractDate} from './negotiation';
import {compareStandings} from './scoring';

export type ChampionshipPrizePolicy={id:string;year:number;name:string;basis:'scenario'|'recorded';reference:string;payoutsCents:number[];paymentDates:string[];recordedOn:string};
export type ChampionshipEntitlement={id:string;policyId:string;teamId:string;year:number;position:number;amountCents:number;awardedOn:string};
export type ChampionshipFinanceState={version:1;policies:ChampionshipPrizePolicy[];entitlements:ChampionshipEntitlement[]};
export function championshipFinanceState(c:CareerState):ChampionshipFinanceState{return c.finance?.book?.championshipFinance??{version:1,policies:[],entitlements:[]};}
export function recordChampionshipPrizePolicy(career:CareerState,input:Omit<ChampionshipPrizePolicy,'recordedOn'>):CareerState {
  if(!career.finance?.book||!input.id||!input.name.trim()||!input.reference.trim()||!Number.isInteger(input.year)||input.year<career.season.year||!['scenario','recorded'].includes(input.basis)||input.payoutsCents.length!==career.championship.teams.length||input.payoutsCents.some(n=>!Number.isSafeInteger(n)||n<0)||!input.paymentDates.length||input.paymentDates.some(d=>!validContractDate(d)||d<`${input.year}-12-31`))throw new Error('Record a supported payout for every constructor position, payment dates after the season and the policy source.');
  const previous=championshipFinanceState(career);if(previous.policies.some(p=>p.id===input.id||p.year===input.year))throw new Error('A prize policy is already recorded for this year.');
  return {...career,finance:{...career.finance,book:{...career.finance.book,championshipFinance:{...previous,policies:[...previous.policies,{...input,paymentDates:[...input.paymentDates].sort(),recordedOn:career.clock.date}]}}}};
}
/** Championship money becomes a receivable only after a completed, scored season. */
export function awardChampionshipEntitlement(career:CareerState,year=career.season.year):CareerState {
  const state=championshipFinanceState(career),policy=state.policies.find(p=>p.year===year),already=state.entitlements.some(e=>e.teamId===career.player.teamId&&e.year===year);
  if(!policy||already)return career;
  const archived=career.seasonHistory.find(a=>a.year===year),championship=archived?.championship??career.championship;
  if(!archived&&(career.season.phase!=='offseason'||!career.season.calendar.rounds.every(r=>r.status==='archived')))throw new Error('Finalise the championship before awarding its distribution.');
  const calendar=archived?.calendar??career.season.calendar;
  if(!(archived?.results??career.weekendOperations.outputs).some(o=>o.completionMode==='simulated'&&calendar.rounds.some(r=>r.sessions.some(s=>s.id===o.sessionId&&s.kind==='race'))))return career;
  const position=[...championship.teams].sort(compareStandings).findIndex(t=>t.teamId===career.player.teamId)+1;if(position<1)throw new Error('The team is missing from final standings.');
  const amount=policy.payoutsCents[position-1],id=`prize:${policy.id}:${career.player.teamId}`;
  let c=career;
  if(amount){
    const party='championship-distribution';if(!getFinanceOperations(c).counterparties.some(p=>p.id===party))c=saveFinanceCounterparty(c,{id:party,name:policy.name,kind:'championship'});
    let allocated=0;
    for(let i=0;i<policy.paymentDates.length;i++){
      const cumulative=Math.round(amount*(i+1)/policy.paymentDates.length),payment=cumulative-allocated;allocated=cumulative;if(!payment)continue;
      const dueDate=policy.paymentDates[i]<c.clock.date?c.clock.date:policy.paymentDates[i];
      c=recordFinanceInvoice(c,{id:`${id}:${i}`,sourceId:id,description:`${policy.name} · ${year} position ${position}`,partyId:party,direction:'income',amountCents:payment,recognitionDate:c.clock.date,dueDate,category:'prize_receipts',classification:'excluded',relevantPercent:0,account:'revenue',autoSettle:true,note:policy.reference,basis:policy.basis});
    }
  }
  const next=championshipFinanceState(c);
  return {...c,finance:{...c.finance!,book:{...c.finance!.book!,championshipFinance:{...next,entitlements:[...next.entitlements,{id,policyId:policy.id,teamId:c.player.teamId,year,position,amountCents:amount,awardedOn:c.clock.date}]}}}};
}
export function validChampionshipFinance(v:unknown):boolean {
  if(v===undefined)return true;if(!v||typeof v!=='object')return false;const s=v as ChampionshipFinanceState;
  return s.version===1&&Array.isArray(s.policies)&&Array.isArray(s.entitlements)&&s.policies.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.reference==='string'&&Number.isInteger(p.year)&&Array.isArray(p.payoutsCents)&&p.payoutsCents.every(n=>Number.isSafeInteger(n)&&n>=0)&&Array.isArray(p.paymentDates)&&p.paymentDates.every(validContractDate)&&validContractDate(p.recordedOn))&&s.entitlements.every(e=>e&&typeof e.id==='string'&&Number.isInteger(e.position)&&e.position>0&&Number.isSafeInteger(e.amountCents)&&e.amountCents>=0&&validContractDate(e.awardedOn));
}
