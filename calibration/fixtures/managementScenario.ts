import {createInitialFinance} from '../../lib/career/finance';
import {createInitialCarDevelopment} from '../../lib/career/carDev';
import {createInitialFacilities} from '../../lib/career/facilities';
import {createInitialMarket} from '../../lib/career/paddockMarket';
// Explicit test scenarios; never imported by application code.
import {createCareer as createPlainCareer} from '../../lib/career/createCareer';
import {addDaysToDate} from '../../lib/career/timeline';
import type {CommsState,CareerEmail,EngineeringAllocation,DriverBriefingState,PreRaceStrategy,BoardConfidence,PaddockNewsItem,SocialComment,TimelineEvent,CarDevelopmentProject,CommercialState,SponsorContract} from '../../lib/career/types';
const MORNING_MINUTE=540;
export function scenarioComms(teamId: string, startDate: string, year: number): CommsState {
  const emails: CareerEmail[] = [
    {
      id: "email-floor-delay",
      senderName: "James Allison",
      senderRole: "Technical Director",
      senderTeamId: teamId,
      subject: "URGENT: Floor tunnel project schedule risk",
      date: `${year}-01-18`,
      category: "development",
      priority: "urgent",
      unread: true,
      requiresDecision: true,
      body: `Wind tunnel correlation data for the new Underfloor Venturi Channels has shown unexpected boundary-layer turbulence. Tooling is currently pacing 5 days behind schedule.

If we maintain the current pace, this component will miss Round 1 in Australia. We require your management decision on how to deploy factory resources to mitigate this delay.`,
      decisionChoices: [
        {
          id: "choice-reassign-aero",
          label: "Option A: Reassign Aero Engineers",
          description: "Divert engineers from the Front Wing project directly to the floor team.",
          effectsSummary: "+Floor arrives in time for Australia; -Front Wing delayed by 5 days",
          projectId: "proj-floor-tunnel",
          projectDaysOffset: -5,
          confidenceImpact: { performance: 3 },
        },
        {
          id: "choice-authorise-overtime",
          label: "Option B: Authorise Factory Overtime",
          description: "Run night shifts in carbon composite manufacturing to compress production time.",
          effectsSummary: "+Floor arrives in time; -Cost £380,000 extra; -Factory morale slight dip",
          projectId: "proj-floor-tunnel",
          projectDaysOffset: -5,
          costOffset: 380_000,
          confidenceImpact: { financial: -2, performance: 4 },
        },
        {
          id: "choice-maintain-pace",
          label: "Option C: Maintain Current Pace",
          description: "Keep standard shifts and avoid overtime expenses.",
          effectsSummary: "+Zero extra budget impact; -Part misses Round 1 Australia",
          projectId: "proj-floor-tunnel",
          projectDaysOffset: 0,
          confidenceImpact: { performance: -2, financial: 2 },
        },
      ],
      chosenDecisionId: null,
      actionPage: "comms",
      actionLabel: "Review Dilemma",
    },
    {
      id: "email-sponsor-apex",
      senderName: "Elena Rostova",
      senderRole: "Commercial Partnerships Director",
      subject: "Commercial Partnership Proposal: Apex Energy",
      date: `${year}-01-25`,
      category: "sponsors",
      priority: "important",
      unread: true,
      requiresDecision: true,
      body: `Apex Energy has delivered their formal commercial sponsorship contract for the 2027-2028 seasons.

Key Terms:
• Base Fee: £4,200,000 / season
• Performance Bonus: £400,000 per podium finish
• Consistency Bonus: £1,000,000 for 5 consecutive points finishes
• Requirement: Both race drivers must attend 2 global PR promotional events per season, reducing simulator preparation.`,
      decisionChoices: [
        {
          id: "choice-accept-sponsor",
          label: "Option A: Accept Full Commercial Terms",
          description: "Sign the 2-year partnership on full terms.",
          effectsSummary: "+£4.2M guaranteed annual income; -Driver PR days required",
          costOffset: -4_200_000,
          confidenceImpact: { financial: 6, overall: 3 },
        },
        {
          id: "choice-counter-sponsor",
          label: "Option B: Counter with Reduced PR Obligations",
          description: "Offer only 1 PR event in exchange for £3,500,000 base fee.",
          effectsSummary: "+£3.5M annual income; +Preserves driver preparation time",
          costOffset: -3_500_000,
          confidenceImpact: { financial: 4, performance: 2 },
        },
        {
          id: "choice-decline-sponsor",
          label: "Option C: Decline and Seek Higher Tier",
          description: "Keep sidepods vacant for late-season championship partners.",
          effectsSummary: "+Maximum flexibility; -No immediate sponsor cash inflow",
          confidenceImpact: { financial: -3, longTerm: 2 },
        },
      ],
      chosenDecisionId: null,
      actionPage: "comms",
      actionLabel: "Review Terms",
    },
    {
      id: "email-driver-feedback",
      senderName: "Lead Race Driver",
      senderRole: "Driver 1",
      senderTeamId: teamId,
      subject: "Simulator Session 2 Notes & Cornering Feedback",
      date: `${year}-02-08`,
      category: "drivers",
      priority: "normal",
      unread: true,
      requiresDecision: false,
      body: `Hi Boss, completed 60 laps in the simulator evaluating the 2027 aero balance today.

The high-speed stability through fast sweeps feels positive, but the rear axle snaps under heavy trail-braking into slow corners. If engineering can focus on mechanical suspension compliance and kerb absorption, we can carry significantly more entry speed. Let me know when the engineers review our setup allocation!`,
      actionPage: "drivers",
      actionLabel: "View Driver Feedback",
    },
    {
      id: "email-fia-homologation",
      senderName: "Nikolas Tombazis",
      senderRole: "FIA Single-Seater Director",
      subject: "Formal Notice: 2027 Safety & Homologation Dossier",
      date: `${year}-02-22`,
      category: "fia",
      priority: "urgent",
      unread: true,
      requiresDecision: false,
      body: `To all Competitors:
This is formal notification that the technical homologation window for chassis survival cell static load compliance and power unit seal verification closes 14 days prior to Round 1 scrutineering in Melbourne.

All digital telemetry channels and CAD verification hashes must be uploaded to the FIA regulatory portal by 17:00 CET on the scheduled deadline.`,
      actionPage: "team",
      actionLabel: "View Regulatory Status",
    },
    {
      id: "email-board-expectations",
      senderName: "Executive Board",
      senderRole: "Board of Directors",
      subject: "2027 Strategic Objectives & Financial Operating Guardrails",
      date: `${year}-03-01`,
      category: "board",
      priority: "important",
      unread: true,
      requiresDecision: false,
      body: `The Board has concluded our pre-season governance audit. For the 2027 Formula 1 World Championship, the Board has set the following mandates:

1. Constructors' Championship: Target P5 or better.
2. Financial Governance: Strict compliance with the £135.0M Financial Regulations Cost Cap.
3. Points Target: Score at least 80 championship points.

Failure to demonstrate continuous progress will impact executive confidence. The Board wishes the team every success in the upcoming campaign.`,
      actionPage: "finance",
      actionLabel: "View Financial Mandate",
    },
  ];

  const engineeringAllocation: EngineeringAllocation = {
    aerodynamics: 30,
    mechanicalGrip: 25,
    cooling: 15,
    reliability: 15,
    weightReduction: 10,
    nextSeasonResearch: 5,
  };

  const driverBriefings: Record<string, DriverBriefingState> = {
    driver_1: {
      driverId: "driver_1",
      driverName: "Lead Driver",
      preference: "high_speed_stability",
      morale: 88,
      confidence: 86,
      quote: "The car needs a planted rear through high-speed sweeps so I can attack the throttle early.",
    },
    driver_2: {
      driverId: "driver_2",
      driverName: "Second Driver",
      preference: "braking_stability",
      morale: 82,
      confidence: 83,
      quote: "I need strong mechanical braking compliance without front lockups into slow hairpins.",
    },
  };

  const preRaceStrategy: PreRaceStrategy = {
    weekendObjective: "balanced",
    developmentFocus: "setup_data",
    driverExpectation: "target_points",
  };

  const boardConfidence: BoardConfidence = {
    overall: 82,
    financial: 85,
    performance: 78,
    longTerm: 80,
    mandates: [
      { id: "mandate-champ", title: "Constructors' Championship", target: "Finish P5 or higher", status: "on_track" },
      { id: "mandate-cap", title: "FIA Cost Cap Compliance", target: "Stay below £135.0M", status: "on_track" },
      { id: "mandate-points", title: "Points Benchmark", target: "Score 80+ points", status: "on_track" },
    ],
  };

  const news: PaddockNewsItem[] = [
    {
      id: "news-1",
      headline: "Apex Racing reveals aggressive sculpted sidepod concept ahead of testing",
      snippet: "Aerodynamicists in the paddock were taken aback by Apex Racing's radical undercut sidepod package, designed to optimize airflow directly into the beam wing.",
      source: "Motorsport Chronicle",
      date: `${year}-01-15`,
      category: "upgrade",
    },
    {
      id: "news-2",
      headline: "FIA confirms stricter front wing deflection tests for 2027 season opener",
      snippet: "In response to paddock inquiries, technical delegates will conduct 60N point-load tests to eliminate aero-elastic flexibility on high-downforce circuits.",
      source: "FIA Technical Press",
      date: `${year}-01-28`,
      category: "fia",
    },
    {
      id: "news-3",
      headline: "Paddock whispers emerge regarding driver contract talks for 2028 market",
      snippet: "Several team principals were spotted meeting driver management representatives in Monaco, signaling that the silly season could ignite earlier than usual.",
      source: "Paddock Insider",
      date: `${year}-02-12`,
      category: "market",
    },
    {
      id: "news-4",
      headline: "Rival power unit suppliers report strong dyno endurance gains",
      snippet: "Bench testing figures suggest thermal efficiency improvements of over 1.8%, raising the stakes for chassis aerodynamic efficiency.",
      source: "Grand Prix Gazette",
      date: `${year}-02-25`,
      category: "race",
    },
  ];

  const socialFeed: SocialComment[] = [
    {
      id: "social-1",
      handle: "@F1Technical",
      userTitle: "Aero Engineering Analyst",
      avatar: "⚙️",
      text: "Wind tunnel numbers circulating in the paddock are astonishing. Some teams have clawed back over 12 points of downforce already. The development race is going to be wild! #F1 #Aero",
      likes: 1840,
      date: `${year}-01-16`,
      verified: true,
      sentiment: "positive",
    },
    {
      id: "social-2",
      handle: "@PaddockWhispers",
      userTitle: "Paddock Correspondent",
      avatar: "🎙️",
      text: "Sources claiming Martinez met with two rival constructors over dinner last weekend. Smoke without fire or early silly season fireworks? 👀🍿",
      likes: 3120,
      date: `${year}-01-22`,
      verified: false,
      sentiment: "rumour",
    },
    {
      id: "social-3",
      handle: "@TracksideGaz",
      userTitle: "F1 Fan & Pundit",
      avatar: "🏎️",
      text: "Why are Falcon Motorsport still sticking with that high-drag rear wing design? It murdered their straight-line speed all last year... 🤦‍♂️",
      likes: 640,
      date: `${year}-02-05`,
      verified: false,
      sentiment: "negative",
    },
    {
      id: "social-4",
      handle: "@PitLaneTech",
      userTitle: "Aerodynamicist at Large",
      avatar: "📐",
      text: "Seeing reports that new underfloor venturi channels will arrive right before Round 1. Teams that hit their production deadlines will have a massive edge in Melbourne.",
      likes: 920,
      date: `${year}-02-14`,
      verified: true,
      sentiment: "positive",
    },
    {
      id: "social-5",
      handle: "@GrandPrixPulse",
      userTitle: "Motorsport Daily",
      avatar: "🏁",
      text: "Only a few weeks until the 2027 season opener! 11 constructors, 22 drivers, completely reset aero regs. Who is taking the first pole position?",
      likes: 4210,
      date: `${year}-02-28`,
      verified: true,
      sentiment: "positive",
    },
  ];

  return {
    emails,
    engineeringAllocation,
    driverBriefings,
    preRaceStrategy,
    boardConfidence,
    news,
    socialFeed,
  };
}

