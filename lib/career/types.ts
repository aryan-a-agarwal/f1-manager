export const CAREER_SCHEMA_VERSION = 8 as const;
export const CAREER_START_SEASON = 2027;
export const CAREER_START_DATE = "2027-01-04";
export const CAREER_START_MINUTE = 9 * 60;

export type CareerPhase = "preseason" | "season" | "offseason";

export type CareerAdvanceReason = "hour" | "day" | "week" | "target" | "next_event" | "next_race_weekend";

export type EventCategory =
  | "race_weekend"
  | "car_development"
  | "contracts"
  | "sponsor_offers"
  | "staff_meetings"
  | "financial_warnings"
  | "major_news"
  | "facilities"
  | "board_reviews";

export type EventSeverity = "mandatory" | "important" | "informational";

export type SimulationStopSettings = {
  carDevelopment: boolean;
  contracts: boolean;
  sponsorOffers: boolean;
  staffMeetings: boolean;
  majorNews: boolean;
  financialWarnings: boolean;
};

export type TimelineEvent = {
  id: string;
  title: string;
  category: EventCategory;
  severity: EventSeverity;
  date: string;
  minuteOfDay: number;
  description?: string;
  actionLabel?: string;
  actionPage?: "home" | "team" | "race" | "drivers" | "calendar" | "finance" | "standings" | "market" | "comms";
  resolved?: boolean;
  metadata?: Record<string, unknown>;
};

export type CarProjectPhase = "design" | "production" | "testing" | "completed";
export type CarPartType = "front_wing" | "rear_wing" | "floor" | "sidepods" | "suspension" | "brakes";

export type CarAttributes = {
  lowSpeedDownforce: number;
  medSpeedDownforce: number;
  highSpeedDownforce: number;
  dragEfficiency: number;
  drsEfficiency: number;
  brakingPerformance: number;
  mechanicalTraction: number;
  tyrePreservation: number;
  kerbCompliance: number;
  enginePower: number;
  energyDeployment: number;
  coolingEfficiency: number;
  chassisWeight: number; // in kg (798kg min)
};

export type AttributeRanking = {
  attribute: keyof CarAttributes | "overall";
  label: string;
  value: number;
  rank: number;
  bestValue: number;
  worstValue: number;
};

export type ProjectFocusPreset =
  | "balanced"
  | "downforce"
  | "drag_reduction"
  | "cooling"
  | "weight_saving";

export type FittedCarPart = {
  id: string;
  name: string;
  partType: CarPartType;
  version: number;
  conditionPct: number;
  attributeDeltas: Partial<CarAttributes>;
  fittedCar1: boolean;
  fittedCar2: boolean;
  spareCount: number;
  manufacturedDate: string;
};

export type AtrAllocation = {
  periodNumber: number;
  periodEndDate: string;
  windTunnelHoursLimit: number;
  windTunnelHoursUsed: number;
  cfdMflopsLimit: number;
  cfdMflopsUsed: number;
  wccHandicapPct: number;
};

export type EngineSupplierId = "titan_works" | "velocita_power" | "apex_racing" | "nova_customer";

export type EngineSupplier = {
  id: EngineSupplierId;
  name: string;
  supplierType: "works" | "customer";
  annualCost: number;
  powerRating: number;
  ersRating: number;
  reliabilityRating: number;
  coolingRating: number;
};

export type CarDevelopmentState = {
  attributes: CarAttributes;
  fittedParts: Record<CarPartType, FittedCarPart>;
  inventory: FittedCarPart[];
  atr: AtrAllocation;
  engineSupplier: EngineSupplier;
};

export type FacilityKey =
  | "factory"
  | "wind_tunnel"
  | "design_centre"
  | "cfd_supercomputer"
  | "simulator"
  | "youth_academy";

export type CampusFacility = {
  key: FacilityKey;
  name: string;
  level: number;
  conditionPct: number;
  upgradeInConstruction: boolean;
  upgradeTargetLevel?: number;
  upgradeCompletionDate?: string | null;
  upgradeCost: number;
  refurbishCost: number;
  monthlyMaintenanceCost: number;
  description: string;
  effectLabel: string;
};

export type FacilitiesState = {
  facilities: Record<FacilityKey, CampusFacility>;
  availableEngineers: number;
  totalEngineers: number;
};

