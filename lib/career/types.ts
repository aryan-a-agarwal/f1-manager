export const CAREER_SCHEMA_VERSION = 5 as const;
export const CAREER_START_SEASON = 2027;
export const CAREER_START_DATE = "2027-01-04";
export const CAREER_START_MINUTE = 9 * 60;

export type CareerPhase = "preseason" | "season" | "offseason";

export type CareerAdvanceReason = "hour" | "day" | "target" | "next_event";
export type SessionKind = "practice_1" | "practice_2" | "practice_3" | "sprint_qualifying" | "sprint" | "qualifying" | "race";
export type SessionStatus = "scheduled" | "available" | "preparing" | "locked" | "running" | "processing" | "completed" | "cancelled" | "postponed";
export type WeekendStatus = "scheduled" | "preparation" | "entered" | "weekend_active" | "practice_completed" | "qualifying_completed" | "race_ready" | "race_completed" | "archived";

export type CalendarSession = {
  id: string;
  kind: SessionKind;
  date: string;
  minuteOfDay: number;
  status: SessionStatus;
  resultId: string | null;
};

export type CalendarRound = {
  id: string;
  roundNumber: number;
  weekendNumber: number;
  weekendId: string;
  trackId: string;
  grandPrixName: string;
  location: string;
  sprint: boolean;
  weekendStartDate: string;
  weekendEndDate: string;
  status: WeekendStatus;
  sessions: CalendarSession[];
};

export type SeasonCalendar = {
  year: number;
  generated: true;
  sourceTemplate: "official-2026-order";
  sourceUrl: string;
  rounds: CalendarRound[];
};

export type Provenance = "official_fact" | "career_generated" | "player_selected" | "engine_generated" | "administrative_placeholder" | "system_derived";
export type WeekendParticipant = { teamId:string; teamName:string; driverId:string; driverName:string; abbreviation:string; carNumber:number|null };
export type WeekendSnapshot = {
  id:string;
  schemaVersion:1;
  careerId:string;
  season:number;
  roundId:string;
  trackId:string;
  weekendNumber:number;
  sprint:boolean;
  createdAt:string;
  rulesetVersion:"2026-format-v1";
  participants:WeekendParticipant[];
  circuit:{ lapLengthKm:number; raceLaps:number|null; raceDistanceKm:number|null; provenance:"official_fact" };
};
export type SessionInput = {
  schemaVersion:1;
  id:string;
  sessionId:string;
  roundId:string;
  snapshotId:string;
  sessionKind:SessionKind;
  participantIds:string[];
  randomSeed:number;
  engineId:string;
  engineVersion:string;
  instructions:{runPlan:"neutral";startingTyre:null;pitPlan:null;provenance:"player_selected"};
  provenance:"system_derived";
};
export type SessionAttempt = {
  id:string;
  sessionId:string;
  inputId:string;
  attemptNumber:number;
  status:"running"|"completed"|"failed";
  engineId:string;
  engineVersion:string;
  randomSeed:number;
  inputChecksum:string;
  startedAt:string;
  completedAt:string|null;
  failureReason:string|null;
};
export type ClassificationEntry = { position:number; driverId:string; status:"classified"|"retired"|"not_started"; laps:number|null; timeMs:number|null; gapMs:number|null };
export type SessionOutput = {
  schemaVersion:1;
  id:string;
  attemptId:string;
  sessionId:string;
  completionMode:"administrative_placeholder"|"simulated";
  classification:ClassificationEntry[];
  distancePercent:number|null;
  provenance:"administrative_placeholder"|"engine_generated";
  engineId:string;
  engineVersion:string;
  createdAt:string;
};
export type DomainEvent = {
  id:string;
  type:"SessionCompleted"|"GrandPrixCompleted"|"WeekendArchived";
  roundId:string;
  sessionId:string|null;
  resultId:string|null;
  createdAt:string;
  status:"pending"|"processed";
};
export type WeekendOperations = {
  activeWeekendId:string|null;
  activeSessionId:string|null;
  snapshots:WeekendSnapshot[];
  inputs:SessionInput[];
  attempts:SessionAttempt[];
  outputs:SessionOutput[];
  outbox:DomainEvent[];
};

export type DriverStanding = {driverId:string;driverName:string;teamId:string;points:number;wins:number;podiums:number;finishes:Record<string,number>};
export type TeamStanding = {teamId:string;teamName:string;points:number;wins:number;podiums:number;finishes:Record<string,number>};
export type ChampionshipState = {year:number;ruleset:"fia-2026-points-v1";sourceUrl:string;drivers:DriverStanding[];teams:TeamStanding[];processedResultIds:string[]};
export type WorkforcePerson = {id:string;name:string;kind:"driver"|"staff";carNumber:number|null;provenance:"official_fact"|"career_generated"};
export type WorkforceAgreement = {id:string;personId:string;teamId:string;role:"driver_1"|"driver_2"|"team_principal";startSeason:number;endSeason:number|null;salary:null;termKnown:false;provenance:"official_fact"|"career_generated"};
export type SeasonLineup = {season:number;teamId:string;driverIds:[string,string];teamPrincipalId:string;provenance:"official_fact"|"career_generated"};
export type WorkforceState = {people:WorkforcePerson[];agreements:WorkforceAgreement[];lineups:SeasonLineup[]};
export type SeasonArchive = {year:number;archivedAt:string;calendar:SeasonCalendar;championship:ChampionshipState;results:SessionOutput[];lineups:SeasonLineup[]};

export type CareerStateV5 = {
  schemaVersion: typeof CAREER_SCHEMA_VERSION;
  metadata: {
    careerId: string;
    createdAt: string;
    updatedAt: string;
    revision: number;
  };
  player: {
    teamId: string;
  };
  clock: {
    date: string;
    minuteOfDay: number;
    status: "paused" | "blocked";
    blockingEventId: string | null;
    lastAdvance: {
      fromDate: string;
      fromMinuteOfDay: number;
      toDate: string;
      toMinuteOfDay: number;
      reason: CareerAdvanceReason;
    } | null;
  };
  season: {
    year: number;
    phase: CareerPhase;
    currentEventId: string | null;
    calendar: SeasonCalendar;
  };
  weekendOperations: WeekendOperations;
  championship: ChampionshipState;
  workforce: WorkforceState;
  seasonHistory: SeasonArchive[];
};

export type CareerState = CareerStateV5;
