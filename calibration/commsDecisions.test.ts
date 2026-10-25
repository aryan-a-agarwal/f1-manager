import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseDriverBriefingPriority,
  chooseEmailDecision,
  createCareer as createPlainCareer,
  createInitialComms,
  getPendingDecisionCount,
  getUnreadEmailCount,
  markEmailRead,
  updateEngineeringAllocation,
  updatePreRaceStrategy,
} from "../lib/career";

test("COMMS-01: Initial comms state initializes with emails, allocation, briefings, board confidence, news, and social", () => {
  const comms = createInitialComms("ferrari", "2027-01-04", 2027);

  assert.equal(comms.emails.length,0);
  assert.equal(comms.boardConfidence.mandates.length,0);
  assert.deepEqual(comms.driverBriefings,{});
  assert.equal(comms.news.length,0);
  assert.equal(comms.socialFeed.length,0);

  // Check 100-point capacity allocation
  const alloc = comms.engineeringAllocation;
  const sum =
    alloc.aerodynamics +
    alloc.mechanicalGrip +
    alloc.cooling +
    alloc.reliability +
    alloc.weightReduction +
    alloc.nextSeasonResearch;
  assert.equal(sum, 100, "Engineering capacity must total exactly 100 points");


});

test("COMMS-02: Email read status and unread count tracking", () => {
  const career = createCareer("ferrari");
  assert.ok(career.comms, "Career should initialize with comms");

  const initialUnread = getUnreadEmailCount(career);
  assert.ok(initialUnread > 0, "Should have unread emails initially");

  const firstEmailId = career.comms.emails[0].id;
  const updated = markEmailRead(career, firstEmailId);

  assert.equal(getUnreadEmailCount(updated), initialUnread - 1);
  const targetEmail = updated.comms?.emails.find((e) => e.id === firstEmailId);
  assert.equal(targetEmail?.unread, false);
});

test("COMMS-03: Email decisions apply trade-offs to car projects and board confidence", () => {
  const career = createCareer("ferrari");
  const initialPending = getPendingDecisionCount(career);
  assert.ok(initialPending >= 2, "Should have at least 2 pending decisions");

  const floorEmail = career.comms?.emails.find((e) => e.id === "email-floor-delay");
  assert.ok(floorEmail, "Floor delay email must exist");

  const floorProjectBefore = career.projects?.find((p) => p.id === "proj-floor-tunnel");
  assert.ok(floorProjectBefore, "Floor project must exist");
  const initialTestingDate = floorProjectBefore.testingCompletedDate;

  // Choose Option A: Reassign Aero Engineers (offset: -5 days, performance confidence: +3)
  const initialPerfConfidence = career.comms?.boardConfidence.performance ?? 0;
  const updated = chooseEmailDecision(career, "email-floor-delay", "choice-reassign-aero");

  const floorProjectAfter = updated.projects?.find((p) => p.id === "proj-floor-tunnel");
  assert.ok(floorProjectAfter);
  assert.notEqual(floorProjectAfter.testingCompletedDate, initialTestingDate);

  // Board confidence updated
  assert.equal(
    updated.comms?.boardConfidence.performance,
    initialPerfConfidence + 3,
    "Performance confidence should increase by 3",
  );

  // Email marked as decided and read
  const updatedEmail = updated.comms?.emails.find((e) => e.id === "email-floor-delay");
  assert.equal(updatedEmail?.chosenDecisionId, "choice-reassign-aero");
  assert.equal(updatedEmail?.unread, false);
  assert.equal(getPendingDecisionCount(updated), initialPending - 1);
});

test("COMMS-04: Engineering allocation validation enforces exact 100-point total", () => {
  const career = createCareer("ferrari");

  // Valid 100-point reallocation
  const validAlloc = {
    aerodynamics: 40,
    mechanicalGrip: 20,
    cooling: 10,
    reliability: 15,
    weightReduction: 10,
    nextSeasonResearch: 5,
  };
  const updated = updateEngineeringAllocation(career, validAlloc);
  assert.deepEqual(updated.comms?.engineeringAllocation, validAlloc);

  // Invalid reallocation (> 100)
  const invalidAllocOver = {
    ...validAlloc,
    aerodynamics: 50, // total 110
  };
  assert.throws(
    () => updateEngineeringAllocation(career, invalidAllocOver),
    /must sum to exactly 100 capacity points/,
  );

  // Invalid reallocation (< 100)
  const invalidAllocUnder = {
    ...validAlloc,
    aerodynamics: 30, // total 90
  };
  assert.throws(
    () => updateEngineeringAllocation(career, invalidAllocUnder),
    /must sum to exactly 100 capacity points/,
  );
});

test("COMMS-05: Driver briefing priorities shift morale and confidence", () => {
  const career = createCareer("ferrari");
  const d1Before = career.comms?.driverBriefings.driver_1.morale ?? 0;
  const d2Before = career.comms?.driverBriefings.driver_2.morale ?? 0;

  const updated = chooseDriverBriefingPriority(career, "driver_1");
  const d1After = updated.comms?.driverBriefings.driver_1.morale ?? 0;
  const d2After = updated.comms?.driverBriefings.driver_2.morale ?? 0;

  assert.equal(d1After, d1Before + 5, "Driver 1 morale should increase by 5");
  assert.equal(d2After, d2Before - 3, "Driver 2 morale should decrease by 3");
});

test("COMMS-06: Pre-race strategy changes persist into career comms", () => {
  const career = createCareer("ferrari");
  const newStrategy = {
    weekendObjective: "aggressive" as const,
    developmentFocus: "component_testing" as const,
    driverExpectation: "target_podium" as const,
  };
  const updated = updatePreRaceStrategy(career, newStrategy);
  assert.deepEqual(updated.comms?.preRaceStrategy, newStrategy);
});
