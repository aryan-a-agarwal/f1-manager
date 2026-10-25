import { CampusFacility, CareerState, FacilitiesState, FacilityKey } from "./types";
import { persistCareer, CareerStorage } from "./storage";
import { recordFinancialTransaction } from "./finance";
import { addDaysToDate } from "./timeline";

export const FACILITY_SPECS: Record<
  FacilityKey,
  {
    name: string;
    description: string;
    effectPerLevel: string[];
    baseUpgradeCost: number;
    baseMonthlyUpkeep: number;
  }
> = {
  factory: {
    name: "Composite & Manufacturing Plant",
    description: "Controls component manufacturing throughput, build speed, and reliability quality control.",
    effectPerLevel: [
      "1 Production Line | Baseline build speed",
      "2 Production Lines | -10% build duration",
      "3 Production Lines | -20% build duration | High precision tooling",
      "4 Production Lines | -30% build duration | CNC autoclave line",
      "5 Production Lines | -40% build duration | Full automated aerospace standard",
    ],
    baseUpgradeCost: 5_000_000,
    baseMonthlyUpkeep: 220_000,
  },
  wind_tunnel: {
    name: "Scale-Model Wind Tunnel",
    description: "Controls correlation accuracy between computer simulations and on-track aerodynamic performance.",
    effectPerLevel: [
      "75% Correlation accuracy | Baseline rolling road",
      "82% Correlation accuracy | Boundary layer suction",
      "88% Correlation accuracy | Dynamic yaw angle modeling",
      "94% Correlation accuracy | Continuous belt PIV particle imaging",
      "98% Correlation accuracy | Cryogenic wind flow with micro-sensors",
    ],
    baseUpgradeCost: 6_000_000,
    baseMonthlyUpkeep: 280_000,
  },
  design_centre: {
    name: "Engineering & CAD Design Hub",
    description: "Determines engineering headcount capacity and concurrent active R&D design slots.",
    effectPerLevel: [
      "25 Max Engineers | 2 Concurrent design projects",
      "40 Max Engineers | 3 Concurrent design projects",
      "60 Max Engineers | 4 Concurrent design projects",
      "80 Max Engineers | 5 Concurrent design projects",
      "100 Max Engineers | 6 Concurrent design projects",
    ],
    baseUpgradeCost: 4_500_000,
    baseMonthlyUpkeep: 200_000,
  },
  cfd_supercomputer: {
    name: "CFD HPC Supercomputer Cluster",
    description: "High-performance compute clusters enabling faster aerodynamic iterations and higher data yield per MFLOP.",
    effectPerLevel: [
      "Baseline CFD yield | Standard Navier-Stokes solver",
      "+15% Data yield | Multi-GPU acceleration",
      "+30% Data yield | -2 Days design cycle time",
      "+45% Data yield | AI turbulence neural model",
      "+60% Data yield | Quantum-accelerated fluid simulation",
    ],
    baseUpgradeCost: 5_500_000,
    baseMonthlyUpkeep: 250_000,
  },
  simulator: {
    name: "Driver-in-the-Loop Simulator",
    description: "Full-motion dynamic simulator improving driver race setup confidence and rookie learning progression.",
    effectPerLevel: [
      "Baseline setup telemetry | Basic motion rig",
      "+10% Setup data rate | Hexapod 6-DOF dynamic chassis",
      "+20% Driver confidence | Real-time tyre thermal feedback",
      "+30% Young driver progression | LIDAR laser-scanned tracks",
      "+40% Young driver progression | VR neuro-feedback integration",
    ],
    baseUpgradeCost: 4_000_000,
    baseMonthlyUpkeep: 180_000,
  },
  youth_academy: {
    name: "Young Driver Development Academy",
    description: "Scouts and nurtures next-generation talent, offering first refusal on breakthrough junior drivers.",
    effectPerLevel: [
      "Regional karting scout network",
      "European F3/F4 development programme",
      "Dedicated junior engineering mentors | Formula 2 pipeline",
      "Advanced driver biometric monitoring | Global scouting",
      "World-class elite academy | +20% junior attribute growth rate",
    ],
    baseUpgradeCost: 3_000_000,
    baseMonthlyUpkeep: 120_000,
  },
};

export function getFacilityUpgradeCost(key: FacilityKey, currentLevel: number): number {
  if (currentLevel >= 5) return 0;
  const spec = FACILITY_SPECS[key];
  return spec.baseUpgradeCost * Math.pow(1.5, currentLevel - 1);
}

export function getFacilityUpgradeDays(currentLevel: number): number {
  const days = [0, 45, 75, 110, 150];
  return days[currentLevel] || 90;
}

