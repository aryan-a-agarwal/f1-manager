import {
  CAREER_SCHEMA_VERSION,
  CAREER_START_DATE,
  CAREER_START_MINUTE,
  CAREER_START_SEASON,
  type CareerState,
} from "./types";
import { generateSeasonCalendar } from "./calendar";
import { createChampionship, createInitialWorkforce } from "./careerDefaults";

function makeCareerId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `career-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createCareer(teamId: string, options: { now?: Date; careerId?: string } = {}): CareerState {
  if (!teamId.trim()) throw new Error("A team is required to create a career.");
  const timestamp = (options.now ?? new Date()).toISOString();
  const workforce=createInitialWorkforce(CAREER_START_SEASON);
  return {
    schemaVersion: CAREER_SCHEMA_VERSION,
    metadata: {
      careerId: options.careerId ?? makeCareerId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 0,
    },
    player: { teamId },
    clock: {
      date: CAREER_START_DATE,
      minuteOfDay: CAREER_START_MINUTE,
      status: "paused",
      blockingEventId: null,
      lastAdvance: null,
    },
    season: { year: CAREER_START_SEASON, phase: "preseason", currentEventId: null, calendar:generateSeasonCalendar(CAREER_START_SEASON) },
    weekendOperations:{activeWeekendId:null,activeSessionId:null,snapshots:[],inputs:[],attempts:[],outputs:[],outbox:[]},
    championship:createChampionship(CAREER_START_SEASON,workforce.lineups,workforce),
    workforce,
    seasonHistory:[],
  };
}
