import { circuitRaceFacts } from "@/lib/data/circuitFacts";
import { STANDARD_SESSIONS, SPRINT_SESSIONS, VENUE_TIME_ZONES, type SeasonProfile } from "./seasonProfiles";
import type {
  CalendarRound,
  CalendarSession,
  CareerState,
  SeasonCalendar,
  SessionKind,
  WeekendStatus,
} from "./types";
import type { GameDateTime, ScheduledGameEvent } from "./gameTime";

export const CALENDAR_TEMPLATE_SOURCE = "https://www.formula1.com/en/latest/article/formula-1-reveals-calendar-for-2026-sezon.YctbMZWqBvrgyddrnauo8";

type RoundTemplate = {
  trackId: string;
  grandPrixName: string;
  location: string;
  weekendNumber: number;
  sprint?: true;
};

export const seasonCalendarTemplate: readonly RoundTemplate[] = [
  { trackId:"albert-park", grandPrixName:"Australian Grand Prix", location:"Melbourne", weekendNumber:10 },
  { trackId:"shanghai", grandPrixName:"Chinese Grand Prix", location:"Shanghai", weekendNumber:11, sprint:true },
  { trackId:"suzuka", grandPrixName:"Japanese Grand Prix", location:"Suzuka", weekendNumber:13 },
  { trackId:"bahrain", grandPrixName:"Bahrain Grand Prix", location:"Sakhir", weekendNumber:15 },
  { trackId:"jeddah", grandPrixName:"Saudi Arabian Grand Prix", location:"Jeddah", weekendNumber:16 },
  { trackId:"miami", grandPrixName:"Miami Grand Prix", location:"Miami Gardens", weekendNumber:18, sprint:true },
  { trackId:"montreal", grandPrixName:"Canadian Grand Prix", location:"Montreal", weekendNumber:21, sprint:true },
  { trackId:"monaco", grandPrixName:"Monaco Grand Prix", location:"Monte Carlo", weekendNumber:23 },
  { trackId:"barcelona-catalunya", grandPrixName:"Barcelona-Catalunya Grand Prix", location:"Montmeló", weekendNumber:24 },
  { trackId:"spielberg", grandPrixName:"Austrian Grand Prix", location:"Spielberg", weekendNumber:26 },
  { trackId:"silverstone", grandPrixName:"British Grand Prix", location:"Silverstone", weekendNumber:27, sprint:true },
  { trackId:"spa-francorchamps", grandPrixName:"Belgian Grand Prix", location:"Spa-Francorchamps", weekendNumber:29 },
  { trackId:"hungaroring", grandPrixName:"Hungarian Grand Prix", location:"Mogyoród", weekendNumber:30 },
  { trackId:"zandvoort", grandPrixName:"Dutch Grand Prix", location:"Zandvoort", weekendNumber:34, sprint:true },
  { trackId:"monza", grandPrixName:"Italian Grand Prix", location:"Monza", weekendNumber:36 },
  { trackId:"madrid-ifema", grandPrixName:"Madrid Grand Prix", location:"Madrid", weekendNumber:37 },
  { trackId:"baku", grandPrixName:"Azerbaijan Grand Prix", location:"Baku", weekendNumber:39 },
  { trackId:"marina-bay", grandPrixName:"Singapore Grand Prix", location:"Singapore", weekendNumber:41, sprint:true },
  { trackId:"circuit-of-the-americas", grandPrixName:"United States Grand Prix", location:"Austin", weekendNumber:43 },
  { trackId:"hermanos-rodriguez", grandPrixName:"Mexico City Grand Prix", location:"Mexico City", weekendNumber:44 },
  { trackId:"interlagos", grandPrixName:"São Paulo Grand Prix", location:"São Paulo", weekendNumber:45 },
  { trackId:"las-vegas", grandPrixName:"Las Vegas Grand Prix", location:"Las Vegas", weekendNumber:47 },
  { trackId:"lusail", grandPrixName:"Qatar Grand Prix", location:"Lusail", weekendNumber:48 },
  { trackId:"yas-marina", grandPrixName:"Abu Dhabi Grand Prix", location:"Abu Dhabi", weekendNumber:49 },
] as const;

function isoDay(date: Date) {
  return date.getUTCDay() || 7;
}

export function dateForIsoWeek(year: number, week: number, weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7) {
  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) throw new Error("Invalid ISO weekend.");
  const fourthJanuary = new Date(Date.UTC(year, 0, 4));
  const weekOneMonday = new Date(fourthJanuary);
  weekOneMonday.setUTCDate(fourthJanuary.getUTCDate() - isoDay(fourthJanuary) + 1);
  const result = new Date(weekOneMonday);
  result.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7 + weekday - 1);
  if (result.getUTCFullYear() !== year) throw new Error(`ISO weekend ${week} crosses outside season ${year}.`);
  return result.toISOString().slice(0, 10);
}

function session(id: string, kind: SessionKind, date: string, minuteOfDay: number): CalendarSession {
  return { id:`${id}-${kind}`, kind, date, minuteOfDay, status:"scheduled", resultId:null };
}

