import type {CareerState} from './types';
import {contractSalary,type ContractRole} from './contracts';
import type {OfferContext} from './negotiationModel';
import {startingClausePreferences} from './contractClauseAdapter';

/** Resolve career-specific facts once, without writing assumptions to the reference database. */
export function negotiationContext(career:CareerState,personId:string,options:{dateOfBirth?:string|null;ability?:number|null;loyalty?:number|null;teamReputation?:Record<string,number>}={}):OfferContext{
  const desk=career.contractDesk;
  const person=desk?.baseline.people.find(p=>p.id===personId);
  const driverId=person?.careerDriverId;
  const facts=desk?.baseline.facts.filter(f=>f.personId===personId)??[];
  const agreements=career.workforce.agreements.filter(a=>a.personId===driverId);
  const asOf=career.clock.date,year=Number(asOf.slice(0,4));
  const activeRace=agreements.find(a=>(a.role==='driver_1'||a.role==='driver_2')&&a.startSeason<=year&&(a.endSeason===null||a.endSeason>=year)&&(!a.startDate||a.startDate<=asOf)&&(!a.endDate||a.endDate>=asOf)&&(!a.terminatedOn||a.terminatedOn>asOf));
  const matchingRace=activeRace&&facts.find(f=>f.role==='race_driver'&&f.teamId===activeRace.teamId);
  const hasCareerRaceHistory=agreements.some(a=>a.role==='driver_1'||a.role==='driver_2');
  const raceFact=matchingRace??(!hasCareerRaceHistory?facts.find(f=>f.role==='race_driver'&&(f.scenarioTerms?.endSeason??f.exactEnd??year)>=year):undefined);
  const raceEnd=activeRace?.endSeason??raceFact?.scenarioTerms?.endSeason??raceFact?.exactEnd??null;
  const roleSalaryCents:Partial<Record<ContractRole,number>>={};
  for(const role of ['race_driver','reserve_driver'] as const){
    const fact=facts.find(f=>f.role===role&&desk&&contractSalary(desk,f).annualCents!==null);
    if(fact&&desk)roleSalaryCents[role]=contractSalary(desk,fact).annualCents!;
    const agreement=agreements.find(a=>a.role.startsWith(role==='race_driver'?'driver_':'reserve_')&&a.startSeason<=year&&(a.endSeason===null||a.endSeason>=year)&&(!a.startDate||a.startDate<=asOf)&&(!a.endDate||a.endDate>=asOf)&&(!a.terminatedOn||a.terminatedOn>asOf)&&a.salary!=null);
    if(agreement?.salary!=null)roleSalaryCents[role]=agreement.salary;
  }
  const age=options.dateOfBirth?year-Number(options.dateOfBirth.slice(0,4))-(asOf.slice(5)<options.dateOfBirth.slice(5)?1:0):null;
  const standings=[...career.championship.teams].sort((a,b)=>b.points-a.points);
  const hasResults=standings.some(t=>t.points>0);
  const competitiveness=(teamId:string|undefined)=>{if(!teamId||!hasResults)return null;const index=standings.findIndex(t=>t.teamId===teamId);return index<0?null:1-index/Math.max(1,standings.length-1);};
  const currentTeam=activeRace?.teamId??raceFact?.teamId??null;
  const fingerprint=JSON.stringify({year,agreements:agreements.map(a=>[a.id,a.teamId,a.role,a.startSeason,a.endSeason,a.startDate,a.endDate,a.terminatedOn]),raceFacts:facts.map(f=>[f.id,f.teamId,f.role,f.scenarioTerms?.endSeason??f.exactEnd]),player:career.player.teamId});
  const preferredClauses:OfferContext['preferredClauses']={};
  for(const role of ['race_driver','reserve_driver'] as const){const terms=facts.find(f=>f.role===role)?.clausePackage;if(terms)preferredClauses[role]=startingClausePreferences(terms);}
  return {personId,teamId:career.player.teamId,date:asOf,age,ability:options.ability??null,loyalty:options.loyalty??null,currentRaceTeam:currentTeam,raceEndDate:raceEnd?`${raceEnd}-12-31`:null,preferredClauses,
    roleSalaryCents,competitiveness:competitiveness(career.player.teamId),currentCompetitiveness:competitiveness(currentTeam??undefined),currentEmployerReputation:currentTeam?options.teamReputation?.[currentTeam]??null:null,raceDates:career.season.calendar.rounds.map(r=>r.weekendEndDate),fingerprint,source:'career appointments, recorded team history and saved contract reference'};
}
