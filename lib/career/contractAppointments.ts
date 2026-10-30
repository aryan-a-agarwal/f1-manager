import {checkNewFinanceCommitments} from './financeOperations';
import type {CareerState,SeasonLineup,WorkforceAgreement,WorkforcePerson,DriverStanding} from './types';
import {negotiationCosts} from './negotiation';
import {canonicalOffer} from './offerNegotiation';
import type {ContractDraft} from './contracts';
import {financeSummary,processFinance} from './financeEngine';
import {driverReleaseReplacementCandidates,matchingDriverReleaseAgreement} from './personnelFinance';

function seatRole(d:ContractDraft):WorkforceAgreement['role']{return `${d.role==='race_driver'?'driver':'reserve'}_${d.seat}` as WorkforceAgreement['role'];}
function overlaps(a:string,b:string,c:string,d:string){return a<=d&&c<=b;}
/** Validate a signing without spending a budget or inventing consent from another team. */
export function appointmentBlockers(career:CareerState,draft:ContractDraft):string[]{
  const desk=career.contractDesk,offer=draft.offerState?.acceptedOffer,terms=draft.negotiation;
  if(!desk||!offer||draft.offerState?.status!=='accepted'||!terms)return ['The driver has not agreed these terms.'];
  if(canonicalOffer(offer)!==canonicalOffer({role:draft.role,seat:draft.seat,salaryCents:draft.salaryCents,terms}))return ['The saved terms differ from the driver’s agreement.'];
  if(terms.startDate<career.clock.date)return ['The agreed start date has passed; renegotiation is required.'];
  if(draft.teamId!==career.player.teamId)return ['Only your team can sign this agreement.'];
  let costs:ReturnType<typeof negotiationCosts>;
  try{costs=negotiationCosts(career,draft.personId,draft.role,draft.seat,draft.salaryCents,terms);}catch(e){return [e instanceof Error?e.message:'The contract terms are invalid.'];}
  const errors:string[]=[];
  if(costs.severance===null||costs.outgoingLoyalty===null)errors.push('The outgoing appointment or its termination compensation is unresolved.');
  if(costs.incomingRelease.total===null)errors.push('The incoming driver’s current appointment or release cost is unresolved.');
  if(costs.incomingRelease.contracts.some(c=>c.basis!=='agreed_release'))errors.push('The incoming driver’s current team must agree their release.');
  if(draft.role==='race_driver'){
    const driverId=desk.baseline.people.find(p=>p.id===draft.personId)?.careerDriverId;
    const year=Number(terms.startDate.slice(0,4)),lineups=career.workforce.lineups.filter(l=>l.season===(career.workforce.lineups.some(p=>p.season===year)?year:career.season.year));
    for(const other of lineups.filter(l=>l.teamId!==draft.teamId&&!!driverId&&l.driverIds.includes(driverId))){
      const release=matchingDriverReleaseAgreement(career,draft.personId,other.teamId,terms.startDate);
      if(!release?.replacementDriverId)errors.push('The releasing team must record an available replacement driver before this occupied race seat can be transferred.');
      else if(!driverReleaseReplacementCandidates(career,other.teamId,terms.startDate).some(p=>p.id===release.replacementDriverId))errors.push('The releasing team’s recorded replacement is no longer available for this date.');
    }
  }
  if(costs.issues.some(i=>i.includes('overlaps the driver’s current appointment')))errors.push('An early renewal needs an agreed contract amendment.');
  if(costs.issues.some(i=>i.includes('Career line-up differs')))errors.push('The current seat differs from the contract record and needs reconciliation.');
  const competing=desk.drafts.filter(d=>d.id!==draft.id&&d.appointment&&d.appointment.status!=='expired'&&d.negotiation&&overlaps(terms.startDate,terms.endDate,d.negotiation.startDate,d.negotiation.endDate));
  if(competing.some(d=>d.teamId===draft.teamId&&d.role===draft.role&&d.seat===draft.seat))errors.push('Another signed appointment already occupies this seat during the proposed term.');
  if(draft.role==='race_driver'&&competing.some(d=>d.personId===draft.personId&&d.role==='race_driver'))errors.push('This driver has another overlapping race appointment.');
  if(draft.role==='reserve_driver'&&competing.some(d=>d.personId===draft.personId&&d.teamId===draft.teamId&&d.role==='reserve_driver'))errors.push('This driver already has a reserve appointment with your team.');
  if(draft.role==='race_driver'&&career.weekendOperations.activeWeekendId&&terms.startDate===career.clock.date)errors.push('A race weekend is already in progress; a race seat cannot change until it ends.');
  if(career.finance?.book&&costs.severance!==null&&costs.outgoingLoyalty!==null&&costs.incomingRelease.total!==null){
    const trial:CareerState={...career,contractDesk:{...desk,drafts:desk.drafts.map(d=>d.id===draft.id?{...d,appointment:{status:'scheduled',signedOn:career.clock.date,terminationCents:costs.severance!+costs.outgoingLoyalty!,releaseCents:costs.incomingRelease.total!}}:d)}};
    try{checkNewFinanceCommitments(trial);}catch(e){errors.push(e instanceof Error?e.message:'The signed package is not financially covered.');}
  }
  return [...new Set(errors)];
}
export function signAgreedContract(career:CareerState,id:string):CareerState{
  const desk=career.contractDesk,draft=desk?.drafts.find(d=>d.id===id);
  if(!desk||!draft)throw new Error('The agreed contract was not found.');
  if(draft.appointment)return career;
  const blockers=appointmentBlockers(career,draft);if(blockers.length)throw new Error(blockers.join(' '));
  const terms=draft.negotiation!,costs=negotiationCosts(career,draft.personId,draft.role,draft.seat,draft.salaryCents,terms);
  const next={...career,contractDesk:{...desk,drafts:desk.drafts.map(d=>d.id===id?{...d,appointment:{status:'scheduled' as const,signedOn:career.clock.date,terminationCents:(costs.severance??0)+(costs.outgoingLoyalty??0),releaseCents:costs.incomingRelease.total??0,...(d.role==='reserve_driver'?{reservePriority:'race_first' as const}:{})}}:d)}};
  return processFinance(applyDueContractAppointments(next,career.clock.date));
}
/** Apply only complete, due appointments. Block rather than duplicate a race driver or alter an active weekend. */
export function applyDueContractAppointments(career:CareerState,date:string):CareerState{
  let state=career;
  const ids=career.contractDesk?.drafts.filter(d=>d.appointment&&d.negotiation&&['scheduled','blocked','active'].includes(d.appointment.status)).map(d=>d.id)??[];
  for(const id of ids){
    const desk=state.contractDesk!,draft=desk.drafts.find(d=>d.id===id)!,appointment=draft.appointment!,terms=draft.negotiation!;
    const update=(patch:Partial<NonNullable<ContractDraft['appointment']>>)=>{state={...state,contractDesk:{...state.contractDesk!,drafts:state.contractDesk!.drafts.map(d=>d.id===id?{...d,appointment:{...d.appointment!,...patch}}:d)}};};
    if(date>terms.endDate){if(appointment.status!=='expired')update({status:'expired',blockReason:undefined});continue;}
    if(appointment.status==='active'||date<terms.startDate)continue;
    const year=Number(date.slice(0,4));
    // Season rollover creates the next year's lineups before an appointment can activate.
    const target=state.workforce.lineups.find(l=>l.season===year&&l.teamId===draft.teamId);
    if(!target){update({status:'blocked',blockReason:'The destination season has not started yet.'});continue;}
    const person=desk.baseline.people.find(p=>p.id===draft.personId);
    if(!person){update({status:'blocked',blockReason:'The driver identity is missing from the career.'});continue;}
    const driverId=person.careerDriverId??`contract:${person.id}`;
    let releasedLineup:SeasonLineup|undefined,releaseReplacement:string|undefined;
    if(draft.role==='race_driver'){
      const other=state.workforce.lineups.find(l=>l.season===year&&l.teamId!==draft.teamId&&l.driverIds.includes(driverId));
      if(state.weekendOperations.activeWeekendId){update({status:'blocked',blockReason:'A race weekend is in progress. The appointment will be checked again after it ends.'});continue;}
      if(target.driverIds[draft.seat===1?1:0]===driverId){update({status:'blocked',blockReason:'The driver already occupies your other race seat.'});continue;}
      if(other){
        const release=matchingDriverReleaseAgreement(state,draft.personId,other.teamId,terms.startDate);
        if(!release?.replacementDriverId||!driverReleaseReplacementCandidates(state,other.teamId,terms.startDate).some(p=>p.id===release.replacementDriverId)){update({status:'blocked',blockReason:'The releasing team needs recorded consent and an available explicit replacement before its occupied race seat can transfer.'});continue;}
        releasedLineup=other;releaseReplacement=release.replacementDriverId;
      }
    }else if(target.reserveDriverIds?.[draft.seat===1?1:0]===driverId){update({status:'blocked',blockReason:'The driver already occupies your other reserve seat.'});continue;}
    const role=seatRole(draft),oldPersonId=draft.role==='race_driver'?target.driverIds[draft.seat-1]:target.reserveDriverIds?.[draft.seat-1];
    const lineups=state.workforce.lineups.map((l):SeasonLineup=>{
      if(l===releasedLineup&&releaseReplacement){const drivers:[string,string]=[...l.driverIds];drivers[drivers.indexOf(driverId)]=releaseReplacement;const reserves=l.reserveDriverIds?.map(id=>id===releaseReplacement?null:id) as [string|null,string|null]|undefined;return {...l,driverIds:drivers,...(reserves?{reserveDriverIds:reserves}:{}),provenance:'career_generated'};}
      if(l!==target)return l;
      if(draft.role==='race_driver'){const drivers:[string,string]=[...l.driverIds];drivers[draft.seat-1]=driverId;return {...l,driverIds:drivers,provenance:'career_generated'};}
      const reserves:[string|null,string|null]=l.reserveDriverIds?[...l.reserveDriverIds]:[null,null];reserves[draft.seat-1]=driverId;return {...l,reserveDriverIds:reserves,provenance:'career_generated'};
    });
    const people:WorkforcePerson[]=state.workforce.people.some(p=>p.id===driverId)?state.workforce.people:[...state.workforce.people,{id:driverId,name:person.name,kind:'driver',carNumber:null,provenance:'career_generated'}];
    const agreements=state.workforce.agreements.map(a=>a.teamId===draft.teamId&&a.role===role&&a.personId===oldPersonId&&(!a.terminatedOn||a.terminatedOn>terms.startDate)?{...a,terminatedOn:terms.startDate}:a);
    if(releasedLineup&&releaseReplacement){
      for(let index=0;index<agreements.length;index++){const a=agreements[index];if(a.teamId===releasedLineup.teamId&&a.personId===driverId&&a.role.startsWith('driver_')&&(!a.terminatedOn||a.terminatedOn>terms.startDate))agreements[index]={...a,terminatedOn:terms.startDate};}
      const replacementRole=`driver_${releasedLineup.driverIds.indexOf(driverId)+1}` as 'driver_1'|'driver_2',replacementId=`release-replacement:${id}`;
      if(!agreements.some(a=>a.id===replacementId))agreements.push({id:replacementId,personId:releaseReplacement,teamId:releasedLineup.teamId,role:replacementRole,startSeason:year,endSeason:null,startDate:terms.startDate,salary:null,termKnown:false,provenance:'career_generated'});
    }
    if(!agreements.some(a=>a.id===`negotiated:${id}`))agreements.push({id:`negotiated:${id}`,personId:driverId,teamId:draft.teamId,role,startSeason:Number(terms.startDate.slice(0,4)),endSeason:Number(terms.endDate.slice(0,4)),startDate:terms.startDate,endDate:terms.endDate,salary:draft.salaryCents,termKnown:true,salaryBasis:'game_estimate',termBasis:'game_assumption',provenance:'career_generated'});
    let championship=state.championship;
    if(draft.role==='race_driver'&&championship.year===year){
      const appointments=[{id:driverId,teamId:draft.teamId,name:person.name},...(releasedLineup&&releaseReplacement?[{id:releaseReplacement,teamId:releasedLineup.teamId,name:people.find(p=>p.id===releaseReplacement)!.name}]:[])];
      const drivers:DriverStanding[]=championship.drivers.map(row=>{const appointment=appointments.find(a=>a.id===row.driverId);return appointment?{...row,teamId:appointment.teamId}:row;});
      for(const appointment of appointments)if(!drivers.some(row=>row.driverId===appointment.id))drivers.push({driverId:appointment.id,driverName:appointment.name,teamId:appointment.teamId,points:0,wins:0,podiums:0,finishes:{}});
      championship={...championship,drivers};
    }
    state={...state,championship,workforce:{...state.workforce,people,agreements,lineups},contractDesk:{...desk,baseline:{...desk.baseline,people:desk.baseline.people.map(p=>p.id===person.id?{...p,careerDriverId:driverId}:p)},drafts:desk.drafts.map(d=>d.id===id?{...d,appointment:{...appointment,status:'active',blockReason:undefined}}:d)}};
  }
  return state;
}
