import type {CareerState,FinanceState} from './types';
import type {FinanceBook,FinanceCategory,FinanceObligation} from './financeTypes';
import {assessFinancialCommitment,commitFinanceObligation,initializeFinance,processFinance,refreshFinance} from './financeEngine';
import {financeForecast,financeOperationsSummary,getFinanceOperations,saveFinanceCounterparty,recordFinanceInvoice,settleFinanceInvoice,financeInvoiceViews} from './financeOperations';
import {personnelFinanceState} from './personnelFinance';
import {teams} from '../data/grid';

export type RivalFinanceProposal={id:string;title:string;priority:'mandatory'|'strategic'|'optional';objective:string;reserveCents:number;obligation:FinanceObligation};
export type RivalFinanceDecision={teamId:string;proposalId:string;decision:'approve'|'defer'|'decline'|'funding_required';reasons:string[];cashCents:number|null;departmentRemainingCents:number|null};
type TeamFinance=FinanceState&{teamBooks?:Record<string,FinanceBook>};
const knownTeam=(id:string)=>teams.some(t=>t.id===id);

/** A detached view: examining a rival cannot rewrite the player's book or inject starting money. */
export function financeTeamCareer(career:CareerState,teamId:string):CareerState {
  if(!knownTeam(teamId))throw new Error('Choose a recorded championship team.');
  if(teamId===career.player.teamId)return initializeFinance(career);
  const book=(career.finance as TeamFinance|undefined)?.teamBooks?.[teamId];
  const base=initializeFinance({...career,player:{...career.player,teamId},finance:undefined});
  return book?refreshFinance({...base,finance:{...base.finance!,book}}):base;
}

/** Retain the player's career identity while persisting a selected team's own book. */
export function saveFinanceTeamCareer(career:CareerState,view:CareerState):CareerState {
  if(view.metadata.careerId!==career.metadata.careerId)throw new Error('The finance view belongs to a different career.');
  if(!knownTeam(view.player.teamId)||!view.finance?.book)throw new Error('The team finance book is missing.');
  if(view.player.teamId===career.player.teamId)return {...career,finance:{...view.finance,teamBooks:(career.finance as TeamFinance|undefined)?.teamBooks} as TeamFinance};
  const c=initializeFinance(career),f=c.finance as TeamFinance;
  return {...c,finance:{...f,teamBooks:{...f.teamBooks,[view.player.teamId]:view.finance.book}} as TeamFinance};
}

/** Advance only explicitly recorded rival books. There are no automatic funding or signing decisions. */
export function processRivalFinances(career:CareerState,date=career.clock.date):CareerState {
  let funded=mirrorReleaseReceipts(career,date);
  const books=(funded.finance as TeamFinance|undefined)?.teamBooks;
  if(!books||!Object.keys(books).length)return funded;
  let state=funded;
  for(const id of Object.keys(books).sort()){
    if(id===career.player.teamId||date<books[id].processedThrough)continue;
    const view=financeTeamCareer(state,id);
    const next=processFinance({...view,clock:{...view.clock,date}},date);
    state=saveFinanceTeamCareer(state,next);
  }
  return state;
}
/** A paid inter-team release is the other team's receivable/receipt, never fresh funding. */
export function mirrorReleaseReceipts(career:CareerState,on=career.clock.date):CareerState {
  let c=career;
  for(const draft of career.contractDesk?.drafts??[]){
    if(draft.teamId!==career.player.teamId||!draft.appointment||!draft.negotiation||draft.negotiation.startDate>on)continue;
    const agreements=personnelFinanceState(career).releaseAgreements.filter(a=>a.personId===draft.personId&&a.toTeamId===draft.teamId&&a.startsOn===draft.negotiation!.startDate&&!a.voidedOn);
    const paid=career.finance?.book?.entries.find(e=>e.id===`release:${draft.id}:payment`&&e.cashCents<0);
    for(const agreement of agreements){
      if(!agreement.amountCents)continue;
      let view=financeTeamCareer(c,agreement.fromTeamId),id=`release-receipt:${agreement.id}`;
      view={...view,clock:{...view.clock,date:on}};
      if(!getFinanceOperations(view).counterparties.some(p=>p.id===`team:${draft.teamId}`))view=saveFinanceCounterparty(view,{id:`team:${draft.teamId}`,name:teams.find(t=>t.id===draft.teamId)?.name??draft.teamId,kind:'other'});
      if(!getFinanceOperations(view).invoices.some(i=>i.id===id))view=recordFinanceInvoice(view,{id,partyId:`team:${draft.teamId}`,sourceId:`release:${agreement.id}`,description:'Agreed driver release compensation',direction:'income',amountCents:agreement.amountCents,recognitionDate:on,dueDate:on,category:'contract_exit',classification:'excluded',relevantPercent:0,account:'revenue',autoSettle:false,note:agreement.agreementReference,basis:'recorded'});
      const invoice=financeInvoiceViews(view).find(i=>i.id===id)!;
      if(paid&&invoice.outstandingCents>0)view=settleFinanceInvoice(view,id,invoice.outstandingCents,`interteam:${agreement.id}`);
      c=saveFinanceTeamCareer(c,view);
    }
  }
  return c;
}

