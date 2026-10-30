import type {CareerState} from './types';
import {contractSalary,type ContractFact,type ContractRole} from './contracts';
import {effectiveContractSeat} from './contractEffective';
import {matchingDriverReleaseAgreement} from './personnelFinance';

export const OFFER_CLAUSES = [
  {kind:'signing',label:'Signing payment',unit:'USD',max:1e9},
  {kind:'loyalty',label:'Annual loyalty payment',unit:'USD',max:1e9},
  {kind:'increase',label:'Annual salary increase',unit:'%',max:100},
  {kind:'win',label:'Grand Prix win bonus',unit:'USD',max:1e9},
  {kind:'podium',label:'Grand Prix podium bonus',unit:'USD',max:1e9},
  {kind:'points',label:'Grand Prix points-finish bonus',unit:'USD',max:1e9},
  {kind:'champion',label:'Drivers’ championship win bonus',unit:'USD',max:1e9},
  {kind:'appearance',label:'Reserve race-start fee',unit:'USD',max:1e9},
  {kind:'practice',label:'Guaranteed practice appearances per season',unit:'sessions',max:24},
  {kind:'simulator',label:'Simulator / coaching days per season',unit:'days',max:100},
  {kind:'commercial',label:'Maximum sponsor appearance days per season',unit:'days',max:100},
  {kind:'parity',label:'Equal equipment access',unit:'promise',max:1},
  {kind:'promotion',label:'Annual race-seat promotion review',unit:'promise',max:1},
  {kind:'release',label:'Fixed release fee payable to the team',unit:'USD',max:1e9},
  {kind:'protection',label:'Termination compensation: remaining salary guaranteed',unit:'%',max:100},
] as const;
export type OfferClause={kind:typeof OFFER_CLAUSES[number]['kind'];value:number};
export type NegotiationTerms={startDate:string;endDate:string;clauses:OfferClause[]};
const day=86400000;
export function validContractDate(s:unknown):s is string {
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;
}
export function validNegotiation(v:unknown):v is NegotiationTerms {
  if(!v||typeof v!=='object')return false;
  const t=v as NegotiationTerms;
  return validContractDate(t.startDate)&&validContractDate(t.endDate)&&t.endDate>=t.startDate&&Number(t.endDate.slice(0,4))-Number(t.startDate.slice(0,4))<5&&Array.isArray(t.clauses)&&t.clauses.every(c=>{
    if(!c||typeof c!=='object')return false;
    const spec=OFFER_CLAUSES.find(s=>s.kind===c.kind);
    return !!spec&&Number.isFinite(c.value)&&c.value>=0&&c.value<=spec.max&&(spec.unit==='USD'?Number.isSafeInteger(Math.round(c.value*100)):Number.isInteger(c.value));
  })&&new Set(t.clauses.map(c=>c.kind)).size===t.clauses.length;
}
export function salaryBetween(annualCents:number,from:string,to:string,baseYear:number,increase=0,firstIncrease=baseYear+1){
  if(to<from)return 0;
  let total=0;
  for(let y=Number(from.slice(0,4));y<=Number(to.slice(0,4));y++){
    const a=Date.parse((from>`${y}-01-01`?from:`${y}-01-01`)+'T00:00:00Z');
    const b=Date.parse((to<`${y}-12-31`?to:`${y}-12-31`)+'T00:00:00Z');
    const yearDays=(Date.UTC(y+1,0,1)-Date.UTC(y,0,1))/day;
    total+=annualCents*Math.pow(1+increase/100,Math.max(0,y-firstIncrease+1))*((b-a)/day+1)/yearDays;
  }
  return Math.round(total);
}

function contractParameter(fact:ContractFact,kind:string,key:string):number|null {
  const values=fact.clausePackage?.clauses.find(c=>c.kind===kind)?.parameters as Record<string,unknown>|undefined;
  return typeof values?.[key]==='number'&&Number.isSafeInteger(values[key])&&Number(values[key])>=0?values[key] as number:null;
}

export type IncomingReleaseCost={teamId:string;role:ContractRole;endDate:string|null;amount:number|null;remainingSalary:number|null;guaranteePercent:number|null;protectedLoyalty:number|null;basis:'fixed_fee'|'estimated_termination'|'agreed_release'|'unresolved'};

