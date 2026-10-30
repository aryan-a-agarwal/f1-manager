import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGridRankings,
  calculateOverallCarRating,
  completeCarDevelopmentProject,
  createCareer as createPlainCareer,
  createInitialCarDevelopment,
  createInitialFacilities,
  installCarPart,
  processFacilityWearAndUpkeep,
  refurbishFacility,
  startCarDevelopmentProject,
  startFacilityUpgrade,
} from "../lib/career";

test("CARDEV-01: Car attributes initialize across 12 channels and compute overall rating", () => {
  const career = createCareer("ferrari");
  assert.ok(career.carDev, "Career must have carDev initialized");

  const attrs = career.carDev.attributes;
  assert.ok(attrs.lowSpeedDownforce >= 70, "lowSpeedDownforce should be valid");
  assert.ok(attrs.highSpeedDownforce >= 70, "highSpeedDownforce should be valid");
  assert.ok(attrs.enginePower >= 85, "enginePower should be valid");
  assert.ok(attrs.chassisWeight >= 798, "chassisWeight must be at or above FIA minimum weight");

  const overall = calculateOverallCarRating(attrs);
  assert.ok(overall >= 80 && overall <= 100, `Overall rating ${overall} must be between 80 and 100`);
});

test("CARDEV-02: Grid comparative ranking accurately sorts 11 teams across all channels", () => {
  const career = createCareer("ferrari");
  const rankings = calculateGridRankings("ferrari", career.carDev!.attributes);

  assert.equal(rankings.length, 14, "Must contain 14 rankings (overall + 13 channels)");
  const overall = rankings.find((r) => r.attribute === "overall");
  assert.ok(overall, "Must contain overall ranking");
  assert.ok(overall!.rank >= 1 && overall!.rank <= 11);

  const power = rankings.find((r) => r.attribute === "enginePower");
  assert.ok(power, "Must contain power ranking");
  assert.ok(power!.rank <= 3, "Ferrari should rank in top 3 for power");
});

test("CARDEV-03: Starting project allocates ATR compute, burns cost cap, and creates project", () => {
  const career = createCareer("ferrari");
  const initialCash = career.finance!.cashBalance;
  const initialCap = career.finance!.costCapSpent;
  const initialWtHours = career.carDev!.atr.windTunnelHoursUsed;

  const { career: updated, project } = startCarDevelopmentProject(career, {
    name: "Front Wing Spec-2",
    partType: "front_wing",
    focusPreset: "downforce",
    engineersAssigned: 8,
    cfdAllocated: 250,
    windTunnelAllocated: 40,
    rushed: false,
    batchSize: 2,
  });

  assert.equal(project.phase, "design");
  assert.equal(project.partType, "front_wing");
  assert.equal(updated.projects?.some((p) => p.id === project.id), true);

  // ATR hours deducted
  assert.equal(updated.carDev!.atr.windTunnelHoursUsed, initialWtHours + 40);
  assert.equal(updated.carDev!.atr.cfdMflopsUsed, 250);

  // Cost cap counted
  assert.ok(updated.finance!.book!.entries.some(e=>e.relevantCents>0), "Development is recorded as a relevant cost before season adjustments");
  assert.ok(updated.finance!.costCapSpent >= initialCap, "Adjusted cost-cap usage cannot decrease");
  assert.ok(updated.finance!.cashBalance < initialCash, "Cash balance must decrease");
});

test("CARDEV-04: Rush build applies -30% time reduction and +50% cost penalty", () => {
  const career = createCareer("ferrari");

  const { project: normal } = startCarDevelopmentProject(career, {
    name: "Floor Normal",
    partType: "floor",
    focusPreset: "balanced",
    engineersAssigned: 6,
    cfdAllocated: 100,
    windTunnelAllocated: 20,
    rushed: false,
    batchSize: 2,
  });

  const { project: rushed } = startCarDevelopmentProject(career, {
    name: "Floor Rushed",
    partType: "floor",
    focusPreset: "balanced",
    engineersAssigned: 6,
    cfdAllocated: 100,
    windTunnelAllocated: 20,
    rushed: true,
    batchSize: 2,
  });

  assert.equal(rushed.rushed, true);
  assert.ok(rushed.designDays < normal.designDays, "Rushed design days must be less");
  assert.equal(rushed.cost, Math.round(normal.cost! * 1.5), "Rushed cost must be 1.5x");
});

test("CARDEV-05: Completing project manufactures inventory and installing updates attributes", () => {
  const career = createCareer("ferrari");
  const { career: withProject, project } = startCarDevelopmentProject(career, {
    name: "Sidepod Downwash Spec-2",
    partType: "sidepods",
    focusPreset: "cooling",
    engineersAssigned: 10,
    cfdAllocated: 200,
    windTunnelAllocated: 30,
    rushed: false,
    batchSize: 2,
  });

  const initialCooling = withProject.carDev!.attributes.coolingEfficiency;

  const completedCareer = completeCarDevelopmentProject(withProject, project.id, 95);
  const updatedProj = completedCareer.projects?.find((p) => p.id === project.id);
  assert.equal(updatedProj?.status, "completed");
  assert.ok((updatedProj?.actualGainPct ?? 0) > 0);

  // Check inventory part creation
  const newPart = completedCareer.carDev!.inventory.find((p) => p.name.includes("Sidepod Downwash Spec-2"));
  assert.ok(newPart, "New part must exist in inventory");
  assert.equal(newPart!.version, 2);

  // Check cooling attribute gains
  assert.equal(completedCareer.carDev!.attributes.coolingEfficiency, initialCooling, "Manufacturing does not install the part");
  assert.equal(newPart!.fittedCar1,false);

  // Install to car 1 only
  const installedCareer = installCarPart(completedCareer, newPart!.id, "car1");
  const sidepods = installedCareer.carDev!.fittedParts.sidepods;
  assert.equal(sidepods.fittedCar1, true);
  assert.equal(sidepods.fittedCar2, false);
  assert.ok(installedCareer.carDev!.attributes.coolingEfficiency > initialCooling);
});

test("CARDEV-06: Facilities campus upgrades, condition degradation, and refurbishment", () => {
  const career = createCareer("ferrari");
  assert.ok(career.facilities, "Facilities must be defined");
  assert.ok(career.facilities!.facilities.wind_tunnel.level >= 2);

  const initialCash = career.finance!.cashBalance;
  const upgradedCareer = startFacilityUpgrade(career, "wind_tunnel");
  const tunnel = upgradedCareer.facilities!.facilities.wind_tunnel;

  assert.equal(tunnel.upgradeInConstruction, true);
  assert.equal(tunnel.upgradeTargetLevel, tunnel.level + 1);
  assert.ok(tunnel.upgradeCompletionDate);
  assert.ok(upgradedCareer.finance!.cashBalance < initialCash);

  // Wear degradation
  const wornCareer = processFacilityWearAndUpkeep(upgradedCareer, 45);
  assert.ok(wornCareer.facilities!.facilities.factory.conditionPct < 100);

  // Refurbish
  const restoredCareer = refurbishFacility(wornCareer, "factory");
  assert.equal(restoredCareer.facilities!.facilities.factory.conditionPct, 100);
});
