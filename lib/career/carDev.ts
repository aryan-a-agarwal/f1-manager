import {
  AtrAllocation,
  AttributeRanking,
  CarAttributes,
  CarDevelopmentProject,
  CarDevelopmentState,
  CarPartType,
  CareerState,
  EngineSupplier,
  EngineSupplierId,
  FittedCarPart,
  ProjectFocusPreset,
} from "./types";
import { persistCareer, CareerStorage } from "./storage";
import { recordFinancialTransaction } from "./finance";
import { addDaysToDate } from "./timeline";

export const BASELINE_GRID_ATTRIBUTES: Record<string, CarAttributes> = {
  mclaren: {
    lowSpeedDownforce: 91,
    medSpeedDownforce: 93,
    highSpeedDownforce: 94,
    dragEfficiency: 92,
    drsEfficiency: 90,
    brakingPerformance: 91,
    mechanicalTraction: 92,
    tyrePreservation: 93,
    kerbCompliance: 90,
    enginePower: 92,
    energyDeployment: 91,
    coolingEfficiency: 89,
    chassisWeight: 798,
  },
  mercedes: {
    lowSpeedDownforce: 88,
    medSpeedDownforce: 89,
    highSpeedDownforce: 90,
    dragEfficiency: 91,
    drsEfficiency: 92,
    brakingPerformance: 89,
    mechanicalTraction: 88,
    tyrePreservation: 89,
    kerbCompliance: 87,
    enginePower: 93,
    energyDeployment: 92,
    coolingEfficiency: 90,
    chassisWeight: 800,
  },
  "red-bull": {
    lowSpeedDownforce: 90,
    medSpeedDownforce: 92,
    highSpeedDownforce: 93,
    dragEfficiency: 94,
    drsEfficiency: 93,
    brakingPerformance: 92,
    mechanicalTraction: 91,
    tyrePreservation: 90,
    kerbCompliance: 89,
    enginePower: 91,
    energyDeployment: 90,
    coolingEfficiency: 88,
    chassisWeight: 798,
  },
  ferrari: {
    lowSpeedDownforce: 89,
    medSpeedDownforce: 91,
    highSpeedDownforce: 92,
    dragEfficiency: 89,
    drsEfficiency: 88,
    brakingPerformance: 93,
    mechanicalTraction: 93,
    tyrePreservation: 88,
    kerbCompliance: 89,
    enginePower: 94,
    energyDeployment: 93,
    coolingEfficiency: 87,
    chassisWeight: 799,
  },
  williams: {
    lowSpeedDownforce: 79,
    medSpeedDownforce: 81,
    highSpeedDownforce: 83,
    dragEfficiency: 92,
    drsEfficiency: 91,
    brakingPerformance: 82,
    mechanicalTraction: 80,
    tyrePreservation: 81,
    kerbCompliance: 80,
    enginePower: 92,
    energyDeployment: 90,
    coolingEfficiency: 85,
    chassisWeight: 803,
  },
  "racing-bulls": {
    lowSpeedDownforce: 82,
    medSpeedDownforce: 83,
    highSpeedDownforce: 84,
    dragEfficiency: 85,
    drsEfficiency: 84,
    brakingPerformance: 84,
    mechanicalTraction: 83,
    tyrePreservation: 84,
    kerbCompliance: 83,
    enginePower: 91,
    energyDeployment: 89,
    coolingEfficiency: 86,
    chassisWeight: 802,
  },
  "aston-martin": {
    lowSpeedDownforce: 84,
    medSpeedDownforce: 85,
    highSpeedDownforce: 85,
    dragEfficiency: 83,
    drsEfficiency: 83,
    brakingPerformance: 85,
    mechanicalTraction: 84,
    tyrePreservation: 85,
    kerbCompliance: 84,
    enginePower: 88,
    energyDeployment: 87,
    coolingEfficiency: 86,
    chassisWeight: 801,
  },
  haas: {
    lowSpeedDownforce: 80,
    medSpeedDownforce: 81,
    highSpeedDownforce: 82,
    dragEfficiency: 86,
    drsEfficiency: 85,
    brakingPerformance: 83,
    mechanicalTraction: 81,
    tyrePreservation: 79,
    kerbCompliance: 81,
    enginePower: 93,
    energyDeployment: 91,
    coolingEfficiency: 84,
    chassisWeight: 804,
  },
  audi: {
    lowSpeedDownforce: 78,
    medSpeedDownforce: 79,
    highSpeedDownforce: 80,
    dragEfficiency: 81,
    drsEfficiency: 80,
    brakingPerformance: 80,
    mechanicalTraction: 79,
    tyrePreservation: 80,
    kerbCompliance: 79,
    enginePower: 86,
    energyDeployment: 85,
    coolingEfficiency: 83,
    chassisWeight: 806,
  },
  alpine: {
    lowSpeedDownforce: 81,
    medSpeedDownforce: 82,
    highSpeedDownforce: 82,
    dragEfficiency: 82,
    drsEfficiency: 81,
    brakingPerformance: 82,
    mechanicalTraction: 81,
    tyrePreservation: 82,
    kerbCompliance: 81,
    enginePower: 87,
    energyDeployment: 86,
    coolingEfficiency: 85,
    chassisWeight: 805,
  },
  cadillac: {
    lowSpeedDownforce: 76,
    medSpeedDownforce: 77,
    highSpeedDownforce: 78,
    dragEfficiency: 79,
    drsEfficiency: 78,
    brakingPerformance: 78,
    mechanicalTraction: 77,
    tyrePreservation: 78,
    kerbCompliance: 77,
    enginePower: 92,
    energyDeployment: 90,
    coolingEfficiency: 82,
    chassisWeight: 808,
  },
};