/** Estimates the fee payable to another team for releasing its driver; no contract is terminated here. */
export function incomingReleaseCosts(career:CareerState,personId:string,startDate:string,targetRole:ContractRole='race_driver'):{contracts:IncomingReleaseCost[];known:number;total:number|null}{
  const desk=career.contractDesk;
  const facts=desk?.baseline.facts.filter(f=>f.personId===personId)??[];
  if(!desk||!facts.length)return {contracts:[],known:0,total:null};
  const contracts:IncomingReleaseCost[]=[];
  for(const fact of facts){
    if(fact.teamId===career.player.teamId)continue;
    // A reserve appointment can coexist with another team's seat or reserve role.
    // A race-seat transfer does not itself terminate unrelated reserve agreements.
    if(targetRole==='reserve_driver'||fact.role==='reserve_driver')continue;
    const endYear=fact.scenarioTerms?.endSeason??fact.exactEnd;
    const endDate=endYear?`${endYear}-12-31`:null;
    if(endDate&&startDate>endDate)continue;
    const driverId=desk.baseline.people.find(p=>p.id===personId)?.careerDriverId;
    if(driverId&&career.workforce.agreements.some(a=>a.personId===driverId&&a.teamId===fact.teamId&&a.role.startsWith('driver_')&&a.terminatedOn&&a.terminatedOn<=startDate))continue;
    const agreed=matchingDriverReleaseAgreement(career,personId,fact.teamId,startDate,fact.role);
    if(agreed){contracts.push({teamId:fact.teamId,role:fact.role,endDate,amount:agreed.amountCents,remainingSalary:null,guaranteePercent:null,protectedLoyalty:null,basis:'agreed_release'});continue;}
    if(!endDate){contracts.push({teamId:fact.teamId,role:fact.role,endDate:null,amount:null,remainingSalary:null,guaranteePercent:null,protectedLoyalty:null,basis:'unresolved'});continue;}
    const fixedFee=contractParameter(fact,'release_fee','amountCents');
    if(fixedFee!==null){contracts.push({teamId:fact.teamId,role:fact.role,endDate,amount:fixedFee,remainingSalary:null,guaranteePercent:null,protectedLoyalty:null,basis:'fixed_fee'});continue;}
    const pay=contractSalary(desk,fact).annualCents;
    if(pay===null||!fact.clausePackage){contracts.push({teamId:fact.teamId,role:fact.role,endDate,amount:null,remainingSalary:null,guaranteePercent:null,protectedLoyalty:null,basis:'unresolved'});continue;}
    const increase=contractParameter(fact,'salary_escalator','annualPercent')??0;
    const firstIncrease=contractParameter(fact,'salary_escalator','firstSeason')??desk.baseline.season+1;
    const protection=contractParameter(fact,'termination_protection','remainingBaseSalaryPercent')??100;
    const remaining=salaryBetween(pay,startDate,endDate,desk.baseline.season,increase,firstIncrease);
    const loyalty=contractParameter(fact,'loyalty_bonus','annualCents')??0;
    const amount=Math.round(remaining*protection/100)+loyalty;
    contracts.push({teamId:fact.teamId,role:fact.role,endDate,amount,remainingSalary:remaining,guaranteePercent:protection,protectedLoyalty:loyalty,basis:'estimated_termination'});
  }
  const known=contracts.reduce((sum,c)=>sum+(c.amount??0),0);
  return {contracts,known,total:contracts.some(c=>c.amount===null)?null:known};
}
export function negotiationCosts(career:CareerState,personId:string,role:ContractRole,seat:1|2,annualCents:number,terms:NegotiationTerms){
  if(!validNegotiation(terms)||terms.startDate<career.clock.date||Number(terms.startDate.slice(0,4))>career.season.year+5||!Number.isSafeInteger(annualCents)||annualCents<=0||annualCents>1e11)throw new Error('Choose valid future dates within five seasons, a positive salary up to $1bn, and valid clause values.');
  const clause=(kind:OfferClause['kind'])=>terms.clauses.find(c=>c.kind===kind)?.value??0;
  const issues:string[]=[];
  if(role==='race_driver'&&terms.clauses.some(c=>['appearance','practice','promotion'].includes(c.kind)))issues.push('Reserve-specific clauses require a reserve appointment.');
  if(role==='reserve_driver'&&terms.clauses.some(c=>['win','podium','points','champion','parity'].includes(c.kind)))issues.push('Race-driver clauses require a race appointment.');
  const desk=career.contractDesk;
  const effective=effectiveContractSeat(career,career.player.teamId,role,seat,terms.startDate);
  const slot=effective.slot;
  const occupant=slot?.personId??null;
  const outgoing=effective.fact;
  const own=occupant===personId;
  const baseYear=Number(terms.startDate.slice(0,4));
  const yearly=[];
  for(let y=baseYear;y<=Number(terms.endDate.slice(0,4));y++){
    const from=terms.startDate>`${y}-01-01`?terms.startDate:`${y}-01-01`,to=terms.endDate<`${y}-12-31`?terms.endDate:`${y}-12-31`;
    yearly.push({year:y,salary:salaryBetween(annualCents,from,to,baseYear,clause('increase')),loyalty:to===`${y}-12-31`?Math.round(clause('loyalty')*100):0});
  }
  const salary=yearly.reduce((n,y)=>n+y.salary,0),loyalty=yearly.reduce((n,y)=>n+y.loyalty,0),signing=Math.round(clause('signing')*100);
  let severance:number|null=0,outgoingLoyalty:number|null=0,remainingSalary:number|null=0;
  const endYear=outgoing?.scenarioTerms?.endSeason??outgoing?.exactEnd;
  const outgoingEnd=endYear?`${endYear}-12-31`:null;
  if(!desk||!slot)issues.push('The saved seat baseline is unavailable; replacement costs are unresolved.');
  if(occupant&&!outgoing)issues.push('The current seat holder has no resolved contract record.');
  if(occupant&&(!outgoing||!outgoingEnd)){severance=null;remainingSalary=null;outgoingLoyalty=null;issues.push('Outgoing contract expiry is unknown. Zero termination cost cannot be assumed.');}
  if(outgoing&&outgoingEnd&&terms.startDate<=outgoingEnd){
    if(own)issues.push('This overlaps the driver’s current appointment. Start after expiry for a renewal; mid-contract amendments require agreement.');
    const pay=desk?contractSalary(desk,outgoing).annualCents:null;
    const parameter=(kind:string,key:string,fallback:number)=>{const values=outgoing.clausePackage?.clauses.find(c=>c.kind===kind)?.parameters as Record<string,unknown>|undefined;return typeof values?.[key]==='number'?values[key] as number:fallback;};
    remainingSalary=pay===null?null:salaryBetween(pay,terms.startDate,outgoingEnd,desk!.baseline.season,parameter('salary_escalator','annualPercent',0),parameter('salary_escalator','firstSeason',desk!.baseline.season+1));
    severance=own?null:remainingSalary===null?null:Math.round(remainingSalary*parameter('termination_protection','remainingBaseSalaryPercent',100)/100);
    outgoingLoyalty=own?null:parameter('loyalty_bonus','annualCents',0);
    if(!outgoing.clausePackage)issues.push('Outgoing additional terms are unrecorded; loyalty and other exit obligations may be missing.');
    if(pay===null)issues.push('Outgoing salary is unknown; compensation requires review.');
  }
  const incoming=desk?.baseline.facts.filter(f=>f.personId===personId&&!(f.teamId===career.player.teamId&&f.personId===occupant))??[];
  if(!desk?.baseline.facts.some(f=>f.personId===personId))issues.push('Incoming contract availability is unrecorded; free-agent status and release costs require verification.');
  for(const f of incoming){if(role==='reserve_driver'||f.role==='reserve_driver'){const end=f.scenarioTerms?.endSeason??f.exactEnd;if(end==null||terms.startDate<=`${end}-12-31`)issues.push('Concurrent race or reserve commitments require agreement on availability and team priority.');continue;}const end=f.scenarioTerms?.endSeason??f.exactEnd;
    if(end==null||terms.startDate<=`${end}-12-31`)issues.push(`Incoming driver has an overlapping or unresolved ${f.role.replace('_',' ')} commitment. Release permission and the final fee must be agreed.`);
  }
  const incomingRelease=incomingReleaseCosts(career,personId,terms.startDate,role);
  if(incomingRelease.total===null&&desk?.baseline.facts.some(f=>f.personId===personId))issues.push('The incoming driver’s release fee is unresolved because the current contract terms are incomplete.');
  for(const d of desk?.drafts??[]){if(d.status==='draft'&&d.personId!==personId&&d.teamId===career.player.teamId&&d.role===role&&d.seat===seat){const a=d.negotiation?.startDate??`${d.startSeason}-01-01`,b=d.negotiation?.endDate??`${d.startSeason+d.seasons-1}-12-31`;if(a<=terms.endDate&&b>=terms.startDate)issues.push('Another saved proposal targets this seat during the same period.');}}
  const currentId=desk?.baseline.people.find(p=>p.id===occupant)?.careerDriverId;
  const lineup=career.workforce.lineups.find(l=>l.teamId===career.player.teamId&&l.season===career.season.year);
  const actual=role==='race_driver'?lineup?.driverIds[seat-1]:lineup?.reserveDriverIds?.[seat-1];
  if(occupant&&actual&&actual!==currentId&&terms.startDate<=career.clock.date){severance=null;outgoingLoyalty=null;issues.push('Career line-up differs from the contract baseline; reconcile the seat before committing.');}
  if(!desk||!slot){severance=null;outgoingLoyalty=null;}
  const incomingContract=salary+loyalty+signing;
  const hasUnresolvedCosts=incomingRelease.total===null||severance===null||outgoingLoyalty===null;
  const firstSeason=yearly[0];
  // One-off release, termination, and signing payments are estimated on the start date.
  const firstSeasonImpact=firstSeason.salary+firstSeason.loyalty+signing+incomingRelease.known+(severance??0)+(outgoingLoyalty??0);
  return {yearly,salary,loyalty,signing,outgoing,occupant,outgoingEnd,severance,outgoingLoyalty,remainingSalary,incomingRelease,
    incomingContract,incomingCommitted:incomingRelease.total===null?null:incomingContract+incomingRelease.total,
    knownTotal:incomingContract+incomingRelease.known+(severance??0)+(outgoingLoyalty??0),
    firstSeasonImpact,hasUnresolvedCosts,
    complete:incomingRelease.total!==null&&severance!==null&&outgoingLoyalty!==null&&issues.length===0,issues:[...new Set(issues)]};
}