export type CarDevelopmentProject = {
  id: string;
  name: string;
  partType: CarPartType;
  phase: CarProjectPhase;
  startDate: string;
  designDays: number;
  productionDays: number;
  testingDays: number;
  designCompletedDate: string;
  productionCompletedDate: string;
  testingCompletedDate: string;
  targetGainPct: number;
  actualGainPct: number | null;
  rushed?: boolean;
  status: "in_progress" | "completed" | "cancelled";
  focusPreset?: ProjectFocusPreset;
  engineersAssigned?: number;
  cfdAllocated?: number;
  windTunnelAllocated?: number;
  batchSize?: number;
  cost?: number;
  attributeDeltas?: Partial<CarAttributes>;
  installedTo?: { car1: boolean; car2: boolean };
};

export type EmailCategory = "team" | "fia" | "drivers" | "staff" | "sponsors" | "board" | "media" | "contracts" | "finance" | "development";
export type EmailPriority = "normal" | "important" | "urgent";

export type EmailDecisionChoice = {
  id: string;
  label: string;
  description: string;
  effectsSummary: string;
  projectId?: string;
  projectDaysOffset?: number;
  costOffset?: number;
  moraleImpact?: Record<string, number>;
  confidenceImpact?: {
    overall?: number;
    financial?: number;
    performance?: number;
    longTerm?: number;
  };
};

export type CareerEmail = {
  id: string;
  senderName: string;
  senderRole: string;
  senderTeamId?: string;
  subject: string;
  date: string;
  category: EmailCategory;
  priority: EmailPriority;
  body: string;
  unread: boolean;
  requiresDecision: boolean;
  decisionChoices?: EmailDecisionChoice[];
  chosenDecisionId?: string | null;
  actionPage?: "home" | "team" | "race" | "drivers" | "calendar" | "finance" | "standings" | "market" | "comms";
  actionLabel?: string;
};

export type EngineeringAllocation = {
  aerodynamics: number;
  mechanicalGrip: number;
  cooling: number;
  reliability: number;
  weightReduction: number;
  nextSeasonResearch: number;
};

export type DriverBriefingState = {
  driverId: string;
  driverName: string;
  preference: string;
  morale: number;
  confidence: number;
  quote: string;
};

export type PreRaceStrategy = {
  weekendObjective: "conservative" | "balanced" | "aggressive";
  developmentFocus: "setup_data" | "component_testing" | "preservation";
  driverExpectation: "no_pressure" | "target_points" | "target_podium";
};

export type BoardMandate = {
  id: string;
  title: string;
  target: string;
  status: "on_track" | "at_risk" | "failed" | "achieved";
};

export type BoardConfidence = {
  overall: number;
  financial: number;
  performance: number;
  longTerm: number;
  mandates: BoardMandate[];
};

export type PaddockNewsItem = {
  id: string;
  headline: string;
  snippet: string;
  source: string;
  date: string;
  category: "upgrade" | "market" | "fia" | "race";
};

export type SocialComment = {
  id: string;
  handle: string;
  userTitle: string;
  avatar: string;
  text: string;
  likes: number;
  date: string;
  verified: boolean;
  sentiment: "positive" | "negative" | "rumour";
};

export type CommsState = {
  emails: CareerEmail[];
  engineeringAllocation: EngineeringAllocation;
  driverBriefings: Record<string, DriverBriefingState>;
  preRaceStrategy: PreRaceStrategy;
  boardConfidence: BoardConfidence;
  news: PaddockNewsItem[];
  socialFeed: SocialComment[];
};

export type SponsorSlot =
  | "title"
  | "major_1"
  | "major_2"
  | "technical_1"
  | "technical_2"
  | "supplier_1"
  | "supplier_2";

export type SponsorContract = {
  id: string;
  name: string;
  slot: SponsorSlot;
  annualBaseFee: number;
  bonusTop10Quali: number;
  bonusPerPoint: number;
  bonusPodium: number;
  bonusWin: number;
  bonusConsistencyMilestone?: {
    consecutiveRaces: number;
    payout: number;
    achieved: boolean;
    currentStreak: number;
  };
  prDaysRequired: number;
  prDaysCompleted: number;
  prBonusPerEvent: number;
  contractYearsRemaining: number;
  minimumTargetPosition?: number;
};

export type WccPrizeProjection = {
  currentPosition: number;
  projectedPayout: number;
  gapAheadPts: number | null;
  payoutDeltaAhead: number | null;
  targetConstructorAhead: string | null;
  gapBehindPts: number | null;
  payoutDeltaBehind: number | null;
  threatConstructorBehind: string | null;
};

export type CommercialState = {
  activeContracts: SponsorContract[];
  availableOffers: SponsorContract[];
  teamPrestige: number; // 0-100
  merchandiseRevenueYtd: number;
  driverMarketability: Record<string, number>; // driverId -> 0-100
  wccPrizeProjection: WccPrizeProjection;
};