export function generateSeasonCalendar(year: number, profile: SeasonProfile = {id:"generated-2026-order",version:1,label:"Generated career calendar",rounds:seasonCalendarTemplate}): SeasonCalendar {
  if (!Number.isInteger(year) || year < 2027) throw new Error("Career calendars begin in 2027.");
  const rounds = profile.rounds.map((template, index): CalendarRound => {
    const id = `${year}-round-${String(index + 1).padStart(2,"0")}`;
    const startDate = template.startDate ?? dateForIsoWeek(year,template.weekendNumber,5);
    const templates = template.sessions ?? (template.sprint ? SPRINT_SESSIONS : STANDARD_SESSIONS);
    const sessions = templates.map(entry => {
      const date = new Date(`${startDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + entry.dayOffset);
      return session(id,entry.kind,date.toISOString().slice(0,10),entry.minuteOfDay);
    });
    return {id,roundNumber:index+1,weekendNumber:template.weekendNumber,weekendId:`${year}-W${String(template.weekendNumber).padStart(2,"0")}`,
      trackId:template.trackId,grandPrixName:template.grandPrixName,location:template.location,sprint:Boolean(template.sprint),
      venueTimeZone:template.venueTimeZone ?? VENUE_TIME_ZONES[template.trackId] ?? "UTC",
      weekendStartDate:sessions[0]?.date ?? startDate,weekendEndDate:sessions.at(-1)?.date ?? startDate,status:"scheduled",sessions};
  });
  const periods: NonNullable<SeasonCalendar["periods"]> = [];
  if(rounds.length) {
    const previousDate=(date:string)=>new Date(Date.parse(`${date}T00:00:00Z`)-86400000).toISOString().slice(0,10);
    const followingDate=(date:string)=>new Date(Date.parse(`${date}T00:00:00Z`)+86400000).toISOString().slice(0,10);
    periods.push({kind:"preseason",label:"Pre-season",startDate:`${year}-01-01`,endDate:previousDate(rounds[0].weekendStartDate)});
    rounds.slice(1).forEach((round,index)=>{const prev=rounds[index];if(Date.parse(round.weekendStartDate)-Date.parse(prev.weekendEndDate)>14*86400000) periods.push({kind:"break",label:"Championship break",startDate:followingDate(prev.weekendEndDate),endDate:previousDate(round.weekendStartDate)});});
    periods.push({kind:"offseason",label:"Off-season",startDate:followingDate(rounds.at(-1)!.weekendEndDate),endDate:`${year}-12-31`});
  }
  const calendar:SeasonCalendar={year,generated:true,sourceTemplate:"official-2026-order",sourceUrl:CALENDAR_TEMPLATE_SOURCE,profileId:profile.id,profileVersion:profile.version,timeBasis:"UTC",periods,rounds};
  if(!isSeasonCalendar(calendar))throw new Error("The season profile contains an invalid or overlapping schedule.");
  return calendar;
}

export function calendarScheduledEvents(calendar: SeasonCalendar): ScheduledGameEvent[] {
  return calendar.rounds.flatMap((round) => round.sessions
    .filter((entry) => entry.status !== "completed" && entry.status !== "cancelled")
    .map((entry) => ({ id:entry.id, startsAt:{date:entry.date,minuteOfDay:entry.minuteOfDay}, blocking:true })));
}

export function nextCalendarSession(calendar: SeasonCalendar) {
  return calendar.rounds.flatMap((round) => round.sessions.map((entry) => ({ round, session:entry })))
    .find(({ session:entry }) => entry.status !== "completed" && entry.status !== "cancelled") ?? null;
}

function roundStatus(round: CalendarRound): WeekendStatus {
  const completed = new Set(round.sessions.filter((entry) => entry.status === "completed").map((entry) => entry.kind));
  if (completed.has("race")) return "race_completed";
  if (completed.has("qualifying")) return "race_ready";
  if (completed.has("practice_3") || completed.has("sprint")) return "practice_completed";
  if (completed.size > 0 || round.sessions.some((entry) => entry.status !== "scheduled")) return "weekend_active";
  return round.status;
}

function updateSession(career: CareerState, sessionId: string, status: "available" | "completed") {
  const ordered = career.season.calendar.rounds.flatMap((round) => round.sessions);
  const sessionIndex = ordered.findIndex((entry) => entry.id === sessionId);
  if (sessionIndex < 0) throw new Error("Calendar session not found.");
  if (ordered.slice(0, sessionIndex).some((entry) => entry.status !== "completed" && entry.status !== "cancelled")) throw new Error("Calendar sessions must be completed in order.");
  const current = ordered[sessionIndex];
  if (status === "available" && current.status !== "scheduled") throw new Error("Only a scheduled session can become available.");
  if (status === "completed" && current.status !== "available") throw new Error("Only an available session can be completed.");
  if (career.clock.blockingEventId !== sessionId) throw new Error("The career clock has not reached this session.");

  const rounds = career.season.calendar.rounds.map((round) => {
    if (!round.sessions.some((entry) => entry.id === sessionId)) return round;
    const changed = { ...round, sessions:round.sessions.map((entry) => entry.id === sessionId ? { ...entry, status } : entry) };
    return { ...changed, status:roundStatus(changed) };
  });
  return {
    ...career,
    scheduler:status==="completed"?{...career.scheduler,pendingEvent:null}:career.scheduler,
    clock: status === "completed" ? { ...career.clock, status:"paused" as const, blockingEventId:null } : career.clock,
    season: { ...career.season, currentEventId:sessionId, calendar:{...career.season.calendar,rounds} },
  };
}

export function openCalendarSessionState(career: CareerState, sessionId: string) {
  return updateSession(career,sessionId,"available");
}

export function completeCalendarSessionState(career: CareerState, sessionId: string) {
  return updateSession(career,sessionId,"completed");
}

const validatedTimeZones=new Set<string>();

export function isSeasonCalendar(value: unknown): value is SeasonCalendar {
  if (typeof value !== "object" || value === null) return false;
  const calendar = value as Partial<SeasonCalendar>;
  if (!Number.isInteger(calendar.year) || calendar.generated !== true || typeof calendar.sourceTemplate !== "string" || typeof calendar.sourceUrl !== "string" || !Array.isArray(calendar.rounds) || calendar.rounds.length < 1) return false;
  const weekendStatuses: readonly WeekendStatus[] = ["scheduled","preparation","entered","weekend_active","practice_completed","qualifying_completed","race_ready","race_completed","archived"];
  const sessionKinds: readonly SessionKind[] = ["practice_1","practice_2","practice_3","sprint_qualifying","sprint","qualifying","race"];
  const sessionStatuses: readonly import("./types").SessionStatus[] = ["scheduled","available","preparing","locked","running","processing","completed","cancelled","postponed"];
  const validDate = (date:unknown) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(date);
  };
  const valid = calendar.rounds.every((round,index) => Boolean(round)
    && typeof round.id === "string"
    && round.roundNumber === index+1
    && Number.isInteger(round.weekendNumber)
    && typeof round.weekendId === "string"
    && typeof round.trackId === "string"
    && typeof round.grandPrixName === "string"
    && typeof round.location === "string"
    && typeof round.sprint === "boolean"
    && validDate(round.weekendStartDate)
    && validDate(round.weekendEndDate)
    && weekendStatuses.includes(round.status)
    && Array.isArray(round.sessions)
    && round.sessions.length >= 2
    && round.sessions.every((entry) => typeof entry.id === "string"
      && sessionKinds.includes(entry.kind)
      && validDate(entry.date)
      && Number.isInteger(entry.minuteOfDay)
      && entry.minuteOfDay >= 0
      && entry.minuteOfDay < 24*60
      && sessionStatuses.includes(entry.status)
      && (entry.resultId === null || typeof entry.resultId === "string")));
  if (!valid) return false;
  if(calendar.timeBasis !== undefined && calendar.timeBasis !== "UTC")return false;
  if(calendar.profileVersion !== undefined && (!Number.isInteger(calendar.profileVersion)||calendar.profileVersion<1))return false;
  if(calendar.periods && !calendar.periods.every(period=>["preseason","break","offseason"].includes(period.kind)&&validDate(period.startDate)&&validDate(period.endDate)&&period.startDate<=period.endDate))return false;
  let previous=-Infinity;
  for(const round of calendar.rounds){
    if(!circuitRaceFacts[round.trackId])return false;
    if(round.venueTimeZone&&!validatedTimeZones.has(round.venueTimeZone)){try{new Intl.DateTimeFormat("en-GB",{timeZone:round.venueTimeZone});validatedTimeZones.add(round.venueTimeZone);}catch{return false;}}
    const expected=round.sprint?["practice_1","sprint_qualifying","sprint","qualifying","race"]:["practice_1","practice_2","practice_3","qualifying","race"];
    // Cancelled sessions keep their original slots so saved result identities remain stable.
    if(round.sessions.length!==expected.length||round.sessions.some((entry,index)=>entry.kind!==expected[index]))return false;
    if(round.weekendStartDate!==round.sessions[0].date||round.weekendEndDate!==round.sessions.at(-1)!.date)return false;
    for(const entry of round.sessions){const minute=Date.parse(`${entry.date}T00:00:00Z`)/60000+entry.minuteOfDay;if(minute<=previous||entry.date.slice(0,4)!==String(calendar.year))return false;previous=minute;}
  }
  return new Set(calendar.rounds.map((round) => round.id)).size === calendar.rounds.length
    && new Set(calendar.rounds.map((round) => round.weekendNumber)).size === calendar.rounds.length
    && new Set(calendar.rounds.map((round) => round.trackId)).size === calendar.rounds.length
    && new Set(calendar.rounds.flatMap((round) => round.sessions.map((entry) => entry.id))).size === calendar.rounds.flatMap(round=>round.sessions).length;
}
