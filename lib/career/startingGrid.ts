import seed from "@/supabase/seed-data/2027-starting-grid.json";
import type {CareerState} from "./types";
import type {ContractBaseline,ContractRole} from "./contracts";

export const STARTING_GRID_VERSION=seed.dataset_id;
/** Export of the matching versioned Supabase starting scenario; deterministic even offline. */
export function startingContractBaseline(career:CareerState):ContractBaseline{
  const rows=seed.contracts;
  return {datasetId:seed.dataset_id,season:seed.season,asOfDate:seed.as_of_date,capturedOn:career.clock.date,
    people:[...new Map(rows.map(r=>[r.person_slug,r])).values()].map(r=>({id:r.person_slug,name:r.driver_name,careerDriverId:career.workforce.people.some(p=>p.id===r.driver_id)?r.driver_id:null})),
    facts:rows.map(r=>({id:`${seed.dataset_id}:${r.person_slug}:${r.role}:${r.team_slug}:${r.slot_number}`,personId:r.person_slug,teamId:r.team_id,role:r.role as ContractRole,status:r.reference_status as "confirmed"|"reported"|"unconfirmed",minimumEnd:r.reference_confirmed_through,exactEnd:r.reference_exact_end,salaryCents:null,sourceUrl:r.source_url,checkedOn:seed.as_of_date,notes:r.notes,scenarioTerms:{endSeason:r.end_season,endBasis:r.term_basis as "published_exact"|"game_assumption",seatBasis:r.seat_basis as "confirmed"|"game_assumption"}})),
    slots:[...new Set(rows.map(r=>r.team_id))].flatMap(teamId=>(["race_driver","reserve_driver"] as const).flatMap(role=>([1,2] as const).map(number=>{
      const row=rows.find(r=>r.team_id===teamId&&r.role===role&&r.slot_number===number);
      return {teamId,role,number,personId:row?.person_slug??null,status:row?.seat_basis??"vacant"};
    }))),
  };
}