export type FinancialCategory =
  | "sponsor_base"
  | "sponsor_bonus"
  | "prize_money"
  | "merchandise"
  | "driver_salaries"
  | "staff_salaries"
  | "car_development"
  | "facility_maintenance"
  | "facility_construction"
  | "overtime_expenses"
  | "operations_travel";

export type FinancialTransaction = {
  id: string;
  date: string;
  amount: number; // positive = income, negative = expense
  category: FinancialCategory;
  description: string;
  isCostCapExempt: boolean; // Driver salaries, top 3 execs, marketing are exempt!
};

export type FinanceState = {
  cashBalance: number;
  costCapLimit: number; // £135,000,000 standard
  costCapSpent: number;
  costCapExemptSpent: number;
  transactions: FinancialTransaction[];
  monthlyProjections: {
    income: number;
    expenses: number;
    net: number;
  };
};

export type SessionKind = "practice_1" | "practice_2" | "practice_3" | "sprint_qualifying" | "sprint" | "qualifying" | "race";
export type SessionStatus = "scheduled" | "available" | "preparing" | "locked" | "running" | "processing" | "completed" | "cancelled" | "postponed";
export type WeekendStatus = "scheduled" | "preparation" | "entered" | "weekend_active" | "practice_completed" | "qualifying_completed" | "race_ready" | "race_completed" | "archived";

export type CalendarSession = {
  id: string;
  kind: SessionKind;
  date: string;
  minuteOfDay: number;
  status: SessionStatus;
  resultId: string | null;
};

export type CalendarRound = {
  id: string;
  roundNumber: number;
  weekendNumber: number;
  weekendId: string;
  trackId: string;
  grandPrixName: string;
  location: string;
  sprint: boolean;
  weekendStartDate: string;
  weekendEndDate: string;
  status: WeekendStatus;
  sessions: CalendarSession[];
  venueTimeZone?: string;
};

export type SeasonCalendar = {
  year: number;
  generated: true;
  sourceTemplate: string;
  profileId?: string;
  profileVersion?: number;
  timeBasis?: "UTC";
  periods?: { kind: "preseason" | "break" | "offseason"; label: string; startDate: string; endDate: string }[];
  sourceUrl: string;
  rounds: CalendarRound[];
};

export type Provenance = "official_fact" | "career_generated" | "player_selected" | "engine_generated" | "administrative_placeholder" | "system_derived";
export type WeekendParticipant = { teamId:string; teamName:string; driverId:string; driverName:string; abbreviation:string; carNumber:number|null };
export type WeekendSnapshot = {
  id:string;
  schemaVersion:1;
  careerId:string;
  season:number;
  roundId:string;
  trackId:string;
  weekendNumber:number;
  sprint:boolean;
  createdAt:string;
  rulesetVersion:"2026-format-v1";
  participants:WeekendParticipant[];
  circuit:{ lapLengthKm:number; raceLaps:number|null; raceDistanceKm:number|null; provenance:"official_fact" };
};
export type SessionInput = {
  schemaVersion:1;
  id:string;
  sessionId:string;
  roundId:string;
  snapshotId:string;
  sessionKind:SessionKind;
  participantIds:string[];
  randomSeed:number;
  engineId:string;
  engineVersion:string;
  instructions:{runPlan:"neutral";startingTyre:null;pitPlan:null;provenance:"player_selected"};
  provenance:"system_derived";
};
export type SessionAttempt = {
  id:string;
  sessionId:string;
  inputId:string;
  attemptNumber:number;
  status:"running"|"completed"|"failed";
  engineId:string;
  engineVersion:string;
  randomSeed:number;
  inputChecksum:string;
  startedAt:string;
  completedAt:string|null;
  failureReason:string|null;
};
export type ClassificationEntry = { position:number; driverId:string; status:"classified"|"retired"|"not_started"; laps:number|null; timeMs:number|null; gapMs:number|null };
export type SessionOutput = {
  schemaVersion:1;
  id:string;
  attemptId:string;
  sessionId:string;
  completionMode:"administrative_placeholder"|"simulated";
  classification:ClassificationEntry[];
  distancePercent:number|null;
  provenance:"administrative_placeholder"|"engine_generated";
  engineId:string;
  engineVersion:string;
  createdAt:string;
};
export type DomainEvent = {
  id:string;
  type:"SessionCompleted"|"GrandPrixCompleted"|"WeekendArchived";
  roundId:string;
  sessionId:string|null;
  resultId:string|null;
  createdAt:string;
  status:"pending"|"processed";
  receipts?: string[];
};
export type WeekendOperations = {
  activeWeekendId:string|null;
  activeSessionId:string|null;
  snapshots:WeekendSnapshot[];
  inputs:SessionInput[];
  attempts:SessionAttempt[];
  outputs:SessionOutput[];
  outbox:DomainEvent[];
};

