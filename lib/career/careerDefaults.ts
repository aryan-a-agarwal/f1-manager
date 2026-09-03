import { teams } from "@/lib/data/grid";
import type { ChampionshipState, SeasonLineup, WorkforceState } from "./types";

export const FIA_2026_POINTS_SOURCE="https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_a_general_provisions_-_iss_02_-_2026-02-27.pdf";

function slug(value:string){return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

export function createInitialWorkforce(season:number):WorkforceState {
  const drivers=teams.flatMap((team)=>team.drivers.map((driver)=>({id:driver.id,name:driver.name,kind:"driver" as const,carNumber:driver.number,provenance:"official_fact" as const})));
  const principals=teams.map((team)=>({id:`staff-${slug(team.principal)}`,name:team.principal,kind:"staff" as const,carNumber:null,provenance:"official_fact" as const}));
  const lineups:SeasonLineup[]=teams.map((team)=>({season,teamId:team.id,driverIds:[team.drivers[0].id,team.drivers[1].id],teamPrincipalId:`staff-${slug(team.principal)}`,provenance:"official_fact"}));
  const agreements=lineups.flatMap((lineup)=>[
    {id:`${season}-${lineup.teamId}-driver-1`,personId:lineup.driverIds[0],teamId:lineup.teamId,role:"driver_1" as const,startSeason:season,endSeason:null,salary:null,termKnown:false as const,provenance:"official_fact" as const},
    {id:`${season}-${lineup.teamId}-driver-2`,personId:lineup.driverIds[1],teamId:lineup.teamId,role:"driver_2" as const,startSeason:season,endSeason:null,salary:null,termKnown:false as const,provenance:"official_fact" as const},
    {id:`${season}-${lineup.teamId}-principal`,personId:lineup.teamPrincipalId,teamId:lineup.teamId,role:"team_principal" as const,startSeason:season,endSeason:null,salary:null,termKnown:false as const,provenance:"official_fact" as const},
  ]);
  return {people:[...drivers,...principals],agreements,lineups};
}

export function createChampionship(year:number,lineups:SeasonLineup[],workforce:WorkforceState):ChampionshipState {
  const active=lineups.filter((entry)=>entry.season===year);
  const person=(id:string)=>workforce.people.find((entry)=>entry.id===id)?.name??id;
  return {year,ruleset:"fia-2026-points-v1",sourceUrl:FIA_2026_POINTS_SOURCE,processedResultIds:[],drivers:active.flatMap((lineup)=>lineup.driverIds.map((driverId)=>({driverId,driverName:person(driverId),teamId:lineup.teamId,points:0,wins:0,podiums:0,finishes:{}}))),teams:active.map((lineup)=>({teamId:lineup.teamId,teamName:teams.find((team)=>team.id===lineup.teamId)?.shortName??lineup.teamId,points:0,wins:0,podiums:0,finishes:{}}))};
}