export function getFacilityMonthlyUpkeep(key: FacilityKey, level: number): number {
  const spec = FACILITY_SPECS[key];
  return Math.round(spec.baseMonthlyUpkeep * (1 + (level - 1) * 0.4));
}

export function createInitialFacilities(teamId: string): FacilitiesState {
  // Top teams start with higher level facilities
  const isTopTeam = teamId === "ferrari" || teamId === "mercedes" || teamId === "mclaren" || teamId === "red-bull";
  const isMidTeam = teamId === "aston-martin" || teamId === "alpine" || teamId === "williams";
  const defaultLevel = isTopTeam ? 3 : isMidTeam ? 2 : 1;

  const facilities: Record<FacilityKey, CampusFacility> = {
    factory: {
      key: "factory",
      name: FACILITY_SPECS.factory.name,
      level: defaultLevel,
      conditionPct: 92,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("factory", defaultLevel),
      refurbishCost: 120_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("factory", defaultLevel),
      description: FACILITY_SPECS.factory.description,
      effectLabel: FACILITY_SPECS.factory.effectPerLevel[defaultLevel - 1],
    },
    wind_tunnel: {
      key: "wind_tunnel",
      name: FACILITY_SPECS.wind_tunnel.name,
      level: defaultLevel,
      conditionPct: 95,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("wind_tunnel", defaultLevel),
      refurbishCost: 150_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("wind_tunnel", defaultLevel),
      description: FACILITY_SPECS.wind_tunnel.description,
      effectLabel: FACILITY_SPECS.wind_tunnel.effectPerLevel[defaultLevel - 1],
    },
    design_centre: {
      key: "design_centre",
      name: FACILITY_SPECS.design_centre.name,
      level: defaultLevel,
      conditionPct: 88,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("design_centre", defaultLevel),
      refurbishCost: 100_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("design_centre", defaultLevel),
      description: FACILITY_SPECS.design_centre.description,
      effectLabel: FACILITY_SPECS.design_centre.effectPerLevel[defaultLevel - 1],
    },
    cfd_supercomputer: {
      key: "cfd_supercomputer",
      name: FACILITY_SPECS.cfd_supercomputer.name,
      level: Math.max(1, defaultLevel - 1),
      conditionPct: 90,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("cfd_supercomputer", Math.max(1, defaultLevel - 1)),
      refurbishCost: 140_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("cfd_supercomputer", Math.max(1, defaultLevel - 1)),
      description: FACILITY_SPECS.cfd_supercomputer.description,
      effectLabel: FACILITY_SPECS.cfd_supercomputer.effectPerLevel[Math.max(1, defaultLevel - 1) - 1],
    },
    simulator: {
      key: "simulator",
      name: FACILITY_SPECS.simulator.name,
      level: defaultLevel,
      conditionPct: 94,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("simulator", defaultLevel),
      refurbishCost: 90_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("simulator", defaultLevel),
      description: FACILITY_SPECS.simulator.description,
      effectLabel: FACILITY_SPECS.simulator.effectPerLevel[defaultLevel - 1],
    },
    youth_academy: {
      key: "youth_academy",
      name: FACILITY_SPECS.youth_academy.name,
      level: Math.max(1, defaultLevel - 1),
      conditionPct: 96,
      upgradeInConstruction: false,
      upgradeCost: getFacilityUpgradeCost("youth_academy", Math.max(1, defaultLevel - 1)),
      refurbishCost: 60_000,
      monthlyMaintenanceCost: getFacilityMonthlyUpkeep("youth_academy", Math.max(1, defaultLevel - 1)),
      description: FACILITY_SPECS.youth_academy.description,
      effectLabel: FACILITY_SPECS.youth_academy.effectPerLevel[Math.max(1, defaultLevel - 1) - 1],
    },
  };

  const totalEngineers = defaultLevel === 3 ? 60 : defaultLevel === 2 ? 40 : 25;

  return {
    facilities,
    availableEngineers: totalEngineers,
    totalEngineers,
  };
}

