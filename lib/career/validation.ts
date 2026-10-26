import {isContractDeskState} from "./contracts";
import {stripUnbuiltManagement} from "./stripUnbuiltManagement";
import {removeDemoContent} from "./removeDemoContent";
import { CAREER_SCHEMA_VERSION, type CareerAdvanceReason, type CareerPhase, type CareerState } from "./types";
import { generateSeasonCalendar, isSeasonCalendar } from "./calendar";
import { createChampionship, createInitialWorkforce } from "./careerDefaults";
import { createInitialEvents, createInitialProjects, DEFAULT_STOP_SETTINGS } from "./timeline";
import { createInitialComms } from "./comms";
import { createInitialCommercial } from "./commercial";
import { createInitialFinance } from "./finance";
import { createInitialCarDevelopment } from "./carDev";
import { createInitialFacilities } from "./facilities";
import { createInitialMarket } from "./paddockMarket";

const phases: readonly CareerPhase[] = ["preseason", "season", "offseason"];
const advanceReasons: readonly CareerAdvanceReason[] = ["hour", "day", "week", "target", "next_event", "next_race_weekend"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

export function isCareerState(value: unknown): value is CareerState {
  if (!isRecord(value) || value.schemaVersion !== CAREER_SCHEMA_VERSION) return false;
  const metadata = value.metadata;
  const player = value.player;
  const clock = value.clock;
  const season = value.season;
  if (!isRecord(metadata) || !isRecord(player) || !isRecord(clock) || !isRecord(season)) return false;

  return typeof metadata.careerId === "string"
    && metadata.careerId.length > 0
    && isIsoTimestamp(metadata.createdAt)
    && isIsoTimestamp(metadata.updatedAt)
    && Number.isInteger(metadata.revision)
    && (metadata.revision as number) >= 0
    && typeof player.teamId === "string"
    && player.teamId.length > 0
    && isCalendarDate(clock.date)
    && Number.isInteger(clock.minuteOfDay)
    && (clock.minuteOfDay as number) >= 0
    && (clock.minuteOfDay as number) < 24 * 60
    && (clock.status === "paused" || clock.status === "blocked")
    && (clock.blockingEventId === null || typeof clock.blockingEventId === "string")
    && isLastAdvance(clock.lastAdvance)
    && isScheduler(value.scheduler)
    && Number.isInteger(season.year)
    && (season.year as number) >= 1950
    && phases.includes(season.phase as CareerPhase)
    && (season.currentEventId === null || typeof season.currentEventId === "string")
    && isSeasonCalendar(season.calendar)
    && isWeekendOperations(value.weekendOperations)
    && isChampionship(value.championship)
    && isWorkforce(value.workforce)
    && (value.contractDesk===undefined||isContractDeskState(value.contractDesk))
    && Array.isArray(value.seasonHistory);
}

function isScheduler(value:unknown){
  if(!isRecord(value)||!Array.isArray(value.processedEventIds)||!Array.isArray(value.acknowledgedEventIds))return false;
  if(![value.processedEventIds,value.acknowledgedEventIds].every(ids=>ids.every(id=>typeof id==="string")&&new Set(ids).size===ids.length))return false;
  const event=value.pendingEvent;
  return event===null||(isRecord(event)&&typeof event.id==="string"&&typeof event.title==="string"&&isCalendarDate(event.date)&&Number.isInteger(event.minuteOfDay)&&(event.minuteOfDay as number)>=0&&(event.minuteOfDay as number)<1440&&typeof event.category==="string"&&["mandatory","important","informational"].includes(event.severity as string));
}

function isChampionship(value:unknown){return isRecord(value)&&Number.isInteger(value.year)&&value.ruleset==="fia-2026-points-v1"&&typeof value.sourceUrl==="string"&&Array.isArray(value.drivers)&&Array.isArray(value.teams)&&Array.isArray(value.processedResultIds);}
function isWorkforce(value:unknown){return isRecord(value)&&Array.isArray(value.people)&&Array.isArray(value.agreements)&&Array.isArray(value.lineups)&&value.people.every((person)=>isRecord(person)&&typeof person.id==="string"&&typeof person.name==="string"&&(person.kind==="driver"||person.kind==="staff"))&&value.lineups.every((lineup)=>isRecord(lineup)&&Number.isInteger(lineup.season)&&typeof lineup.teamId==="string"&&Array.isArray(lineup.driverIds)&&lineup.driverIds.length===2&&typeof lineup.teamPrincipalId==="string");}

function isWeekendOperations(value:unknown) {
  if (!isRecord(value)) return false;
  const snapshots=value.snapshots; const inputs=value.inputs; const attempts=value.attempts; const outputs=value.outputs; const outbox=value.outbox;
  if(!Array.isArray(snapshots)||!Array.isArray(inputs)||!Array.isArray(attempts)||!Array.isArray(outputs)||!Array.isArray(outbox)) return false;
  const strings=(items:unknown[])=>items.every((item)=>typeof item==="string");
  const unique=(items:string[])=>new Set(items).size===items.length;
  const validSnapshots=snapshots.every((item)=>isRecord(item)&&item.schemaVersion===1&&typeof item.id==="string"&&typeof item.roundId==="string"&&typeof item.trackId==="string"&&isIsoTimestamp(item.createdAt)&&Array.isArray(item.participants)&&item.participants.length===22&&item.participants.every((entry)=>isRecord(entry)&&typeof entry.teamId==="string"&&typeof entry.driverId==="string"&&typeof entry.driverName==="string"&&(entry.carNumber===null||Number.isInteger(entry.carNumber)))&&isRecord(item.circuit)&&typeof item.circuit.lapLengthKm==="number"&&item.circuit.provenance==="official_fact");
  const validInputs=inputs.every((item)=>isRecord(item)&&item.schemaVersion===1&&typeof item.id==="string"&&typeof item.sessionId==="string"&&typeof item.snapshotId==="string"&&Array.isArray(item.participantIds)&&item.participantIds.length===22&&strings(item.participantIds)&&unique(item.participantIds)&&Number.isInteger(item.randomSeed)&&typeof item.engineId==="string"&&typeof item.engineVersion==="string"&&isRecord(item.instructions)&&item.instructions.provenance==="player_selected");
  const validAttempts=attempts.every((item)=>isRecord(item)&&typeof item.id==="string"&&typeof item.sessionId==="string"&&typeof item.inputId==="string"&&Number.isInteger(item.attemptNumber)&&typeof item.inputChecksum==="string"&&(item.status==="running"||item.status==="completed"||item.status==="failed")&&isIsoTimestamp(item.startedAt)&&(item.completedAt===null||isIsoTimestamp(item.completedAt))&&(item.failureReason===null||typeof item.failureReason==="string"));
  const validOutputs=outputs.every((item)=>isRecord(item)&&item.schemaVersion===1&&typeof item.id==="string"&&typeof item.attemptId==="string"&&typeof item.sessionId==="string"&&Array.isArray(item.classification)&&isIsoTimestamp(item.createdAt)&&(item.provenance==="administrative_placeholder"||item.provenance==="engine_generated"));
  const validOutbox=outbox.every((item)=>isRecord(item)&&typeof item.id==="string"&&(item.type==="SessionCompleted"||item.type==="GrandPrixCompleted"||item.type==="WeekendArchived")&&typeof item.roundId==="string"&&isIsoTimestamp(item.createdAt)&&(item.status==="pending"||item.status==="processed"));
  const ids=(items:unknown[])=>items.map((item)=>(item as Record<string,unknown>).id as string);
  return validSnapshots&&validInputs&&validAttempts&&validOutputs&&validOutbox
    && unique(ids(snapshots))&&unique(ids(inputs))&&unique(ids(attempts))&&unique(ids(outputs))&&unique(ids(outbox))
    && (value.activeWeekendId === null || typeof value.activeWeekendId === "string")
    && (value.activeSessionId === null || typeof value.activeSessionId === "string")
    && inputs.every((item)=>snapshots.some((snapshot)=>(snapshot as Record<string,unknown>).id===(item as Record<string,unknown>).snapshotId))
    && attempts.every((item)=>inputs.some((input)=>(input as Record<string,unknown>).id===(item as Record<string,unknown>).inputId))
    && outputs.every((item)=>attempts.some((attempt)=>(attempt as Record<string,unknown>).id===(item as Record<string,unknown>).attemptId));
}

function isLastAdvance(value: unknown) {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return isCalendarDate(value.fromDate)
    && Number.isInteger(value.fromMinuteOfDay)
    && (value.fromMinuteOfDay as number) >= 0
    && (value.fromMinuteOfDay as number) < 24 * 60
    && isCalendarDate(value.toDate)
    && Number.isInteger(value.toMinuteOfDay)
    && (value.toMinuteOfDay as number) >= 0
    && (value.toMinuteOfDay as number) < 24 * 60
    && advanceReasons.includes(value.reason as CareerAdvanceReason);
}

function migrateCareer(value: unknown): unknown {
  if (!isRecord(value)) return value;
  let migrated = value;
  if (migrated.schemaVersion === 1 && isRecord(migrated.clock)) {
    migrated = { ...migrated, schemaVersion:2, clock:{...migrated.clock,status:"paused",blockingEventId:null,lastAdvance:null} };
  }
  if (migrated.schemaVersion === 2 && isRecord(migrated.season) && Number.isInteger(migrated.season.year)) {
    migrated = { ...migrated, schemaVersion:3, season:{...migrated.season,calendar:generateSeasonCalendar(migrated.season.year as number)} };
  }
  if (migrated.schemaVersion === 3) {
    const season=isRecord(migrated.season)&&isRecord(migrated.season.calendar)&&Array.isArray(migrated.season.calendar.rounds)
      ? {...migrated.season,calendar:{...migrated.season.calendar,rounds:migrated.season.calendar.rounds.map((round)=>isRecord(round)&&Array.isArray(round.sessions)?{...round,sessions:round.sessions.map((entry)=>isRecord(entry)&&entry.status==="ready"?{...entry,status:"available"}:entry)}:round)}}
      : migrated.season;
    migrated = { ...migrated, schemaVersion:4, season, weekendOperations:{activeWeekendId:null,activeSessionId:null,snapshots:[],inputs:[],attempts:[],outputs:[],outbox:[]} };
  }
  if(migrated.schemaVersion===4&&isRecord(migrated.season)&&Number.isInteger(migrated.season.year)){
    const workforce=createInitialWorkforce(migrated.season.year as number);
    migrated={...migrated,schemaVersion:5,championship:createChampionship(migrated.season.year as number,workforce.lineups,workforce),workforce,seasonHistory:[]};
  }
  if (migrated.schemaVersion === 5) {
    const teamId = isRecord(migrated.player) && typeof migrated.player.teamId === "string" ? migrated.player.teamId : "ferrari";
    const date = isRecord(migrated.clock) && typeof migrated.clock.date === "string" ? migrated.clock.date : "2027-01-04";
    const year = isRecord(migrated.season) && Number.isInteger(migrated.season.year) ? (migrated.season.year as number) : 2027;
    migrated = {
      ...migrated,
      events: Array.isArray((migrated as any).events) ? (migrated as any).events : createInitialEvents(year, teamId),
      projects: Array.isArray((migrated as any).projects) ? (migrated as any).projects : createInitialProjects(date),
      stopSettings: isRecord((migrated as any).stopSettings) ? (migrated as any).stopSettings : { ...DEFAULT_STOP_SETTINGS },
      comms: isRecord((migrated as any).comms) ? (migrated as any).comms : createInitialComms(teamId, date, year),
      commercial: isRecord((migrated as any).commercial) ? (migrated as any).commercial : createInitialCommercial(teamId, year),
      finance: isRecord((migrated as any).finance) ? (migrated as any).finance : createInitialFinance(teamId, year),
      carDev: isRecord((migrated as any).carDev) ? (migrated as any).carDev : createInitialCarDevelopment(teamId, year),
      facilities: isRecord((migrated as any).facilities) ? (migrated as any).facilities : createInitialFacilities(teamId),
      market: isRecord((migrated as any).market) ? (migrated as any).market : createInitialMarket(year),
    };
  }
  if(migrated.schemaVersion===5&&isRecord(migrated.season)&&isRecord(migrated.season.calendar)){
    const calendar=migrated.season.calendar;
    migrated={...migrated,schemaVersion:6,season:{...migrated.season,calendar:{...calendar,profileId:"legacy-generated-2026-order",profileVersion:1,timeBasis:"UTC"}},scheduler:{processedEventIds:[],acknowledgedEventIds:[],pendingEvent:null}};
  }
  if(migrated.schemaVersion===6){
    migrated=removeDemoContent({...migrated,schemaVersion:7} as unknown as CareerState);
  }
  if(migrated.schemaVersion===7){
    migrated=stripUnbuiltManagement({...migrated,schemaVersion:8} as unknown as CareerState);
  }
  return migrated;
}

export function parseCareerState(raw: string): CareerState | null {
  try {
    const value: unknown = migrateCareer(JSON.parse(raw));
    return isCareerState(value) ? value : null;
  } catch {
    return null;
  }
}
