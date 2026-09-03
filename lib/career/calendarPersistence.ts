import { calendarScheduledEvents, completeCalendarSessionState, openCalendarSessionState } from "./calendar";
import { advanceCareerTime } from "./gameTime";
import { saveCareer, type CareerStorage } from "./storage";
import type { CareerState } from "./types";

export function openCalendarSession(career: CareerState, sessionId: string, storage?: CareerStorage) {
  return saveCareer(openCalendarSessionState(career, sessionId), storage);
}

export function completeCalendarSession(career: CareerState, sessionId: string, storage?: CareerStorage) {
  return saveCareer(completeCalendarSessionState(career, sessionId), storage);
}

export function continueCareerToNextSession(career: CareerState, storage?: CareerStorage) {
  if (career.weekendOperations.activeWeekendId) {
    const active = career.season.calendar.rounds.find((round) => round.id === career.weekendOperations.activeWeekendId);
    if (active?.status === "race_completed") throw new Error("Archive the completed weekend before continuing.");
  }
  return advanceCareerTime(career, { type:"next_event" }, calendarScheduledEvents(career.season.calendar), storage);
}
