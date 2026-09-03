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

function buildSessions(id: string, year: number, week: number, sprint: boolean) {
  const friday = dateForIsoWeek(year, week, 5);
  const saturday = dateForIsoWeek(year, week, 6);
  const sunday = dateForIsoWeek(year, week, 7);
  return sprint
    ? [session(id,"practice_1",friday,10*60),session(id,"sprint_qualifying",friday,14*60),session(id,"sprint",saturday,10*60),session(id,"qualifying",saturday,15*60),session(id,"race",sunday,14*60)]
    : [session(id,"practice_1",friday,10*60),session(id,"practice_2",friday,14*60),session(id,"practice_3",saturday,11*60),session(id,"qualifying",saturday,15*60),session(id,"race",sunday,14*60)];
}

export function generateSeasonCalendar(year: number): SeasonCalendar {
  if (!Number.isInteger(year) || year < 2027) throw new Error("Career calendars begin in 2027.");
  const rounds = seasonCalendarTemplate.map((template, index): CalendarRound => {
    const roundNumber = index + 1;
    const id = `${year}-round-${String(roundNumber).padStart(2,"0")}`;
    return {
      id,
      roundNumber,
      weekendNumber:template.weekendNumber,
      weekendId:`${year}-W${String(template.weekendNumber).padStart(2,"0")}`,
      trackId:template.trackId,
      grandPrixName:template.grandPrixName,
      location:template.location,
      sprint:Boolean(template.sprint),
      weekendStartDate:dateForIsoWeek(year,template.weekendNumber,5),
      weekendEndDate:dateForIsoWeek(year,template.weekendNumber,7),
      status:"scheduled",
      sessions:buildSessions(id,year,template.weekendNumber,Boolean(template.sprint)),
    };
  });
  return { year, generated:true, sourceTemplate:"official-2026-order", sourceUrl:CALENDAR_TEMPLATE_SOURCE, rounds };
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

export function isSeasonCalendar(value: unknown): value is SeasonCalendar {
  if (typeof value !== "object" || value === null) return false;
  const calendar = value as Partial<SeasonCalendar>;
  if (!Number.isInteger(calendar.year) || calendar.generated !== true || calendar.sourceTemplate !== "official-2026-order" || typeof calendar.sourceUrl !== "string" || !Array.isArray(calendar.rounds) || calendar.rounds.length !== 24) return false;
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
    && round.sessions.length === 5
    && round.sessions.every((entry) => typeof entry.id === "string"
      && sessionKinds.includes(entry.kind)
      && validDate(entry.date)
      && Number.isInteger(entry.minuteOfDay)
      && entry.minuteOfDay >= 0
      && entry.minuteOfDay < 24*60
      && sessionStatuses.includes(entry.status)
      && (entry.resultId === null || typeof entry.resultId === "string")));
  if (!valid) return false;
  return new Set(calendar.rounds.map((round) => round.weekendNumber)).size === calendar.rounds.length
    && new Set(calendar.rounds.map((round) => round.trackId)).size === calendar.rounds.length
    && new Set(calendar.rounds.flatMap((round) => round.sessions.map((entry) => entry.id))).size === calendar.rounds.length*5;
}