export const ENGINE_SUPPLIERS: Record<EngineSupplierId, EngineSupplier> = {
  titan_works: {
    id: "titan_works",
    name: "Titan Works Power V6 Turbo",
    supplierType: "works",
    annualCost: 24_000_000,
    powerRating: 94,
    ersRating: 92,
    reliabilityRating: 90,
    coolingRating: 88,
  },
  velocita_power: {
    id: "velocita_power",
    name: "Velocita High-Efficiency Hybrid",
    supplierType: "works",
    annualCost: 21_000_000,
    powerRating: 92,
    ersRating: 90,
    reliabilityRating: 89,
    coolingRating: 91,
  },
  apex_racing: {
    id: "apex_racing",
    name: "Apex Racing Powertrains",
    supplierType: "customer",
    annualCost: 17_000_000,
    powerRating: 88,
    ersRating: 86,
    reliabilityRating: 92,
    coolingRating: 86,
  },
  nova_customer: {
    id: "nova_customer",
    name: "Nova Customer Power Unit",
    supplierType: "customer",
    annualCost: 12_000_000,
    powerRating: 84,
    ersRating: 83,
    reliabilityRating: 93,
    coolingRating: 84,
  },
};

export function calculateOverallCarRating(attributes: CarAttributes): number {
  const aeroWeight = 0.4;
  const mechWeight = 0.3;
  const powerWeight = 0.2;
  const weightPenaltyWeight = 0.1;

  const aeroScore =
    (attributes.lowSpeedDownforce * 0.25 +
      attributes.medSpeedDownforce * 0.25 +
      attributes.highSpeedDownforce * 0.25 +
      attributes.dragEfficiency * 0.15 +
      attributes.drsEfficiency * 0.1) / 1.0;

  const mechScore =
    (attributes.brakingPerformance * 0.25 +
      attributes.mechanicalTraction * 0.3 +
      attributes.tyrePreservation * 0.25 +
      attributes.kerbCompliance * 0.2) / 1.0;

  const powerScore =
    (attributes.enginePower * 0.45 +
      attributes.energyDeployment * 0.35 +
      attributes.coolingEfficiency * 0.2) / 1.0;

  // Weight penalty: 798kg is 100, each kg above loses 4 points
  const excessKg = Math.max(0, attributes.chassisWeight - 798);
  const weightScore = Math.max(40, 100 - excessKg * 4);

  const overall = aeroScore * aeroWeight + mechScore * mechWeight + powerScore * powerWeight + weightScore * weightPenaltyWeight;
  return Number(overall.toFixed(1));
}

export const ATTRIBUTE_LABELS: Record<keyof CarAttributes, string> = {
  lowSpeedDownforce: "Low-Speed Aero",
  medSpeedDownforce: "Medium-Speed Aero",
  highSpeedDownforce: "High-Speed Aero",
  dragEfficiency: "Drag Efficiency",
  drsEfficiency: "DRS Efficiency",
  brakingPerformance: "Braking Performance",
  mechanicalTraction: "Mechanical Traction",
  tyrePreservation: "Tyre Preservation",
  kerbCompliance: "Kerb Compliance",
  enginePower: "Power Output",
  energyDeployment: "ERS Deployment",
  coolingEfficiency: "Cooling Efficiency",
  chassisWeight: "Chassis Weight",
};