export type DriverStanding = {driverId:string;driverName:string;teamId:string;points:number;wins:number;podiums:number;finishes:Record<string,number>};
export type TeamStanding = {teamId:string;teamName:string;points:number;wins:number;podiums:number;finishes:Record<string,number>};
export type ChampionshipState = {year:number;ruleset:"fia-2026-points-v1";sourceUrl:string;drivers:DriverStanding[];teams:TeamStanding[];processedResultIds:string[]};
export type WorkforcePerson = {id:string;name:string;kind:"driver"|"staff";carNumber:number|null;provenance:"official_fact"|"career_generated"};
export type WorkforceAgreement = {id:string;personId:string;teamId:string;role:"driver_1"|"driver_2"|"team_principal";startSeason:number;endSeason:number|null;salary:null;termKnown:false;provenance:"official_fact"|"career_generated"};
export type SeasonLineup = {season:number;teamId:string;driverIds:[string,string];teamPrincipalId:string;provenance:"official_fact"|"career_generated"};
export type WorkforceState = {people:WorkforcePerson[];agreements:WorkforceAgreement[];lineups:SeasonLineup[]};
export type SeasonArchive = {year:number;archivedAt:string;calendar:SeasonCalendar;championship:ChampionshipState;results:SessionOutput[];lineups:SeasonLineup[]};

// --- Phase 3: Workforce, Driver Market & Staff Contracts ---

export type DriverSkills = {
  pace: number;
  qualifying: number;
  racecraft: number;
  consistency: number;
  tyreManagement: number;
  wetWeather: number;
  feedback: number;
  adaptability: number;
};

export type DriverMental = {
  morale: number;
  confidence: number;
  pressureHandling: number;
  aggression: number;
  loyalty: number;
};

export type DriverTrait =
  | "Technical Driver"
  | "Hot Head"
  | "Veteran"
  | "Young Prospect"
  | "Pay Driver"
  | "Tyre Whisperer"
  | "Rain Master";

export type DriverContractBonuses = {
  pointsBonus: number;
  podiumBonus: number;
  winBonus: number;
  titleBonus: number;
};

export type DriverContractDetails = {
  salaryPerYear: number;
  contractYearsRemaining: number;
  buyoutClause: number;
  status: "first_driver" | "equal" | "second_driver" | "reserve";
  bonuses: DriverContractBonuses;
};

export type DriverMarketProfile = {
  id: string;
  name: string;
  number: number;
  nationality: string;
  abbreviation: string;
  currentTeamId: string | null;
  age: number;
  experienceYears: number;
  overallRating: number;
  marketValue: number;
  marketability: number;
  skills: DriverSkills;
  mental: DriverMental;
  traits: DriverTrait[];
  contract: DriverContractDetails;
};

export type StaffRoleType =
  | "technical_director"
  | "head_of_aero"
  | "chief_designer"
  | "race_engineer"
  | "chief_scout";

export type StaffProfile = {
  id: string;
  name: string;
  role: StaffRoleType;
  currentTeamId: string | null;
  overallRating: number;
  salaryPerYear: number;
  contractYearsRemaining: number;
  buyoutClause: number;
  specialty: string;
  ratings: {
    technicalSkill: number;
    leadership: number;
    innovation: number;
  };
};

export type MarketState = {
  drivers: DriverMarketProfile[];
  staff: StaffProfile[];
  scoutedProspects: DriverMarketProfile[];
};

// --- Phase 4: Dynamic Race Weekend Simulation ---

export type TyreCompound = "soft" | "medium" | "hard" | "intermediate" | "wet";
export type DriverPaceMode = "conserve" | "balanced" | "push" | "attack";
export type DriverErsMode = "recharge" | "balanced" | "overtake";

export type CarSetup = {
  frontWingAngle: number; // 15 to 45 deg
  rearWingAngle: number;  // 15 to 45 deg
  antiRollBarStiffness: number; // 1 to 10
  rideHeight: number; // 20 to 45 mm
  tyrePressure: number; // 20.0 to 26.0 psi
  camberAngle: number; // -3.5 to -1.0 deg
};

export type SetupEvaluation = {
  confidence: number; // 0 to 100%
  aeroBalance: number; // -5 to +5 (negative = understeer, positive = oversteer, 0 = optimal)
  mechanicalBalance: number; // -5 to +5
  feedbackNotes: string[];
  paceDeltaMs: number; // lap time bonus/penalty in ms (-500ms to +1200ms)
};

