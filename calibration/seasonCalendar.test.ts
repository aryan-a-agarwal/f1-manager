import assert from "node:assert/strict";
import {
  calendarScheduledEvents,
  completeCalendarSession,
  continueCareerToNextSession,
  createCareer,
  dateForIsoWeek,
  generateSeasonCalendar,
  loadCareer,
  nextCalendarSession,
  openCalendarSession,
  saveCareer,
  toGameMinute,
  type CareerStorage,
} from "../lib/career";

class MemoryStorage implements CareerStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const calendar = generateSeasonCalendar(2027);
assert.equal(calendar.rounds.length, 24);
assert.equal(new Set(calendar.rounds.map((round) => round.trackId)).size, 24);
assert.equal(new Set(calendar.rounds.map((round) => round.weekendNumber)).size, 24);
assert.deepEqual(calendar.rounds.filter((round) => round.sprint).map((round) => round.trackId), [
  "shanghai", "miami", "montreal", "silverstone", "zandvoort", "marina-bay",
]);
assert.equal(calendar.rounds[0].weekendId, "2027-W10");
assert.equal(calendar.rounds[0].weekendEndDate, "2027-03-14");
assert.equal(calendar.rounds.at(-1)?.weekendId, "2027-W49");
assert.equal(dateForIsoWeek(2028, 10, 7), "2028-03-12");
assert.throws(() => dateForIsoWeek(2027, 53, 7), /crosses outside season/);

const sessions = calendar.rounds.flatMap((round) => round.sessions);
assert.equal(sessions.length, 120);
const times = sessions.map((entry) => toGameMinute({ date:entry.date, minuteOfDay:entry.minuteOfDay }));
assert.ok(times.every((time,index) => index === 0 || time > times[index-1]));
assert.equal(calendarScheduledEvents(calendar).length, 120);

const storage = new MemoryStorage();
let career = saveCareer(createCareer("ferrari", { careerId:"calendar-test", now:new Date("2026-09-01T12:00:00Z") }), storage);
const originalCalendar = JSON.stringify(career.season.calendar);

const firstAdvance = continueCareerToNextSession(career, storage);
assert.equal(firstAdvance.reachedEvent?.id, "2027-round-01-practice_1");
assert.equal(firstAdvance.career.clock.status, "blocked");
career = firstAdvance.career;
assert.throws(() => openCalendarSession(career, "2027-round-01-practice_2", storage), /completed in order/);
career = openCalendarSession(career, "2027-round-01-practice_1", storage);
assert.equal(career.season.calendar.rounds[0].sessions[0].status, "available");
career = completeCalendarSession(career, "2027-round-01-practice_1", storage);
assert.equal(career.clock.status, "paused");
assert.equal(career.season.calendar.rounds[0].status, "weekend_active");

while (nextCalendarSession(career.season.calendar)) {
  const advanced = continueCareerToNextSession(career, storage);
  assert.equal(advanced.changed, true);
  assert.ok(advanced.reachedEvent);
  career = openCalendarSession(advanced.career, advanced.reachedEvent!.id, storage);
  career = completeCalendarSession(career, advanced.reachedEvent!.id, storage);
}
assert.equal(nextCalendarSession(career.season.calendar), null);
assert.ok(career.season.calendar.rounds.every((round) => round.status === "race_completed"));
assert.equal(calendarScheduledEvents(career.season.calendar).length, 0);
assert.deepEqual(loadCareer(storage)?.season.calendar, career.season.calendar);
assert.notEqual(JSON.stringify(career.season.calendar), originalCalendar);

console.log("Season calendar calibration passed.");