export function calculateGridRankings(
  teamId: string,
  teamAttrs: CarAttributes,
): AttributeRanking[] {
  const gridEntries = Object.entries(BASELINE_GRID_ATTRIBUTES).map(([id, attrs]) => ({
    teamId: id,
    attrs: id === teamId ? teamAttrs : attrs,
    overall: calculateOverallCarRating(id === teamId ? teamAttrs : attrs),
  }));

  const keys = Object.keys(ATTRIBUTE_LABELS) as (keyof CarAttributes)[];
  const rankings: AttributeRanking[] = keys.map((key) => {
    // For chassisWeight, lower is better. For all others, higher is better.
    const isWeight = key === "chassisWeight";
    const sorted = [...gridEntries].sort((a, b) =>
      isWeight ? a.attrs[key] - b.attrs[key] : b.attrs[key] - a.attrs[key],
    );

    const rank = sorted.findIndex((e) => e.teamId === teamId) + 1;
    const values = sorted.map((e) => e.attrs[key]);
    const bestValue = isWeight ? Math.min(...values) : Math.max(...values);
    const worstValue = isWeight ? Math.max(...values) : Math.min(...values);

    return {
      attribute: key,
      label: ATTRIBUTE_LABELS[key],
      value: teamAttrs[key],
      rank: rank > 0 ? rank : 6,
      bestValue,
      worstValue,
    };
  });

  // Overall ranking
  const overallSorted = [...gridEntries].sort((a, b) => b.overall - a.overall);
  const overallRank = overallSorted.findIndex((e) => e.teamId === teamId) + 1;
  const overallValues = overallSorted.map((e) => e.overall);

  rankings.unshift({
    attribute: "overall",
    label: "Overall Car Rating",
    value: calculateOverallCarRating(teamAttrs),
    rank: overallRank > 0 ? overallRank : 6,
    bestValue: Math.max(...overallValues),
    worstValue: Math.min(...overallValues),
  });

  return rankings;
}

export function createInitialAtrAllocation(wccPosition: number): AtrAllocation {
  // Baseline: P1 gets 70% (280 hrs, 1400 MFLOPS), P11 gets 120% (480 hrs, 2400 MFLOPS)
  const handicapPct = Math.round(70 + (Math.min(11, Math.max(1, wccPosition)) - 1) * 5);
  const baseHours = 400;
  const baseMflops = 2000;

  const windTunnelHoursLimit = Math.round((baseHours * handicapPct) / 100);
  const cfdMflopsLimit = Math.round((baseMflops * handicapPct) / 100);

  return {
    periodNumber: 1,
    periodEndDate: "2027-04-15",
    windTunnelHoursLimit,
    windTunnelHoursUsed: 0,
    cfdMflopsLimit,
    cfdMflopsUsed: 0,
    wccHandicapPct: handicapPct,
  };
}

