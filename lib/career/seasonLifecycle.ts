import {awardChampionshipEntitlement} from './championshipFinance';
import { createInitialEvents } from "./timeline";
import { generateSeasonCalendar } from "./calendar";
import { CAREER_START_DATE, CAREER_START_MINUTE, type CareerState, type SeasonArchive } from "./types";
import { processChampionshipEventsState, processWeekendLifecycleEventsState } from "./scoring";
import { createChampionship } from "./careerDefaults";
import { ensureWorkforceSeason, seasonLineups } from "./workforce";
import { saveCareer, type CareerStorage } from "./storage";
import {applyDueContractAppointments} from './contractAppointments';
import {processFinance} from './financeEngine';
import {closeFinancePeriod,getFinanceOperations} from './financeOperations';
import {processRivalFinances} from './rivalFinance';

function startDateFor(year:number){return `${year}${CAREER_START_DATE.slice(4)}`;}

export function canCompleteSeason(career:CareerState){return career.season.phase==="season"&&career.season.calendar.rounds.every((round)=>round.status==="archived")&&!career.weekendOperations.attempts.some((entry)=>entry.status==="running");}

export function completeCurrentSeason(career:CareerState,storage?:CareerStorage,now=new Date()){
  if(career.season.phase==="offseason")return career;
  if(!canCompleteSeason(career))throw new Error("Every race weekend must be completed and archived first.");
  const processed=processWeekendLifecycleEventsState(processChampionshipEventsState(career));
  if(processed.weekendOperations.outbox.some((entry)=>entry.status==="pending"))throw new Error("Post-race events are still pending.");
  const archive:SeasonArchive={year:processed.season.year,archivedAt:now.toISOString(),calendar:processed.season.calendar,championship:processed.championship,results:processed.weekendOperations.outputs,lineups:seasonLineups(processed)};
  const changed={...processed,clock:{...processed.clock,status:"paused" as const,blockingEventId:null},season:{...processed.season,phase:"offseason" as const,currentEventId:null},seasonHistory:[...processed.seasonHistory,archive]};
  return saveCareer(processFinance(awardChampionshipEntitlement(changed)),storage,now);
}

export function startNextSeason(career:CareerState,storage?:CareerStorage,now=new Date()){
  if(career.season.phase!=="offseason")throw new Error("The current season must be completed first.");
  const year=career.season.year+1;
  let settled=processRivalFinances(processFinance(career,`${career.season.year}-12-31`),`${career.season.year}-12-31`);
  if(!getFinanceOperations(settled).periods.some(p=>p.year===career.season.year))settled=closeFinancePeriod({...settled,clock:{...settled.clock,date:`${career.season.year}-12-31`}},career.season.year,'Season rollover financial close');
  const withWorkforce=applyDueContractAppointments(ensureWorkforceSeason(settled,year),startDateFor(year));
  const championship=createChampionship(year,seasonLineups(withWorkforce,year),withWorkforce.workforce);
  const changed:CareerState={...withWorkforce,events:createInitialEvents(year,career.player.teamId),scheduler:{processedEventIds:[],acknowledgedEventIds:[],pendingEvent:null},clock:{date:startDateFor(year),minuteOfDay:CAREER_START_MINUTE,status:"paused",blockingEventId:null,lastAdvance:null},season:{year,phase:"preseason",currentEventId:null,calendar:generateSeasonCalendar(year)},weekendOperations:{activeWeekendId:null,activeSessionId:null,snapshots:[],inputs:[],attempts:[],outputs:[],outbox:[]},championship};
  return saveCareer(processFinance(awardChampionshipEntitlement(changed)),storage,now);
}
