import type { SessionKind } from "./types";

export type SessionTemplate = { kind: SessionKind; dayOffset: number; minuteOfDay: number };
export type SeasonRoundProfile = {
  trackId: string; grandPrixName: string; location: string; weekendNumber: number;
  sprint?: true; startDate?: string; venueTimeZone?: string; sessions?: SessionTemplate[];
};
export type SeasonProfile = { id: string; version: number; label: string; rounds: readonly SeasonRoundProfile[] };

export const STANDARD_SESSIONS: readonly SessionTemplate[] = [
  {kind:"practice_1",dayOffset:0,minuteOfDay:600}, {kind:"practice_2",dayOffset:0,minuteOfDay:840},
  {kind:"practice_3",dayOffset:1,minuteOfDay:660}, {kind:"qualifying",dayOffset:1,minuteOfDay:900},
  {kind:"race",dayOffset:2,minuteOfDay:840},
];
export const SPRINT_SESSIONS: readonly SessionTemplate[] = [
  {kind:"practice_1",dayOffset:0,minuteOfDay:600}, {kind:"sprint_qualifying",dayOffset:0,minuteOfDay:840},
  {kind:"sprint",dayOffset:1,minuteOfDay:600}, {kind:"qualifying",dayOffset:1,minuteOfDay:900},
  {kind:"race",dayOffset:2,minuteOfDay:840},
];

export const VENUE_TIME_ZONES: Record<string,string> = {
  "albert-park":"Australia/Melbourne", shanghai:"Asia/Shanghai", suzuka:"Asia/Tokyo", bahrain:"Asia/Bahrain",
  jeddah:"Asia/Riyadh", miami:"America/New_York", montreal:"America/Toronto", monaco:"Europe/Monaco",
  "barcelona-catalunya":"Europe/Madrid", spielberg:"Europe/Vienna", silverstone:"Europe/London",
  "spa-francorchamps":"Europe/Brussels", hungaroring:"Europe/Budapest", zandvoort:"Europe/Amsterdam",
  monza:"Europe/Rome", "madrid-ifema":"Europe/Madrid", baku:"Asia/Baku", "marina-bay":"Asia/Singapore",
  "circuit-of-the-americas":"America/Chicago", "hermanos-rodriguez":"America/Mexico_City",
  interlagos:"America/Sao_Paulo", "las-vegas":"America/Los_Angeles", lusail:"Asia/Qatar", "yas-marina":"Asia/Dubai",
};