export function scenarioEvents(year: number, teamId: string): TimelineEvent[] {
  return [
    {
      id: `evt-${year}-tech-meeting`,
      title: "Technical Priorities Meeting",
      category: "staff_meetings",
      severity: "important",
      date: `${year}-01-12`,
      minuteOfDay: MORNING_MINUTE,
      description: "Chief Designer and Technical Director review 2027 aerodynamic focus areas and resource allocation.",
      actionLabel: "Attend Meeting",
      actionPage: "team",
      resolved: false,
      metadata: { teamId, meetingType: "engineering" },
    },
    {
      id: `evt-${year}-sponsor-proposal`,
      title: "Commercial Offer: Apex Energy",
      category: "sponsor_offers",
      severity: "important",
      date: `${year}-01-25`,
      minuteOfDay: 11 * 60,
      description: "Apex Energy has submitted a multi-year sidepod sponsorship proposal offering £4.2M base + podium bonuses.",
      actionLabel: "Review Terms",
      actionPage: "finance",
      resolved: false,
      metadata: { sponsor: "Apex Energy", value: 4_200_000 },
    },
    {
      id: `evt-${year}-driver-briefing`,
      title: "Pre-Season Driver Feedback Briefing",
      category: "staff_meetings",
      severity: "important",
      date: `${year}-02-08`,
      minuteOfDay: 14 * 60,
      description: "Both race drivers complete seat fits and provide initial simulator feedback on low-speed cornering stability.",
      actionLabel: "Review Briefing",
      actionPage: "drivers",
      resolved: false,
      metadata: { teamId },
    },
    {
      id: `evt-${year}-fia-homologation`,
      title: "FIA Technical Compliance Deadline",
      category: "contracts",
      severity: "mandatory",
      date: `${year}-02-22`,
      minuteOfDay: 16 * 60,
      description: "Mandatory regulatory submission deadline for 2027 safety cell crash tests and power unit homologation dossier.",
      actionLabel: "Confirm Compliance",
      actionPage: "team",
      resolved: false,
      metadata: { authority: "FIA" },
    },
    {
      id: `evt-${year}-board-review`,
      title: "Board Season Objectives Meeting",
      category: "board_reviews",
      severity: "important",
      date: `${year}-03-01`,
      minuteOfDay: 10 * 60,
      description: "Executive board review to lock in championship expectations, operational cost cap limits, and performance KPIs.",
      actionLabel: "Review Objectives",
      actionPage: "finance",
      resolved: false,
      metadata: { targetPosition: 5 },
    },
  ];
}

