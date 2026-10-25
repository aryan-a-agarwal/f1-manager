import { advanceCareerSchedule, acknowledgeScheduledEvent, careerSchedule } from "./scheduler";
import { toGameMinute, fromGameMinute, type ScheduledGameEvent, type GameDateTime, calculateTimeAdvance } from "./gameTime";
import { saveCareer, type CareerStorage } from "./storage";
import { weekendMilestones } from "./weekend";
import type {
  CareerState,
  CarDevelopmentProject,
  CarPartType,
  CarProjectPhase,
  EventCategory,
  EventSeverity,
  SimulationStopSettings,
  TimelineEvent,
} from "./types";

export const DEFAULT_STOP_SETTINGS: SimulationStopSettings = {
  carDevelopment: true,
  contracts: true,
  sponsorOffers: true,
  staffMeetings: true,
  majorNews: false,
  financialWarnings: true,
};

const DAY_MINUTES = 24 * 60;
const MORNING_MINUTE = 9 * 60;

export function dateToDayNumber(date: string): number {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date string: ${date}`);
  return Math.floor(parsed / 86_400_000);
}

export function dayNumberToDate(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

export function addDaysToDate(date: string, days: number): string {
  return dayNumberToDate(dateToDayNumber(date) + days);
}

export function daysBetweenDates(startDate: string, endDate: string): number {
  return dateToDayNumber(endDate) - dateToDayNumber(startDate);
}

export function createInitialEvents(_year: number, _teamId: string): TimelineEvent[] { return []; }

export function createInitialProjects(_startDate: string): CarDevelopmentProject[] { return []; }

export function updateProjectPhases(
  projects: readonly CarDevelopmentProject[],
  currentDate: string,
): { updated: CarDevelopmentProject[]; phaseChanges: { project: CarDevelopmentProject; from: CarProjectPhase; to: CarProjectPhase }[] } {
  const phaseChanges: { project: CarDevelopmentProject; from: CarProjectPhase; to: CarProjectPhase }[] = [];

  const updated = projects.map((project) => {
    if (project.status !== "in_progress") return project;

    let nextPhase: CarProjectPhase = project.phase;
    let actualGain = project.actualGainPct;
    let status: CarDevelopmentProject["status"] = project.status;

    if (project.phase === "design" && currentDate >= project.designCompletedDate) {
      nextPhase = "production";
    }
    if ((nextPhase === "production" || project.phase === "production") && currentDate >= project.productionCompletedDate) {
      nextPhase = "testing";
    }
    if ((nextPhase === "testing" || project.phase === "testing") && currentDate >= project.testingCompletedDate) {
      nextPhase = "completed";
      status = "completed";
      // Deterministic slight variance on actual gain (+/- 15%)
      const variance = 0.9 + ((project.name.length * 7) % 25) / 100;
      actualGain = Number((project.targetGainPct * variance).toFixed(2));
    }

    if (nextPhase !== project.phase) {
      phaseChanges.push({ project, from: project.phase, to: nextPhase });
      return {
        ...project,
        phase: nextPhase,
        actualGainPct: actualGain,
        status,
      };
    }
    return project;
  });

  return { updated, phaseChanges };
}

function isCategoryStopped(category: EventCategory, settings: SimulationStopSettings): boolean {
  switch (category) {
    case "car_development":
      return settings.carDevelopment !== false;
    case "contracts":
      return settings.contracts !== false;
    case "sponsor_offers":
      return settings.sponsorOffers !== false;
    case "staff_meetings":
    case "board_reviews":
      return settings.staffMeetings !== false;
    case "financial_warnings":
      return settings.financialWarnings !== false;
    case "major_news":
      return settings.majorNews === true;
    case "race_weekend":
      return true;
    case "facilities":
      return settings.carDevelopment !== false;
    default:
      return true;
  }
}

export type EnrichedScheduledEvent = ScheduledGameEvent & {
  title: string;
  category: EventCategory;
  severity: EventSeverity;
  description?: string;
  actionPage?: "home" | "team" | "race" | "drivers" | "calendar" | "finance" | "standings" | "market" | "comms";
};

export function collectCareerScheduledEvents(career: CareerState): EnrichedScheduledEvent[] {
  const settings = career.stopSettings ?? DEFAULT_STOP_SETTINGS;
  const events: EnrichedScheduledEvent[] = [];

  // 1. Race weekend sessions and preparation milestones
  const weekendEvents = weekendMilestones(career);
  for (const item of weekendEvents) {
    if (item.id.endsWith("-preparation")) {
      const roundId = item.id.slice(0, -"-preparation".length);
      const round = career.season.calendar.rounds.find((r) => r.id === roundId);
      const blocking = false; // Preparation is processed automatically; sessions remain mandatory.
      events.push({
        id: item.id,
        startsAt: item.startsAt,
        blocking,
        title: `${round?.grandPrixName ?? "Grand Prix"} Preparation Week`,
        category: "race_weekend",
        severity: "important",
        description: `Preparation opens for Round ${round?.roundNumber ?? ""}: team setup and logistics.`,
        actionPage: "race",
      });
    } else {
      // Direct session (FP1, Qualy, Race, etc.)
      const round = career.season.calendar.rounds.find((r) => r.sessions.some((s) => s.id === item.id));
      const session = round?.sessions.find((s) => s.id === item.id);
      const sessionTitle = session ? session.kind.replaceAll("_", " ").toUpperCase() : "Session";
      events.push({
        id: item.id,
        startsAt: item.startsAt,
        blocking: true, // Race sessions are strictly mandatory
        title: `${round?.grandPrixName ?? "Grand Prix"} - ${sessionTitle}`,
        category: "race_weekend",
        severity: "mandatory",
        description: `Official championship ${sessionTitle} is ready to run at ${round?.location ?? "track"}.`,
        actionPage: "race",
      });
    }
  }

  // 2. Timeline events (meetings, sponsors, contracts, board)
  const timelineEvents = career.events ?? [];
  for (const item of timelineEvents) {
    if (item.resolved) continue;
    const isBlocking =
      item.severity === "mandatory"
        ? true
        : item.severity === "important"
        ? isCategoryStopped(item.category, settings)
        : false;

    events.push({
      id: item.id,
      startsAt: { date: item.date, minuteOfDay: item.minuteOfDay },
      blocking: isBlocking,
      title: item.title,
      category: item.category,
      severity: item.severity,
      description: item.description,
      actionPage: item.actionPage,
    });
  }

  // 3. Car development project milestone events
  const projects = career.projects ?? [];
  for (const project of projects) {
    if (project.status !== "in_progress") continue;
    const stopForCar = isCategoryStopped("car_development", settings);

    if (project.phase === "design") {
      events.push({
        id: `${project.id}-design-complete`,
        startsAt: { date: project.designCompletedDate, minuteOfDay: MORNING_MINUTE },
        blocking: stopForCar,
        title: `${project.name} - Design Phase Completed`,
        category: "car_development",
        severity: "important",
        description: `Aerodynamic design of ${project.name} is complete. Proceeding to manufacturing in factory.`,
        actionPage: "team",
      });
    } else if (project.phase === "production") {
      events.push({
        id: `${project.id}-production-complete`,
        startsAt: { date: project.productionCompletedDate, minuteOfDay: MORNING_MINUTE },
        blocking: stopForCar,
        title: `${project.name} - Production Completed`,
        category: "car_development",
        severity: "important",
        description: `Physical manufacturing of ${project.name} is finished. Ready for wind tunnel/track correlation testing.`,
        actionPage: "team",
      });
    } else if (project.phase === "testing") {
      events.push({
        id: `${project.id}-testing-complete`,
        startsAt: { date: project.testingCompletedDate, minuteOfDay: MORNING_MINUTE },
        blocking: stopForCar,
        title: `${project.name} - Testing Complete — Ready to Fit`,
        category: "car_development",
        severity: "important",
        description: `Testing completed for ${project.name}. Upgrades verified and ready for race weekend installation.`,
        actionPage: "team",
      });
    }
  }

  return events;
}

export type ActionableEventPreview = {
  event: EnrichedScheduledEvent;
  daysAway: number;
  isToday: boolean;
  date: string;
};

export function findNextActionableEvent(career: CareerState): ActionableEventPreview | null {
  const currentMinute = toGameMinute({ date: career.clock.date, minuteOfDay: career.clock.minuteOfDay });
  const allEvents = careerSchedule(career);

  // Filter for events that either block or require attention, strictly in the future
  const upcoming = allEvents
    .filter((e) => e.blocking)
    .sort((a, b) => toGameMinute(a.startsAt) - toGameMinute(b.startsAt));

  const next = upcoming[0];
  if (!next) return null;

  const daysAway = Math.max(0, daysBetweenDates(career.clock.date, next.startsAt.date));
  return {
    event: next,
    daysAway,
    isToday: daysAway === 0,
    date: next.startsAt.date,
  };
}

export function syncCareerProjectsAndEvents(career: CareerState): CareerState {
  const currentEvents = career.events ?? createInitialEvents(career.season.year, career.player.teamId);
  const currentProjects = career.projects ?? createInitialProjects(career.clock.date);
  const stopSettings = career.stopSettings ?? DEFAULT_STOP_SETTINGS;

  const updated = currentProjects;

  return {
    ...career,
    events: currentEvents,
    projects: updated,
    stopSettings,
  };
}

export function advanceCareerNextEvent(career:CareerState,storage?:CareerStorage){return advanceCareerSchedule(career,{type:"next_event"},storage);}
export function advanceCareerOneDay(career:CareerState,storage?:CareerStorage){return advanceCareerSchedule(career,{type:"day"},storage);}
export function advanceCareerOneWeek(career:CareerState,storage?:CareerStorage){return advanceCareerSchedule(career,{type:"target",target:fromGameMinute(toGameMinute(career.clock)+7*1440)},storage);}
export function advanceCareerNextRaceWeekend(career:CareerState,storage?:CareerStorage){
  const next=career.season.calendar.rounds.flatMap(round=>round.sessions).find(session=>session.status!=="completed"&&session.status!=="cancelled");
  if(!next)return {career,changed:false,reachedEvent:null,outcome:"season_complete" as const};
  return advanceCareerSchedule(career,{type:"target",target:fromGameMinute(Math.max(toGameMinute(career.clock),toGameMinute(next)))},storage);
}
export function resolveTimelineEvent(career:CareerState,eventId:string,storage?:CareerStorage){return acknowledgeScheduledEvent(career,eventId,storage);}
