import seed from "@/supabase/seed-data/2027-starting-grid.json";
import {startingContractBaseline} from "./startingGrid";
import type {CareerState,WorkforceAgreement,WorkforcePerson} from "./types";

/** Explicit additive reserve update: never rewrites race seats, results, drafts or existing reserve choices. */
export function ensureCareerReserves(career:CareerState):CareerState{
  const desk=career.contractDesk;
  if(!desk||career.season.year!==2027||desk.reserveRosterVersion===seed.dataset_id)return career;
  const reference=startingContractBaseline(career);
  let people=[...desk.baseline.people],facts=[...desk.baseline.facts],slots=[...desk.baseline.slots];
  const workforcePeople:WorkforcePerson[]=[...career.workforce.people];
  const agreements:WorkforceAgreement[]=[...career.workforce.agreements];
  const salaries=[...(desk.salaryModel?.entries??[])];
  for(const row of seed.contracts.filter(r=>r.role==="reserve_driver")){
    const slot=slots.find(s=>s.teamId===row.team_id&&s.role==="reserve_driver"&&s.number===row.slot_number);
    if(!slot)throw new Error(`Reserve position missing for ${row.team_id}.`);
    if(slot.personId!==null&&slot.personId!==row.person_slug)continue; // Preserve later player-selected appointments.
    let person=people.find(p=>p.id===row.person_slug);
    if(!person){person={id:row.person_slug,name:row.driver_name,careerDriverId:row.driver_id};people.push(person);}
    const driverId=person.careerDriverId??row.driver_id;
    people=people.map(p=>p.id===person!.id?{...p,careerDriverId:driverId}:p);
    if(!workforcePeople.some(p=>p.id===driverId))workforcePeople.push({id:driverId,name:person.name,kind:"driver",carNumber:null,provenance:"official_fact"});
    let fact=facts.find(f=>f.teamId===row.team_id&&f.role==="reserve_driver"&&f.personId===row.person_slug);
    if(!fact){fact=reference.facts.find(f=>f.teamId===row.team_id&&f.role==="reserve_driver"&&f.personId===row.person_slug)!;facts.push(fact);}
    if(!salaries.some(s=>s.factId===fact!.id))salaries.push({factId:fact.id,annualCents:row.annual_salary_usd_cents});
    slots=slots.map(s=>s===slot?{...s,personId:row.person_slug,status:row.seat_basis}:s);
    const role=row.slot_number===1?"reserve_1":"reserve_2";
    if(!agreements.some(a=>a.teamId===row.team_id&&a.role===role&&a.startSeason===2027))agreements.push({id:`${seed.dataset_id}:${row.team_id}:${role}`,personId:driverId,teamId:row.team_id,role,startSeason:2027,endSeason:row.end_season,salary:salaries.find(s=>s.factId===fact!.id)!.annualCents,termKnown:true,salaryBasis:"game_estimate",termBasis:"game_assumption",provenance:"career_generated"});
  }
  const lineups=career.workforce.lineups.map(lineup=>{
    if(lineup.season!==2027)return lineup;
    const reserveDriverIds=([1,2] as const).map(number=>{
      const slot=slots.find(s=>s.teamId===lineup.teamId&&s.role==="reserve_driver"&&s.number===number);
      return people.find(p=>p.id===slot?.personId)?.careerDriverId??lineup.reserveDriverIds?.[number-1]??null;
    }) as [string|null,string|null];
    return {...lineup,reserveDriverIds};
  });
  return {...career,workforce:{...career.workforce,people:workforcePeople,agreements,lineups},contractDesk:{...desk,reserveRosterVersion:seed.dataset_id,baseline:{...desk.baseline,people,facts,slots},salaryModel:{version:desk.salaryModel?.version??"2027-game-salaries-v2",entries:salaries}}};
}