export function scenarioProjects(startDate: string): CarDevelopmentProject[] {
  const designDays = 14;
  const productionDays = 10;
  const testingDays = 8;
  const designCompletedDate = addDaysToDate(startDate, designDays);
  const productionCompletedDate = addDaysToDate(designCompletedDate, productionDays);
  const testingCompletedDate = addDaysToDate(productionCompletedDate, testingDays);

  return [
    {
      id: "proj-fw-spec-b",
      name: "Front Wing Spec-B",
      partType: "front_wing",
      phase: "design",
      startDate,
      designDays,
      productionDays,
      testingDays,
      designCompletedDate,
      productionCompletedDate,
      testingCompletedDate,
      targetGainPct: 3.8,
      actualGainPct: null,
      rushed: false,
      status: "in_progress",
    },
    {
      id: "proj-floor-tunnel",
      name: "Underfloor Venturi Channels",
      partType: "floor",
      phase: "design",
      startDate: addDaysToDate(startDate, 7),
      designDays: 18,
      productionDays: 12,
      testingDays: 10,
      designCompletedDate: addDaysToDate(startDate, 25),
      productionCompletedDate: addDaysToDate(startDate, 37),
      testingCompletedDate: addDaysToDate(startDate, 47),
      targetGainPct: 4.5,
      actualGainPct: null,
      rushed: false,
      status: "in_progress",
    },
  ];
}