export function startFacilityUpgrade(
  career: CareerState,
  facilityKey: FacilityKey,
  storage?: CareerStorage,
): CareerState {
  const synced = syncFacilitiesState(career);
  const facState = synced.facilities;
  const facility = facState.facilities[facilityKey];
  if (!facility || facility.level >= 5 || facility.upgradeInConstruction) return career;

  const cost = facility.upgradeCost;
  const targetLevel = facility.level + 1;
  const days = getFacilityUpgradeDays(facility.level);
  const completionDate = addDaysToDate(career.clock.date, days);

  // Capital expenditure: under FIA Cap, facility capital expenditure has special allowance or cap exemption
  const finState = recordFinancialTransaction(
    career,
    -cost,
    "facility_maintenance",
    `Facility Upgrade: ${facility.name} (Level ${targetLevel})`,
    true, // Cap-exempt capital investment per FIA financial regs
    storage,
  );

  const updatedFacility: CampusFacility = {
    ...facility,
    upgradeInConstruction: true,
    upgradeTargetLevel: targetLevel,
    upgradeCompletionDate: completionDate,
  };

  const updatedCareer: CareerState = {
    ...finState,
    facilities: {
      ...facState,
      facilities: {
        ...facState.facilities,
        [facilityKey]: updatedFacility,
      },
    },
  };

  return persistCareer(updatedCareer, storage);
}

export function refurbishFacility(
  career: CareerState,
  facilityKey: FacilityKey,
  storage?: CareerStorage,
): CareerState {
  const synced = syncFacilitiesState(career);
  const facState = synced.facilities;
  const facility = facState.facilities[facilityKey];
  if (!facility || facility.conditionPct >= 99) return career;

  const cost = facility.refurbishCost;

  // Refurbishment maintenance counts against Cost Cap
  const finState = recordFinancialTransaction(
    career,
    -cost,
    "facility_maintenance",
    `Facility Maintenance & Refurbishment: ${facility.name}`,
    false, // counts against cost cap
    storage,
  );

  const updatedFacility: CampusFacility = {
    ...facility,
    conditionPct: 100,
    refurbishCost: 50_000,
  };

  const updatedCareer: CareerState = {
    ...finState,
    facilities: {
      ...facState,
      facilities: {
        ...facState.facilities,
        [facilityKey]: updatedFacility,
      },
    },
  };

  return persistCareer(updatedCareer, storage);
}

export function processFacilityWearAndUpkeep(career:CareerState,daysAdvanced:number,storage?:CareerStorage):CareerState {
  const changed=processFacilityWearAndUpkeepState(career,daysAdvanced);
  return changed===career?career:persistCareer(changed,storage);
}

export function processFacilityWearAndUpkeepState(
  career: CareerState,
  daysAdvanced: number,
  storage?: CareerStorage,
): CareerState {
  const synced = syncFacilitiesState(career);
  const facState = synced.facilities;
  const currentDate = career.clock.date;

  let anyUpdated = false;
  const updatedFacilities: Record<FacilityKey, CampusFacility> = { ...facState.facilities };

  (Object.keys(facState.facilities) as FacilityKey[]).forEach((key) => {
    const fac = { ...facState.facilities[key] };

    // Condition degradation: 0.08% per day
    const wear = daysAdvanced * 0.08;
    const newCondition = Math.max(20, Number((fac.conditionPct - wear).toFixed(1)));
    if (newCondition !== fac.conditionPct) {
      fac.conditionPct = newCondition;
      fac.refurbishCost = Math.round((100 - newCondition) * 12_000);
      anyUpdated = true;
    }

    // Check upgrade completion
    if (fac.upgradeInConstruction && fac.upgradeCompletionDate && currentDate >= fac.upgradeCompletionDate) {
      const nextLevel = fac.upgradeTargetLevel || fac.level + 1;
      fac.level = nextLevel;
      fac.upgradeInConstruction = false;
      fac.upgradeTargetLevel = undefined;
      fac.upgradeCompletionDate = null;
      fac.upgradeCost = getFacilityUpgradeCost(key, nextLevel);
      fac.monthlyMaintenanceCost = getFacilityMonthlyUpkeep(key, nextLevel);
      fac.effectLabel = FACILITY_SPECS[key].effectPerLevel[nextLevel - 1] || fac.effectLabel;
      fac.conditionPct = 100;
      anyUpdated = true;
    }

    updatedFacilities[key] = fac;
  });

  if (!anyUpdated) return career;

  // Update total engineers if design centre upgraded
  const designLvl = updatedFacilities.design_centre.level;
  const totalEngineers = designLvl === 5 ? 100 : designLvl === 4 ? 80 : designLvl === 3 ? 60 : designLvl === 2 ? 40 : 25;

  const updatedCareer: CareerState = {
    ...career,
    facilities: {
      facilities: updatedFacilities,
      totalEngineers,
      availableEngineers: Math.min(totalEngineers, facState.availableEngineers),
    },
  };

  return updatedCareer;
}

export function syncFacilitiesState(career: CareerState): CareerState & { facilities: FacilitiesState } {
  if (career.facilities) {
    return career as CareerState & { facilities: FacilitiesState };
  }
  const facilities = createInitialFacilities(career.player.teamId);
  return {
    ...career,
    facilities,
  };
}
