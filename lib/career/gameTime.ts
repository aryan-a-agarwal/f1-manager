import { saveCareer, type CareerStorage } from "./storage";
import type { CareerAdvanceReason, CareerState } from "./types";

export type GameDateTime = { date: string; minuteOfDay: number };
export type ScheduledGameEvent = {
  id: string;
  startsAt: GameDateTime;
  blocking: boolean;
  resolved?: boolean;
};
export type TimeAdvanceRequest =
  | { type: "hour" }
  | { type: "day" }
  | { type: "target"; target: GameDateTime }
  | { type: "next_event" };

export type TimeAdvanceResult = {
  career: CareerState;
  reachedEvent: ScheduledGameEvent | null;
  changed: boolean;
};

const MINUTES_PER_DAY = 24 * 60;
const DAY_START_MINUTE = 9 * 60;

function dateToDay(date: string) {
  const value = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid game date: ${date}`);
  }
  return Math.floor(value / 86_400_000);
}

function dayToDate(day: number) {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

export function toGameMinute(value: GameDateTime) {
  if (!Number.isInteger(value.minuteOfDay) || value.minuteOfDay < 0 || value.minuteOfDay >= MINUTES_PER_DAY) {
    throw new Error("Game time must be between 00:00 and 23:59.");
  }
  return dateToDay(value.date) * MINUTES_PER_DAY + value.minuteOfDay;
}

export function fromGameMinute(value: number): GameDateTime {
  if (!Number.isInteger(value)) throw new Error("Game time must use whole minutes.");
  const day = Math.floor(value / MINUTES_PER_DAY);
  return { date: dayToDate(day), minuteOfDay: value - day * MINUTES_PER_DAY };
}

export function addGameMinutes(value: GameDateTime, minutes: number): GameDateTime {
  if (!Number.isInteger(minutes)) throw new Error("Time advancement must use whole minutes.");
  return fromGameMinute(toGameMinute(value) + minutes);
}

function nextDayAtNine(value: GameDateTime): GameDateTime {
  return { date: dayToDate(dateToDay(value.date) + 1), minuteOfDay: DAY_START_MINUTE };
}

function upcomingEvents(events: readonly ScheduledGameEvent[], current: number) {
  return events
    .filter((event) => !event.resolved && toGameMinute(event.startsAt) > current)
    .sort((a, b) => toGameMinute(a.startsAt) - toGameMinute(b.startsAt));
}

export function calculateTimeAdvance(
  career: CareerState,
  request: TimeAdvanceRequest,
  events: readonly ScheduledGameEvent[] = [],
): TimeAdvanceResult {
  if (career.clock.status === "blocked") {
    throw new Error(`Time is blocked by event ${career.clock.blockingEventId ?? "unknown"}.`);
  }

  const current: GameDateTime = { date: career.clock.date, minuteOfDay: career.clock.minuteOfDay };
  const currentValue = toGameMinute(current);
  const upcoming = upcomingEvents(events, currentValue);
  let requestedTarget: GameDateTime;
  let reason: CareerAdvanceReason;

  if (request.type === "hour") {
    requestedTarget = addGameMinutes(current, 60);
    reason = "hour";
  } else if (request.type === "day") {
    requestedTarget = nextDayAtNine(current);
    reason = "day";
  } else if (request.type === "target") {
    requestedTarget = request.target;
    reason = "target";
  } else {
    const next = upcoming[0];
    if (!next) return { career, reachedEvent: null, changed: false };
    requestedTarget = next.startsAt;
    reason = "next_event";
  }

  const requestedValue = toGameMinute(requestedTarget);
  if (requestedValue <= currentValue) throw new Error("Game time can only move forwards.");

  const reachedEvent = upcoming.find((event) => event.blocking && toGameMinute(event.startsAt) <= requestedValue)
    ?? (request.type === "next_event" ? upcoming[0] : null);
  const target = reachedEvent?.startsAt ?? requestedTarget;
  const blocked = reachedEvent?.blocking === true;

  return {
    changed: true,
    reachedEvent,
    career: {
      ...career,
      clock: {
        ...career.clock,
        date: target.date,
        minuteOfDay: target.minuteOfDay,
        status: blocked ? "blocked" : "paused",
        blockingEventId: blocked ? reachedEvent.id : null,
        lastAdvance: {
          fromDate: current.date,
          fromMinuteOfDay: current.minuteOfDay,
          toDate: target.date,
          toMinuteOfDay: target.minuteOfDay,
          reason,
        },
      },
      season: {
        ...career.season,
        currentEventId: reachedEvent?.id ?? career.season.currentEventId,
      },
    },
  };
}

export function advanceCareerTime(
  career: CareerState,
  request: TimeAdvanceRequest,
  events: readonly ScheduledGameEvent[] = [],
  storage?: CareerStorage,
): TimeAdvanceResult {
  const result = calculateTimeAdvance(career, request, events);
  return result.changed ? { ...result, career: saveCareer(result.career, storage) } : result;
}

export function resolveBlockingEvent(career: CareerState, eventId: string, storage?: CareerStorage): CareerState {
  if (career.clock.status !== "blocked" || career.clock.blockingEventId !== eventId) {
    throw new Error("That event is not currently blocking game time.");
  }
  return saveCareer({
    ...career,
    clock: { ...career.clock, status: "paused", blockingEventId: null },
  }, storage);
}