/** Financial judgement uses recorded objectives and budgets, never hidden ability or prestige defaults. */
export function assessRivalFinanceDecision(career:CareerState,teamId:string,proposal:RivalFinanceProposal):RivalFinanceDecision {
  if(!proposal.id||!proposal.title.trim()||!['mandatory','strategic','optional'].includes(proposal.priority)||!Number.isSafeInteger(proposal.reserveCents)||proposal.reserveCents<0)throw new Error('Record a proposal ID, purpose, priority and non-negative cash reserve.');
  if(!proposal.obligation.id||!proposal.obligation.sourceId||!proposal.obligation.counterparty.trim()||!Number.isSafeInteger(proposal.obligation.amountCents)||proposal.obligation.amountCents>=0||!Number.isSafeInteger(proposal.obligation.relevantCents)||proposal.obligation.relevantCents<0||proposal.obligation.relevantCents>-proposal.obligation.amountCents)throw new Error('Record a supplier, positive expense and a relevant cost no greater than the expense.');
  const view=financeTeamCareer(career,teamId),operations=financeOperationsSummary(view),year=Number(proposal.obligation.dueDate.slice(0,4));
  const forecast=financeForecast(view,{throughYear:Math.max(view.season.year,year)}),coverage=getFinanceOperations(view).coverage;
  const cash=view.finance!.book!.cashKnown?Math.round(view.finance!.cashBalance*100):null;
  const department=operations.budgetRows.find(b=>b.year===year&&b.department===proposal.obligation.category);
  const base={teamId,proposalId:proposal.id,cashCents:cash,departmentRemainingCents:department?.remainingCents??null};
  const reasons:string[]=[];
  if(cash===null)reasons.push('Opening cash has not been recorded for this team.');
  if(!coverage.funding)reasons.push('Funding and income coverage has not been confirmed.');
  if(!coverage.operating)reasons.push('Operating cost coverage has not been confirmed.');
  if(reasons.length)return {...base,decision:'defer',reasons};
  const cost=Math.max(0,-proposal.obligation.amountCents);
  const issues=assessFinancialCommitment(view,cost,proposal.obligation.relevantCents,proposal.obligation.dueDate);
  const month=forecast.months.find(m=>m.date>=proposal.obligation.dueDate);
  if(month?.cash!==null&&month?.cash!==undefined&&month.cash-cost<proposal.reserveCents)issues.push('The proposal would consume the recorded liquidity reserve.');
  if(department&&cost>department.remainingCents)issues.push('The approved department budget does not cover this proposal.');
  if(issues.length)return {...base,decision:proposal.priority==='mandatory'?'funding_required':'decline',reasons:[...new Set(issues)]};
  if(proposal.priority!=='mandatory'&&!department)return {...base,decision:'defer',reasons:['Approve a department budget before authorising discretionary spending.']};
  if(proposal.priority==='strategic'&&!proposal.objective.trim())return {...base,decision:'defer',reasons:['Record the team objective served by this strategic proposal.']};
  return {...base,decision:'approve',reasons:[proposal.priority==='mandatory'?'Recorded mandatory obligation is covered.':`Covered by the cash forecast and approved ${proposal.obligation.category.replaceAll('_',' ')} budget.`,...(proposal.objective.trim()?[`Purpose: ${proposal.objective.trim()}`]:[])]};
}

/** Evaluate explicit proposals in priority order; accepted commitments affect every later decision. */
export function executeRivalFinancePlan(career:CareerState,teamId:string,proposals:RivalFinanceProposal[]):{career:CareerState;decisions:RivalFinanceDecision[]} {
  if(new Set(proposals.map(p=>p.id)).size!==proposals.length)throw new Error('Each proposal requires a unique ID.');
  let state=career;const decisions:RivalFinanceDecision[]=[];
  const priority={mandatory:0,strategic:1,optional:2};
  for(const proposal of [...proposals].sort((a,b)=>priority[a.priority]-priority[b.priority]||a.id.localeCompare(b.id))){
    const view=financeTeamCareer(state,teamId);
    if(view.finance!.book!.obligations.some(o=>o.id===proposal.obligation.id)){
      const same=view.finance!.book!.obligations.find(o=>o.id===proposal.obligation.id)!;
      if(JSON.stringify(same)!==JSON.stringify(proposal.obligation))throw new Error('A proposal reuses an existing obligation ID with different terms.');
      decisions.push({teamId,proposalId:proposal.id,decision:'approve',reasons:['This commitment has already been recorded.'],cashCents:view.finance!.book!.cashKnown?Math.round(view.finance!.cashBalance*100):null,departmentRemainingCents:null});continue;
    }
    const decision=assessRivalFinanceDecision(state,teamId,proposal);decisions.push(decision);
    if(decision.decision==='approve')state=saveFinanceTeamCareer(state,commitFinanceObligation(view,proposal.obligation));
  }
  return {career:state,decisions};
}

export function rivalDepartmentOptions():FinanceCategory[]{return ['driver_pay','staff_pay','development','production','facilities','travel','capital','other'];}
