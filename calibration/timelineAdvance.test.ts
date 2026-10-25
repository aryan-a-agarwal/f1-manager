import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import {
  advanceCareerNextEvent,
  advanceCareerNextRaceWeekend,
  advanceCareerOneDay,
  advanceCareerOneWeek,
  collectCareerScheduledEvents,
  createCareer as createPlainCareer,
  findNextActionableEvent,
  resolveTimelineEvent,
  type CareerStorage,
} from "../lib/career";

class MemoryStorage implements CareerStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}

const storage = new MemoryStorage();
let career = createCareer("mclaren", { careerId: "timeline-test" });

// Isolate timeline stops; required email decisions have their own integration coverage.
career={...career,comms:{...career.comms!,emails:[]}};

// 1. Check initial structures
assert.ok(Array.isArray(career.events), "Career has events array");
assert.ok(Array.isArray(career.projects), "Career has projects array");
assert.ok(career.stopSettings, "Career has stopSettings");
assert.equal(career.events.length, 5, "Has 5 initial timeline events");
assert.equal(career.projects.length, 2, "Has 2 initial development projects");
assert.equal(career.clock.date, "2027-01-04");

// 2. Next actionable event preview
const nextPreview = findNextActionableEvent(career);
assert.ok(nextPreview !== null, "Finds upcoming event preview");
assert.equal(nextPreview.event.id, "evt-2027-tech-meeting");
assert.equal(nextPreview.event.category, "staff_meetings");
assert.equal(nextPreview.daysAway, 8);

// 3. Advance to Next Event
const advanceResult = advanceCareerNextEvent(career, storage);
assert.equal(advanceResult.changed, true);
assert.equal(advanceResult.career.clock.date, "2027-01-12");
assert.equal(advanceResult.reachedEvent?.id, "evt-2027-tech-meeting");
assert.equal(advanceResult.career.clock.status, "blocked");
assert.equal(advanceResult.career.clock.blockingEventId, "evt-2027-tech-meeting");

// 4. Resolve the event and continue
career = resolveTimelineEvent(advanceResult.career, "evt-2027-tech-meeting", storage);
assert.equal(career.clock.status, "paused");
assert.equal(career.clock.blockingEventId, null);

// 5. Test Car Development completion event:
// Front Wing Spec-B design completes on 2027-01-18.
const nextDevEvent = advanceCareerNextEvent(career, storage);
assert.equal(nextDevEvent.career.clock.date, "2027-01-18");
assert.equal(nextDevEvent.reachedEvent?.id, "proj-fw-spec-b-design-complete");
const fwProject = nextDevEvent.career.projects?.find((p) => p.id === "proj-fw-spec-b");
assert.equal(fwProject?.phase, "production", "Front wing transitioned to production phase");

// 6. Stop settings configuration:
// If staffMeetings is disabled, simulation should skip driver briefing (Feb 08)
career = resolveTimelineEvent(nextDevEvent.career, "proj-fw-spec-b-design-complete", storage);
career.stopSettings = {
  ...career.stopSettings!,
  staffMeetings: false,
  sponsorOffers: false,
};

// Now advancing should skip sponsor offer (Jan 25) and driver briefing (Feb 08)
// Next stop should be Underfloor Venturi design complete (Feb 02) or FIA deadline (Feb 22)
const skipAdvance = advanceCareerNextEvent(career, storage);
assert.ok(skipAdvance.career.clock.date > "2027-01-18");
assert.notEqual(skipAdvance.reachedEvent?.id, "evt-2027-sponsor-proposal");

// 7. Advance One Day
career = resolveTimelineEvent(skipAdvance.career, skipAdvance.reachedEvent!.id, storage);
const currentDate = career.clock.date;
const oneDayResult = advanceCareerOneDay(career, storage);
assert.equal(oneDayResult.changed, true);
assert.notEqual(oneDayResult.career.clock.date, currentDate);

// 8. Advance One Week
career = oneDayResult.career;
if (career.clock.status === "blocked" && career.clock.blockingEventId) {
  career = resolveTimelineEvent(career, career.clock.blockingEventId, storage);
}
const preWeekDate = career.clock.date;
const oneWeekResult = advanceCareerOneWeek(career, storage);
assert.equal(oneWeekResult.changed, true);

// 9. Advance Towards Next Race Weekend
career = oneWeekResult.career;
if (career.clock.status === "blocked" && career.clock.blockingEventId) {
  career = resolveTimelineEvent(career, career.clock.blockingEventId, storage);
}
const gpResult = advanceCareerNextRaceWeekend(career, storage);
assert.equal(gpResult.changed, true);
assert.ok(gpResult.career.clock.date >= preWeekDate);

console.log("Timeline and time advance calibration passed.");
