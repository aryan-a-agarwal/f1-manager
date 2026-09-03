import { generateSeasonCalendar } from "./calendar";
import { CAREER_START_DATE, CAREER_START_MINUTE, type CareerState, type SeasonArchive } from "./types";
import { processChampionshipEventsState } from "./scoring";
import { createChampionship } from "./careerDefaults";
import { ensureWorkforceSeason, seasonLineups } from "./workforce";
import { saveCareer, type CareerStorage } from "./storage";

function startDateFor(year:number){return `${year}${CAREER_START_DATE.slice(4)}`;}

export function canCompleteSeason(career:CareerState){return career.season.phase==="season"&&career.season.calendar.rounds.every((round)=>round.status==="archived")&&!career.weekendOperations.attempts.some((entry)=>entry.status==="running");}

export function completeCurrentSeason(career:CareerState,storage?:CareerStorage,now=new Date()){
  if(career.season.phase==="offseason")return career;
  if(!canCompleteSeason(career))throw new Error("Every race weekend must be completed and archived first.");
  const processed=processChampionshipEventsState(career);
  if(processed.weekendOperations.outbox.some((entry)=>entry.status==="pending"))throw new Error("Post-race events are still pending.");
  const archive:SeasonArchive={year:processed.season.year,archivedAt:now.toISOString(),calendar:processed.season.calendar,championship:processed.championship,results:processed.weekendOperations.outputs,lineups:seasonLineups(processed)};
  const changed={...processed,clock:{...processed.clock,status:"paused" as const,blockingEventId:null},season:{...processed.season,phase:"offseason" as const,currentEventId:null},seasonHistory:[...processed.seasonHistory,archive]};
  return saveCareer(changed,storage,now);
}

export function startNextSeason(career:CareerState,storage?:CareerStorage,now=new Date()){
  if(career.season.phase!=="offseason")throw new Error("The current season must be completed first.");
  const year=career.season.year+1;
  const withWorkforce=ensureWorkforceSeason(career,year);
  const championship=createChampionship(year,seasonLineups(withWorkforce,year),withWorkforce.workforce);
  const changed:CareerState={...withWorkforce,clock:{date:startDateFor(year),minuteOfDay:CAREER_START_MINUTE,status:"paused",blockingEventId:null,lastAdvance:null},season:{year,phase:"preseason",currentEventId:null,calendar:generateSeasonCalendar(year)},weekendOperations:{activeWeekendId:null,activeSessionId:null,snapshots:[],inputs:[],attempts:[],outputs:[],outbox:[]},championship};
  return saveCareer(changed,storage,now);
}