export function scenarioCommercial(teamId: string, year: number): CommercialState {
  const teamPrestigeMap: Record<string, number> = {
    ferrari: 95,
    mercedes: 90,
    mclaren: 92,
    red_bull: 94,
    aston_martin: 80,
    alpine: 72,
    williams: 74,
    haas: 60,
    sauber: 62,
    rb: 68,
    audi: 70,
  };

  const activeContracts: SponsorContract[] = [
    {
      id: "sp-title-1",
      name: "Apex Global Telecom",
      slot: "title",
      annualBaseFee: 24_000_000,
      bonusTop10Quali: 100_000,
      bonusPerPoint: 40_000,
      bonusPodium: 500_000,
      bonusWin: 1_200_000,
      bonusConsistencyMilestone: {
        consecutiveRaces: 5,
        payout: 1_000_000,
        achieved: false,
        currentStreak: 0,
      },
      prDaysRequired: 4,
      prDaysCompleted: 0,
      prBonusPerEvent: 450_000,
      contractYearsRemaining: 2,
      minimumTargetPosition: 6,
    },
    {
      id: "sp-major-1",
      name: "Volt Energy Drink",
      slot: "major_1",
      annualBaseFee: 8_500_000,
      bonusTop10Quali: 60_000,
      bonusPerPoint: 25_000,
      bonusPodium: 300_000,
      bonusWin: 750_000,
      prDaysRequired: 3,
      prDaysCompleted: 0,
      prBonusPerEvent: 300_000,
      contractYearsRemaining: 1,
    },
    {
      id: "sp-major-2",
      name: "CrowdPulse Cybersecurity",
      slot: "major_2",
      annualBaseFee: 7_200_000,
      bonusTop10Quali: 50_000,
      bonusPerPoint: 20_000,
      bonusPodium: 250_000,
      bonusWin: 600_000,
      prDaysRequired: 2,
      prDaysCompleted: 0,
      prBonusPerEvent: 250_000,
      contractYearsRemaining: 2,
    },
    {
      id: "sp-tech-1",
      name: "Synthetix High-Performance Fuels",
      slot: "technical_1",
      annualBaseFee: 4_500_000,
      bonusTop10Quali: 30_000,
      bonusPerPoint: 15_000,
      bonusPodium: 150_000,
      bonusWin: 400_000,
      prDaysRequired: 2,
      prDaysCompleted: 0,
      prBonusPerEvent: 200_000,
      contractYearsRemaining: 3,
    },
    {
      id: "sp-tech-2",
      name: "Brembo Carbon Matrix Systems",
      slot: "technical_2",
      annualBaseFee: 3_800_000,
      bonusTop10Quali: 25_000,
      bonusPerPoint: 12_000,
      bonusPodium: 120_000,
      bonusWin: 300_000,
      prDaysRequired: 1,
      prDaysCompleted: 0,
      prBonusPerEvent: 180_000,
      contractYearsRemaining: 1,
    },
    {
      id: "sp-supp-1",
      name: "DHL Worldwide Logistics",
      slot: "supplier_1",
      annualBaseFee: 2_200_000,
      bonusTop10Quali: 10_000,
      bonusPerPoint: 5_000,
      bonusPodium: 80_000,
      bonusWin: 200_000,
      prDaysRequired: 1,
      prDaysCompleted: 0,
      prBonusPerEvent: 120_000,
      contractYearsRemaining: 2,
    },
    {
      id: "sp-supp-2",
      name: "Omicron Precision Tooling",
      slot: "supplier_2",
      annualBaseFee: 1_800_000,
      bonusTop10Quali: 8_000,
      bonusPerPoint: 4_000,
      bonusPodium: 60_000,
      bonusWin: 150_000,
      prDaysRequired: 1,
      prDaysCompleted: 0,
      prBonusPerEvent: 100_000,
      contractYearsRemaining: 1,
    },
  ];

  const availableOffers: SponsorContract[] = [
    {
      id: "offer-crypto-1",
      name: "Nexus Blockchain Protocol",
      slot: "major_1",
      annualBaseFee: 11_000_000,
      bonusTop10Quali: 80_000,
      bonusPerPoint: 35_000,
      bonusPodium: 400_000,
      bonusWin: 900_000,
      prDaysRequired: 4,
      prDaysCompleted: 0,
      prBonusPerEvent: 500_000,
      contractYearsRemaining: 2,
      minimumTargetPosition: 5,
    },
    {
      id: "offer-aerospace-1",
      name: "Orbital Aero Systems",
      slot: "technical_1",
      annualBaseFee: 5_200_000,
      bonusTop10Quali: 40_000,
      bonusPerPoint: 18_000,
      bonusPodium: 200_000,
      bonusWin: 500_000,
      prDaysRequired: 2,
      prDaysCompleted: 0,
      prBonusPerEvent: 250_000,
      contractYearsRemaining: 3,
    },
    {
      id: "offer-beverage-1",
      name: "Hydra Sparkling Isotonic",
      slot: "supplier_1",
      annualBaseFee: 2_600_000,
      bonusTop10Quali: 15_000,
      bonusPerPoint: 8_000,
      bonusPodium: 100_000,
      bonusWin: 250_000,
      prDaysRequired: 2,
      prDaysCompleted: 0,
      prBonusPerEvent: 150_000,
      contractYearsRemaining: 2,
    },
  ];

  return {
    activeContracts,
    availableOffers,
    teamPrestige: teamPrestigeMap[teamId] ?? 75,
    merchandiseRevenueYtd: 3_400_000,
    driverMarketability: {
      driver_1: 88,
      driver_2: 82,
    },
    wccPrizeProjection: {
      currentPosition: 5,
      projectedPayout: 84_000_000,
      gapAheadPts: 14,
      payoutDeltaAhead: 10_000_000,
      targetConstructorAhead: "McLaren",
      gapBehindPts: 8,
      payoutDeltaBehind: 10_000_000,
      threatConstructorBehind: "Aston Martin",
    },
  };
}

export function createScenarioCareer(...args:Parameters<typeof createPlainCareer>):ReturnType<typeof createPlainCareer>{
const career=createPlainCareer(...args); const year=career.season.year;
return {...career,finance:createInitialFinance(career.player.teamId,year),carDev:createInitialCarDevelopment(career.player.teamId,year),facilities:createInitialFacilities(career.player.teamId),market:createInitialMarket(year),comms:scenarioComms(career.player.teamId,career.clock.date,year),events:scenarioEvents(year,career.player.teamId),projects:scenarioProjects(career.clock.date),commercial:scenarioCommercial(career.player.teamId,year)};
}