export type DriverPracticeState = {
  driverId: string;
  driverName: string;
  setup: CarSetup;
  evaluation: SetupEvaluation;
  stintsCompleted: number;
  bestLapMs: number | null;
};

export type QualifyingKnockoutStage = "q1" | "q2" | "q3" | "completed";

export type QualifyingDriverLap = {
  driverId: string;
  teamId: string;
  driverName: string;
  abbreviation: string;
  carNumber: number;
  q1TimeMs: number | null;
  q2TimeMs: number | null;
  q3TimeMs: number | null;
  bestLapMs: number | null;
  gapToPoleMs: number | null;
  eliminatedInStage: "q1" | "q2" | null;
  gridPosition: number;
};

export type QualifyingKnockoutState = {
  stage: QualifyingKnockoutStage;
  trackEvolutionBonusMs: number;
  laps: QualifyingDriverLap[];
  currentPoleTimeMs: number | null;
  completed: boolean;
};

export type WeatherCondition = "dry" | "light_rain" | "heavy_rain";

export type TrackCondition = {
  wetnessPercent: number; // 0 (dry) to 100 (standing water)
  weather: WeatherCondition;
  trackTempC: number;
  airTempC: number;
  rainProbability: number;
};

export type SafetyCarStatus = "clear" | "vsc" | "safety_car" | "red_flag";

export type RaceIncident = {
  lap: number;
  timestamp: string;
  message: string;
  severity: "info" | "warning" | "vsc" | "sc" | "retirement";
  driverId?: string;
};

export type LiveRaceCarState = {
  driverId: string;
  driverName: string;
  abbreviation: string;
  teamId: string;
  carNumber: number;
  position: number;
  lap: number;
  intervalToCarAheadMs: number;
  gapToLeaderMs: number;
  lastLapTimeMs: number | null;
  bestLapTimeMs: number | null;
  tyreCompound: TyreCompound;
  tyreWearPercent: number; // 100 = brand new, 0 = blown
  tyreAgeLaps: number;
  tyreTempC: number;
  pitStops: number;
  ersBatteryPercent: number; // 0 to 100
  paceMode: DriverPaceMode;
  ersMode: DriverErsMode;
  status: "racing" | "pitting" | "retired";
  retirementReason: string | null;
  pendingPitOrder: { compound: TyreCompound; wingAdjustDeg?: number } | null;
};

export type LiveRaceSimState = {
  roundId: string;
  sessionId: string;
  trackId: string;
  totalLaps: number;
  currentLap: number;
  cars: LiveRaceCarState[];
  trackCondition: TrackCondition;
  safetyCar: SafetyCarStatus;
  safetyCarLapsRemaining: number;
  incidents: RaceIncident[];
  fastestLapDriverId: string | null;
  fastestLapMs: number | null;
  isFinished: boolean;
};

export type WeekendSimulationState = {
  activeRoundId: string | null;
  practice: Record<string, DriverPracticeState>;
  qualifying: QualifyingKnockoutState | null;
  liveRace: LiveRaceSimState | null;
};

export type CareerStateV5 = {
  schemaVersion: typeof CAREER_SCHEMA_VERSION;
  metadata: {
    careerId: string;
    createdAt: string;
    updatedAt: string;
    revision: number;
  };
  player: {
    teamId: string;
  };
  clock: {
    date: string;
    minuteOfDay: number;
    status: "paused" | "blocked";
    blockingEventId: string | null;
    lastAdvance: {
      fromDate: string;
      fromMinuteOfDay: number;
      toDate: string;
      toMinuteOfDay: number;
      reason: CareerAdvanceReason;
    } | null;
  };
  season: {
    year: number;
    phase: CareerPhase;
    currentEventId: string | null;
    calendar: SeasonCalendar;
  };
  weekendOperations: WeekendOperations;
  championship: ChampionshipState;
  workforce: WorkforceState;
  seasonHistory: SeasonArchive[];
  events?: TimelineEvent[];
  projects?: CarDevelopmentProject[];
  stopSettings?: SimulationStopSettings;
  comms?: CommsState;
  commercial?: CommercialState;
  finance?: FinanceState;
  carDev?: CarDevelopmentState;
  facilities?: FacilitiesState;
  market?: MarketState;
  weekendSim?: WeekendSimulationState;
  scheduler: { processedEventIds: string[]; acknowledgedEventIds: string[]; pendingEvent: TimelineEvent | null };
};

export type CareerState = CareerStateV5;
