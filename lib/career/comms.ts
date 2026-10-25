import { addDaysToDate } from "./timeline";
import { saveCareer, type CareerStorage } from "./storage";
import type {
  BoardConfidence,
  CareerEmail,
  CareerState,
  CommsState,
  DriverBriefingState,
  EmailDecisionChoice,
  EngineeringAllocation,
  PaddockNewsItem,
  PreRaceStrategy,
  SocialComment,
} from "./types";

export function createInitialComms(_teamId: string, _startDate: string, _year: number): CommsState {
  return {
    emails: [], news: [], socialFeed: [], driverBriefings: {},
    engineeringAllocation: {aerodynamics:30,mechanicalGrip:25,cooling:15,reliability:15,weightReduction:10,nextSeasonResearch:5},
    preRaceStrategy: {weekendObjective:"balanced",developmentFocus:"setup_data",driverExpectation:"target_points"},
    boardConfidence: {overall:0,financial:0,performance:0,longTerm:0,mandates:[]},
  };
}

export function syncCommsState(career: CareerState): CareerState {
  const comms = career.comms ?? createInitialComms(career.player.teamId, career.clock.date, career.season.year);
  return {
    ...career,
    comms,
  };
}

export function getUnreadEmailCount(career: CareerState): number {
  if (!career.comms) return 0;
  return career.comms.emails.filter((e) => e.unread).length;
}

export function getPendingDecisionCount(career: CareerState): number {
  if (!career.comms) return 0;
  return career.comms.emails.filter((e) => e.requiresDecision && !e.chosenDecisionId).length;
}

function persistCareer(career: CareerState, storage?: CareerStorage): CareerState {
  if (storage || (typeof window !== "undefined" && window.localStorage)) {
    return saveCareer(career, storage);
  }
  return career;
}

export function markEmailRead(career: CareerState, emailId: string, storage?: CareerStorage): CareerState {
  const synced = syncCommsState(career);
  const emails = synced.comms!.emails.map((e) => (e.id === emailId ? { ...e, unread: false } : e));
  return persistCareer({
    ...synced,
    comms: { ...synced.comms!, emails },
  }, storage);
}

export function chooseEmailDecision(
  career: CareerState,
  emailId: string,
  choiceId: string,
  storage?: CareerStorage,
): CareerState {
  const synced = syncCommsState(career);
  const email = synced.comms!.emails.find((e) => e.id === emailId);
  if (!email) throw new Error(`Email ${emailId} not found.`);
  if (email.chosenDecisionId) { if(email.chosenDecisionId===choiceId)return career; throw new Error("This decision has already been made."); }
  const choice = email.decisionChoices?.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} not found for email ${emailId}.`);

  // 1. Update email state
  const updatedEmails = synced.comms!.emails.map((e) =>
    e.id === emailId ? { ...e, chosenDecisionId: choiceId, unread: false } : e,
  );

  // 2. Apply project offset if applicable
  let updatedProjects = synced.projects;
  if (choice.projectId && choice.projectDaysOffset && updatedProjects) {
    updatedProjects = updatedProjects.map((proj) => {
      if (proj.id !== choice.projectId) return proj;
      const newTestingDate = addDaysToDate(proj.testingCompletedDate, choice.projectDaysOffset!);
      return {
        ...proj,
        testingCompletedDate: newTestingDate,
      };
    });
  }

  // 3. Apply board confidence impact
  let updatedConfidence = synced.comms!.boardConfidence;
  if (choice.confidenceImpact) {
    const impact = choice.confidenceImpact;
    updatedConfidence = {
      ...updatedConfidence,
      overall: Math.min(100, Math.max(0, updatedConfidence.overall + (impact.overall ?? 0))),
      financial: Math.min(100, Math.max(0, updatedConfidence.financial + (impact.financial ?? 0))),
      performance: Math.min(100, Math.max(0, updatedConfidence.performance + (impact.performance ?? 0))),
      longTerm: Math.min(100, Math.max(0, updatedConfidence.longTerm + (impact.longTerm ?? 0))),
    };
  }

  // 4. If clock was blocked on this event, release block
  const unblockedClock =
    synced.clock.blockingEventId === emailId
      ? { ...synced.clock, status: "paused" as const, blockingEventId: null }
      : synced.clock;

  return persistCareer({
    ...synced,
    clock: unblockedClock,
    scheduler:{...synced.scheduler,pendingEvent:synced.scheduler.pendingEvent?.id===emailId?null:synced.scheduler.pendingEvent},
    projects: updatedProjects,
    comms: {
      ...synced.comms!,
      emails: updatedEmails,
      boardConfidence: updatedConfidence,
    },
  }, storage);
}

export function updateEngineeringAllocation(
  career: CareerState,
  allocation: EngineeringAllocation,
  storage?: CareerStorage,
): CareerState {
  const sum =
    allocation.aerodynamics +
    allocation.mechanicalGrip +
    allocation.cooling +
    allocation.reliability +
    allocation.weightReduction +
    allocation.nextSeasonResearch;

  if (sum !== 100) {
    throw new Error(`Engineering allocation must sum to exactly 100 capacity points. Current sum: ${sum}`);
  }

  const synced = syncCommsState(career);
  return persistCareer({
    ...synced,
    comms: {
      ...synced.comms!,
      engineeringAllocation: allocation,
    },
  }, storage);
}

export function updatePreRaceStrategy(
  career: CareerState,
  strategy: PreRaceStrategy,
  storage?: CareerStorage,
): CareerState {
  const synced = syncCommsState(career);
  return persistCareer({
    ...synced,
    comms: {
      ...synced.comms!,
      preRaceStrategy: strategy,
    },
  }, storage);
}

export function chooseDriverBriefingPriority(
  career: CareerState,
  driverKey: "driver_1" | "driver_2",
  storage?: CareerStorage,
): CareerState {
  const synced = syncCommsState(career);
  const briefings = { ...synced.comms!.driverBriefings };
  if (briefings[driverKey]) {
    briefings[driverKey] = {
      ...briefings[driverKey],
      morale: Math.min(100, briefings[driverKey].morale + 5),
      confidence: Math.min(100, briefings[driverKey].confidence + 3),
    };
  }
  const otherKey = driverKey === "driver_1" ? "driver_2" : "driver_1";
  if (briefings[otherKey]) {
    briefings[otherKey] = {
      ...briefings[otherKey],
      morale: Math.max(0, briefings[otherKey].morale - 3),
    };
  }

  return persistCareer({
    ...synced,
    comms: {
      ...synced.comms!,
      driverBriefings: briefings,
    },
  }, storage);
}
