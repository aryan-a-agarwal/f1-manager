import { saveCareer, type CareerStorage } from "./storage";
import type { CareerState, SeasonLineup, WorkforcePerson } from "./types";

export type WorkforceCandidate={id:string;name:string;kind:"driver"|"staff";carNumber?:number|null;provenance?:"official_fact"|"career_generated"};

function minimumEffectiveSeason(career:CareerState){return career.season.phase==="preseason"&&career.weekendOperations.snapshots.length===0?career.season.year:career.season.year+1;}

function ensureSeasonLineups(career:CareerState,season:number){
  if(career.workforce.lineups.some((entry)=>entry.season===season))return career.workforce.lineups;
  const sourceSeason=Math.max(...career.workforce.lineups.filter((entry)=>entry.season<season).map((entry)=>entry.season));
  if(!Number.isFinite(sourceSeason))throw new Error("No previous lineup exists.");
  const copied=career.workforce.lineups.filter((entry)=>entry.season===sourceSeason).map((entry):SeasonLineup=>({...entry,season,provenance:"career_generated"}));
  return [...career.workforce.lineups,...copied];
}

function addPerson(people:WorkforcePerson[],candidate:WorkforceCandidate){
  const existing=people.find((entry)=>entry.id===candidate.id);
  if(existing&&existing.kind!==candidate.kind)throw new Error("The person type conflicts with the existing database record.");
  return existing?people:[...people,{id:candidate.id,name:candidate.name,kind:candidate.kind,carNumber:candidate.carNumber??null,provenance:candidate.provenance??"career_generated"}];
}

export function appointDriver(career:CareerState,teamId:string,seat:1|2,candidate:WorkforceCandidate,effectiveSeason:number,storage?:CareerStorage){
  if(candidate.kind!=="driver")throw new Error("Only a driver can fill a driver seat.");
  if(effectiveSeason<minimumEffectiveSeason(career))throw new Error(`The earliest available season is ${minimumEffectiveSeason(career)}.`);
  let lineups=ensureSeasonLineups(career,effectiveSeason);
  const target=lineups.find((entry)=>entry.season===effectiveSeason&&entry.teamId===teamId);
  if(!target)throw new Error("Team lineup not found.");
  if(lineups.some((entry)=>entry.season===effectiveSeason&&entry.teamId!==teamId&&entry.driverIds.includes(candidate.id)))throw new Error("That driver already has a seat for this season.");
  const previous=target.driverIds[seat-1];
  const driverIds:[string,string]=[...target.driverIds];driverIds[seat-1]=candidate.id;
  if(driverIds[0]===driverIds[1])throw new Error("A team cannot enter the same driver twice.");
  lineups=lineups.map((entry)=>entry===target?{...entry,driverIds,provenance:"career_generated"}:entry);
  const role=seat===1?"driver_1":"driver_2";
  let agreements=career.workforce.agreements.filter((entry)=>!(entry.teamId===teamId&&entry.role===role&&entry.startSeason===effectiveSeason)).map((entry)=>entry.teamId===teamId&&entry.role===role&&entry.personId===previous&&entry.endSeason===null?{...entry,endSeason:effectiveSeason-1}:entry);
  agreements=[...agreements,{id:`${effectiveSeason}-${teamId}-${role}-${candidate.id}`,personId:candidate.id,teamId,role,startSeason:effectiveSeason,endSeason:null,salary:null,termKnown:false,provenance:"career_generated"}];
  return saveCareer({...career,workforce:{people:addPerson(career.workforce.people,candidate),agreements,lineups}},storage);
}

export function appointTeamPrincipal(career:CareerState,teamId:string,candidate:WorkforceCandidate,effectiveSeason:number,storage?:CareerStorage){
  if(candidate.kind!=="staff")throw new Error("Only a staff member can be team principal.");
  if(effectiveSeason<minimumEffectiveSeason(career))throw new Error(`The earliest available season is ${minimumEffectiveSeason(career)}.`);
  let lineups=ensureSeasonLineups(career,effectiveSeason);
  const target=lineups.find((entry)=>entry.season===effectiveSeason&&entry.teamId===teamId);if(!target)throw new Error("Team lineup not found.");
  const previous=target.teamPrincipalId;
  lineups=lineups.map((entry)=>entry===target?{...entry,teamPrincipalId:candidate.id,provenance:"career_generated"}:entry);
  let agreements=career.workforce.agreements.filter((entry)=>!(entry.teamId===teamId&&entry.role==="team_principal"&&entry.startSeason===effectiveSeason)).map((entry)=>entry.teamId===teamId&&entry.role==="team_principal"&&entry.personId===previous&&entry.endSeason===null?{...entry,endSeason:effectiveSeason-1}:entry);
  agreements=[...agreements,{id:`${effectiveSeason}-${teamId}-principal-${candidate.id}`,personId:candidate.id,teamId,role:"team_principal",startSeason:effectiveSeason,endSeason:null,salary:null,termKnown:false,provenance:"career_generated"}];
  return saveCareer({...career,workforce:{people:addPerson(career.workforce.people,candidate),agreements,lineups}},storage);
}

export function ensureWorkforceSeason(career:CareerState,season:number):CareerState{return {...career,workforce:{...career.workforce,lineups:ensureSeasonLineups(career,season)}};}
export function seasonLineups(career:CareerState,season=career.season.year){return career.workforce.lineups.filter((entry)=>entry.season===season);}
