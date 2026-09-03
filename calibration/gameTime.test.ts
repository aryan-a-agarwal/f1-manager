import assert from "node:assert/strict";
import {
  advanceCareerTime,
  calculateTimeAdvance,
  createCareer,
  loadCareer,
  resolveBlockingEvent,
  saveCareer,
  type CareerStorage,
  type ScheduledGameEvent,
} from "../lib/career";

class MemoryStorage implements CareerStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function at(date: string, minuteOfDay: number) {
  const career = createCareer("ferrari", { careerId: "clock-test", now: new Date("2026-09-01T12:00:00Z") });
  return { ...career, clock: { ...career.clock, date, minuteOfDay } };
}

const monthBoundary = calculateTimeAdvance(at("2027-01-31", 23 * 60 + 30), { type: "hour" });
assert.equal(monthBoundary.career.clock.date, "2027-02-01");
assert.equal(monthBoundary.career.clock.minuteOfDay, 30);

const leapDay = calculateTimeAdvance(at("2028-02-28", 16 * 60), { type: "day" });
assert.equal(leapDay.career.clock.date, "2028-02-29");
assert.equal(leapDay.career.clock.minuteOfDay, 9 * 60);
assert.throws(() => calculateTimeAdvance(at("2027-01-04", 9 * 60), {
  type: "target",
  target: { date: "2027-01-04", minuteOfDay: 8 * 60 },
}), /only move forwards/);

const events: ScheduledGameEvent[] = [
  { id: "news-1", startsAt: { date: "2027-01-05", minuteOfDay: 10 * 60 }, blocking: false },
  { id: "deadline-1", startsAt: { date: "2027-01-06", minuteOfDay: 12 * 60 }, blocking: true },
];
const stopped = calculateTimeAdvance(at("2027-01-04", 9 * 60), {
  type: "target",
  target: { date: "2027-01-10", minuteOfDay: 9 * 60 },
}, events);
assert.equal(stopped.reachedEvent?.id, "deadline-1");
assert.equal(stopped.career.clock.date, "2027-01-06");
assert.equal(stopped.career.clock.status, "blocked");
assert.throws(() => calculateTimeAdvance(stopped.career, { type: "hour" }), /blocked by event/);

const nextEvent = calculateTimeAdvance(at("2027-01-04", 9 * 60), { type: "next_event" }, events);
assert.equal(nextEvent.reachedEvent?.id, "news-1");
assert.equal(nextEvent.career.clock.status, "paused");

const storage = new MemoryStorage();
const initial = saveCareer(at("2027-01-04", 9 * 60), storage);
const savedAdvance = advanceCareerTime(initial, { type: "day" }, [], storage);
assert.equal(savedAdvance.career.metadata.revision, initial.metadata.revision + 1);
assert.deepEqual(loadCareer(storage)?.clock, savedAdvance.career.clock);

const blockedSaved = advanceCareerTime(savedAdvance.career, {
  type: "target",
  target: { date: "2027-01-10", minuteOfDay: 9 * 60 },
}, events, storage).career;
const released = resolveBlockingEvent(blockedSaved, "deadline-1", storage);
assert.equal(released.clock.status, "paused");
assert.equal(released.clock.blockingEventId, null);

const noEvents = calculateTimeAdvance(released, { type: "next_event" }, []);
assert.equal(noEvents.changed, false);
assert.equal(noEvents.career, released);

console.log("Controlled game-time calibration passed.");
