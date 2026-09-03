import { CAREER_SCHEMA_VERSION, type CareerAdvanceReason, type CareerPhase, type CareerState } from "./types";
import { generateSeasonCalendar, isSeasonCalendar } from "./calendar";
import { createChampionship, createInitialWorkforce } from "./careerDefaults";

const phases: readonly CareerPhase[] = ["preseason", "season", "offseason"];
const advanceReasons: readonly CareerAdvanceReason[] = ["hour", "day", "target", "next_event"];

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
    && Number.isInteger(season.year)
    && (season.year as number) >= 1950
    && phases.includes(season.phase as CareerPhase)
    && (season.currentEventId === null || typeof season.currentEventId === "string")
    && isSeasonCalendar(season.calendar)
    && isWeekendOperations(value.weekendOperations)
    && isChampionship(value.championship)
    && isWorkforce(value.workforce)
    && Array.isArray(value.seasonHistory);
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