export function createInitialFittedParts(startDate: string): Record<CarPartType, FittedCarPart> {
  return {
    front_wing: {
      id: "part-fw-spec1",
      name: "Front Wing Spec-1",
      partType: "front_wing",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { lowSpeedDownforce: 1, medSpeedDownforce: 1 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 2,
      manufacturedDate: startDate,
    },
    rear_wing: {
      id: "part-rw-spec1",
      name: "Rear Wing Spec-1",
      partType: "rear_wing",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { highSpeedDownforce: 1, dragEfficiency: 1 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 2,
      manufacturedDate: startDate,
    },
    floor: {
      id: "part-fl-spec1",
      name: "Underfloor Venturi Spec-1",
      partType: "floor",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { lowSpeedDownforce: 2, highSpeedDownforce: 2 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 1,
      manufacturedDate: startDate,
    },
    sidepods: {
      id: "part-sp-spec1",
      name: "Downwash Sidepods Spec-1",
      partType: "sidepods",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { coolingEfficiency: 2, dragEfficiency: 1 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 2,
      manufacturedDate: startDate,
    },
    suspension: {
      id: "part-su-spec1",
      name: "Pushrod Front / Pullrod Rear Spec-1",
      partType: "suspension",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { kerbCompliance: 2, mechanicalTraction: 1 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 2,
      manufacturedDate: startDate,
    },
    brakes: {
      id: "part-br-spec1",
      name: "Carbon-Carbon Disc Ducts Spec-1",
      partType: "brakes",
      version: 1,
      conditionPct: 100,
      attributeDeltas: { brakingPerformance: 2, tyrePreservation: 1 },
      fittedCar1: true,
      fittedCar2: true,
      spareCount: 3,
      manufacturedDate: startDate,
    },
  };
}

export function createInitialCarDevelopment(teamId: string, seasonYear: number = 2027): CarDevelopmentState {
  const baseAttrs = BASELINE_GRID_ATTRIBUTES[teamId] || BASELINE_GRID_ATTRIBUTES.ferrari;

  // Pick appropriate engine supplier based on team
  let engineSupplier: EngineSupplier = ENGINE_SUPPLIERS.titan_works;
  if (teamId === "mercedes" || teamId === "mclaren" || teamId === "williams" || teamId === "alpine") {
    engineSupplier = ENGINE_SUPPLIERS.velocita_power;
  } else if (teamId === "aston-martin" || teamId === "haas") {
    engineSupplier = ENGINE_SUPPLIERS.apex_racing;
  } else if (teamId === "cadillac" || teamId === "audi") {
    engineSupplier = ENGINE_SUPPLIERS.nova_customer;
  }

  // Calculate reverse wcc position estimate for ATR
  const teamPositions: Record<string, number> = {
    mclaren: 1,
    ferrari: 2,
    "red-bull": 3,
    mercedes: 4,
    "aston-martin": 5,
    alpine: 6,
    haas: 7,
    "racing-bulls": 8,
    williams: 9,
    audi: 10,
    cadillac: 11,
  };
  const wccPos = teamPositions[teamId] ?? 6;

  const fittedParts = createInitialFittedParts(`${seasonYear}-01-01`);

  return {
    attributes: { ...baseAttrs },
    fittedParts,
    inventory: Object.values(fittedParts),
    atr: createInitialAtrAllocation(wccPos),
    engineSupplier,
  };
}

export type StartProjectOptions = {
  name: string;
  partType: CarPartType;
  focusPreset: ProjectFocusPreset;
  engineersAssigned: number;
  cfdAllocated: number; // MFLOPS
  windTunnelAllocated: number; // hours
  rushed: boolean;
  batchSize: number; // 1 to 4
};

export function startCarDevelopmentProject(
  career: CareerState,
  options: StartProjectOptions,
  storage?: CareerStorage,
): { career: CareerState; project: CarDevelopmentProject } {
  const carDev = syncCarDevState(career).carDev;
  const currentDate = career.clock.date;

  // Verify ATR limits
  const remainingAtrHours = carDev.atr.windTunnelHoursLimit - carDev.atr.windTunnelHoursUsed;
  const remainingCfd = carDev.atr.cfdMflopsLimit - carDev.atr.cfdMflopsUsed;

  const cfdToUse = Math.min(options.cfdAllocated, remainingCfd);
  const wtToUse = Math.min(options.windTunnelAllocated, remainingAtrHours);

  // Calculate project durations
  // Base design: 16 days. Each engineer beyond 5 reduces by 0.5 days (min 8 days).
  // CFD and Wind tunnel reduce design days.
  const engineerSpeedBonus = Math.min(6, Math.max(0, (options.engineersAssigned - 5) * 0.5));
  const atrSpeedBonus = Math.min(4, Math.floor((cfdToUse / 300) + (wtToUse / 50)));

  let designDays = Math.max(8, Math.round(18 - engineerSpeedBonus - atrSpeedBonus));
  let productionDays = Math.max(5, Math.round(10 + (options.batchSize - 1) * 3));
  let testingDays = 7;

  if (options.rushed) {
    designDays = Math.max(5, Math.round(designDays * 0.7));
    productionDays = Math.max(4, Math.round(productionDays * 0.7));
    testingDays = Math.max(4, Math.round(testingDays * 0.7));
  }

  const designCompletedDate = addDaysToDate(currentDate, designDays);
  const productionCompletedDate = addDaysToDate(designCompletedDate, productionDays);
  const testingCompletedDate = addDaysToDate(productionCompletedDate, testingDays);

  // Calculate target gain based on ATR and Focus
  const baseGain = 2.5 + (cfdToUse / 400) * 1.0 + (wtToUse / 60) * 1.2;
  const targetGainPct = Number(Math.min(6.5, baseGain).toFixed(2));

  // Determine attribute deltas based on partType and focus
  const attributeDeltas: Partial<CarAttributes> = {};
  const gainAmount = Math.round(targetGainPct);

  switch (options.partType) {
    case "front_wing":
      attributeDeltas.lowSpeedDownforce = gainAmount;
      attributeDeltas.medSpeedDownforce = Math.max(1, gainAmount - 1);
      if (options.focusPreset === "drag_reduction") attributeDeltas.dragEfficiency = 2;
      break;
    case "rear_wing":
      attributeDeltas.highSpeedDownforce = gainAmount;
      attributeDeltas.dragEfficiency = Math.max(1, gainAmount - 1);
      if (options.focusPreset === "downforce") attributeDeltas.drsEfficiency = 2;
      break;
    case "floor":
      attributeDeltas.lowSpeedDownforce = gainAmount;
      attributeDeltas.highSpeedDownforce = gainAmount;
      if (options.focusPreset === "downforce") attributeDeltas.medSpeedDownforce = 2;
      break;
    case "sidepods":
      attributeDeltas.coolingEfficiency = gainAmount;
      attributeDeltas.dragEfficiency = Math.max(1, gainAmount - 1);
      break;
    case "suspension":
      attributeDeltas.mechanicalTraction = gainAmount;
      attributeDeltas.kerbCompliance = Math.max(1, gainAmount - 1);
      break;
    case "brakes":
      attributeDeltas.brakingPerformance = gainAmount;
      attributeDeltas.tyrePreservation = Math.max(1, gainAmount - 1);
      break;
  }

  // Financial Cost calculation (Counts against Cost Cap)
  // Base part tooling: £800k + £350k per batch unit. Rush adds 50%.
  let cost = 800_000 + options.batchSize * 350_000;
  if (options.rushed) cost = Math.round(cost * 1.5);

  const projectId = `proj-${options.partType}-${Date.now().toString(36)}`;
  const project: CarDevelopmentProject = {
    id: projectId,
    name: options.name,
    partType: options.partType,
    phase: "design",
    startDate: currentDate,
    designDays,
    productionDays,
    testingDays,
    designCompletedDate,
    productionCompletedDate,
    testingCompletedDate,
    targetGainPct,
    actualGainPct: null,
    rushed: options.rushed,
    status: "in_progress",
    focusPreset: options.focusPreset,
    engineersAssigned: options.engineersAssigned,
    cfdAllocated: cfdToUse,
    windTunnelAllocated: wtToUse,
    batchSize: options.batchSize,
    cost,
    attributeDeltas,
  };

  // Deduct ATR
  const updatedAtr: AtrAllocation = {
    ...carDev.atr,
    windTunnelHoursUsed: carDev.atr.windTunnelHoursUsed + wtToUse,
    cfdMflopsUsed: carDev.atr.cfdMflopsUsed + cfdToUse,
  };

  const updatedCarDev: CarDevelopmentState = {
    ...carDev,
    atr: updatedAtr,
  };

  // Record Cost Cap expenditure
  const finState = recordFinancialTransaction(
    career,
    -cost,
    "car_development",
    `R&D Project: ${options.name} (${options.rushed ? "RUSH " : ""}Batch x${options.batchSize})`,
    false,
    storage,
  );

  const existingProjects = career.projects ?? [];
  const updatedProjects = [project, ...existingProjects];

  const updatedCareer: CareerState = {
    ...finState,
    carDev: updatedCarDev,
    projects: updatedProjects,
  };

  return {
    career: persistCareer(updatedCareer, storage),
    project,
  };
}

export function installCarPart(
  career: CareerState,
  partId: string,
  targetVehicle: "car1" | "car2" | "both",
  storage?: CareerStorage,
): CareerState {
  const carDev = syncCarDevState(career).carDev;
  const part = carDev.inventory.find((p) => p.id === partId);
  if (!part) return career;

  const quantity = part.spareCount + Number(part.fittedCar1) + Number(part.fittedCar2);
  const requested = targetVehicle === "both" ? 2 : 1;
  if(quantity < requested)throw new Error("Manufacture enough parts before fitting both cars.");
  const updatedPart: FittedCarPart = {
    ...part,
    spareCount:quantity-requested,
    fittedCar1: targetVehicle === "car1" || targetVehicle === "both",
    fittedCar2: targetVehicle === "car2" || targetVehicle === "both",
  };

  const updatedFitted = {
    ...carDev.fittedParts,
    [part.partType]: updatedPart,
  };

  const previous=carDev.fittedParts[part.partType];
  const updatedInventory = carDev.inventory.map((p) => p.id === partId ? updatedPart : p.id===previous.id ? {...p,spareCount:p.spareCount+Number(p.fittedCar1)+Number(p.fittedCar2),fittedCar1:false,fittedCar2:false}:p);

  // Recalculate car attributes by applying installed deltas to base
  const baseAttrs = BASELINE_GRID_ATTRIBUTES[career.player.teamId] || BASELINE_GRID_ATTRIBUTES.ferrari;
  const recalculatedAttrs = { ...baseAttrs };

  Object.values(updatedFitted).forEach((p) => {
    if (p.fittedCar1 || p.fittedCar2) {
      const factor = p.fittedCar1 && p.fittedCar2 ? 1.0 : 0.5;
      Object.entries(p.attributeDeltas).forEach(([key, delta]) => {
        const k = key as keyof CarAttributes;
        if (typeof delta === "number" && typeof recalculatedAttrs[k] === "number") {
          (recalculatedAttrs as any)[k] = k==="chassisWeight" ? Math.max(0,Math.round(recalculatedAttrs[k]+delta*factor)) : Math.min(99, Math.round((recalculatedAttrs[k] as number) + delta * factor));
        }
      });
    }
  });

  const updatedCareer: CareerState = {
    ...career,
    carDev: {
      ...carDev,
      fittedParts: updatedFitted,
      inventory: updatedInventory,
      attributes: recalculatedAttrs,
    },
  };

  return persistCareer(updatedCareer, storage);
}

export function completeCarDevelopmentProject(career:CareerState,projectId:string,correlationFidelityPct=85,storage?:CareerStorage):CareerState {
  const changed=completeCarDevelopmentProjectState(career,projectId,correlationFidelityPct);
  return changed===career?career:persistCareer(changed,storage);
}

export function completeCarDevelopmentProjectState(
  career: CareerState,
  projectId: string,
  correlationFidelityPct: number = 85,
  storage?: CareerStorage,
): CareerState {
  const synced = syncCarDevState(career);
  const carDev = synced.carDev;
  const projects = career.projects ?? [];
  const project = projects.find((p) => p.id === projectId);
  if (!project || project.status === "completed") return career;

  // Correlation accuracy factor
  const fidelityMultiplier = (correlationFidelityPct / 100) * (project.rushed ? 0.9 : 1.0);
  const actualGainPct = Number((project.targetGainPct * fidelityMultiplier).toFixed(2));

  // Determine part version
  const currentFitted = carDev.fittedParts[project.partType];
  const nextVersion = Math.max(currentFitted?.version ?? 1,...carDev.inventory.filter(part=>part.partType===project.partType).map(part=>part.version)) + 1;

  const newPart: FittedCarPart = {
    id: `part-${project.id}`,
    name: `${project.name} (v${nextVersion})`,
    partType: project.partType,
    version: nextVersion,
    conditionPct: 100,
    attributeDeltas: project.attributeDeltas ?? {},
    fittedCar1: false,
    fittedCar2: false,
    spareCount: project.batchSize ?? 1,
    manufacturedDate: career.clock.date,
  };

  const updatedProjects = projects.map((p) =>
    p.id === projectId
      ? {
          ...p,
          phase: "completed" as const,
          status: "completed" as const,
          actualGainPct,
        }
      : p,
  );

  const updatedFitted = {
    ...carDev.fittedParts,
    [project.partType]: newPart,
  };

  const updatedInventory = [newPart, ...carDev.inventory];

  // Apply new part deltas to attributes
  const updatedAttributes = { ...carDev.attributes };
  if (project.attributeDeltas) {
    Object.entries(project.attributeDeltas).forEach(([key, val]) => {
      const k = key as keyof CarAttributes;
      if (typeof val === "number") {
        (updatedAttributes as any)[k] = Math.min(99, Math.round(updatedAttributes[k] + val));
      }
    });
  }

  const updatedCareer: CareerState = {
    ...career,
    projects: updatedProjects,
    carDev: {
      ...carDev,
      attributes: carDev.attributes,
      fittedParts: carDev.fittedParts,
      inventory: updatedInventory,
    },
  };

  return updatedCareer;
}

export function syncCarDevState(career: CareerState): CareerState & { carDev: CarDevelopmentState } {
  if (career.carDev) {
    return career as CareerState & { carDev: CarDevelopmentState };
  }
  const carDev = createInitialCarDevelopment(career.player.teamId, career.season.year);
  return {
    ...career,
    carDev,
  };
}
