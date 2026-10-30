import type {CareerState} from './types';
import type {ContractFact,ContractRole,ContractSlot} from './contracts';

/** Resolve the seat at the proposed date while preserving the imported reference unchanged. */
export function effectiveContractSeat(career:CareerState,teamId:string,role:ContractRole,seat:1|2,date:string):{slot:ContractSlot|undefined;fact:ContractFact|undefined}{
  const desk=career.contractDesk;
  const latest=desk?.drafts.filter(d=>d.teamId===teamId&&d.role===role&&d.seat===seat&&d.appointment&&['active','scheduled','expired'].includes(d.appointment.status)&&d.negotiation&&d.negotiation.startDate<=date).sort((a,b)=>a.negotiation!.startDate.localeCompare(b.negotiation!.startDate)).at(-1);
  const baseline=desk?.baseline.slots.find(s=>s.teamId===teamId&&s.role===role&&s.number===seat);
  if(!latest||!latest.negotiation)return {slot:baseline,fact:desk?.baseline.facts.find(f=>f.personId===baseline?.personId&&f.teamId===teamId&&f.role===role)};
  if(date>latest.negotiation.endDate)return {slot:{teamId,role,number:seat,personId:null,status:'vacant'},fact:undefined};
  const term=latest.negotiation,clause=(kind:string)=>term.clauses.find(c=>c.kind===kind)?.value;
  const entries=[{kind:'termination_protection',parameters:{remainingBaseSalaryPercent:clause('protection')??100}},{kind:'loyalty_bonus',parameters:{annualCents:Math.round((clause('loyalty')??0)*100)}},{kind:'salary_escalator',parameters:{annualPercent:clause('increase')??0,firstSeason:Number(term.startDate.slice(0,4))+1}},...(clause('release')!==undefined?[{kind:'release_fee',parameters:{amountCents:Math.round(clause('release')!*100)}}]:[])];
  const fact:ContractFact={id:`negotiated:${latest.id}`,personId:latest.personId,teamId,role,status:'confirmed',minimumEnd:null,exactEnd:Number(term.endDate.slice(0,4)),salaryCents:latest.salaryCents,sourceUrl:'https://game.local/negotiated-contract',checkedOn:latest.appointment!.signedOn,notes:'Career contract',scenarioTerms:{endSeason:Number(term.endDate.slice(0,4)),endBasis:'game_assumption',seatBasis:'game_assumption'},clausePackage:{version:'negotiated-v1',personSlug:latest.personId,teamId,role,startSeason:Number(term.startDate.slice(0,4)),endSeason:Number(term.endDate.slice(0,4)),category:'Negotiated',rationale:'Agreed in this career',clauses:entries.map(e=>({...e,title:e.kind,terms:'Negotiated term',basis:'game_assumption',execution:'recorded_only'}))}};
  return {slot:{teamId,role,number:seat,personId:latest.personId,status:'career_contract'},fact};
}
