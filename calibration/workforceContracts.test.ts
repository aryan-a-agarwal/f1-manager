import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDriverOverall,
  createCareer as createPlainCareer,
  createInitialMarket,
  negotiateDriverContract,
  negotiateStaffContract,
} from "../lib/career";

test("WORKFORCE-01: Driver skills initialize across 8 granular vectors and calculate overall rating", () => {
  const career = createCareer("ferrari");
  assert.ok(career.market, "Market state must be initialized");

  const drivers = career.market.drivers;
  assert.ok(drivers.length >= 22, "Must contain all grid drivers plus prospects");

  const max = drivers.find((d) => d.id === "verstappen");
  assert.ok(max);
  assert.ok(max!.skills.pace >= 95);
  assert.ok(max!.skills.wetWeather >= 95);
  assert.equal(max!.overallRating, 97);
  assert.ok(max!.traits.includes("Rain Master"));

  const calcOvr = calculateDriverOverall(max!.skills);
  assert.equal(calcOvr, 97);
});

test("WORKFORCE-02: Paddock market pool contains free agents and young prospects", () => {
  const career = createCareer("ferrari");
  const freeAgents = career.market!.drivers.filter((d) => d.currentTeamId === null);

  assert.ok(freeAgents.length >= 3, "Should have free agents available");
  const tsunoda = freeAgents.find((d) => d.id === "tsunoda");
  assert.ok(tsunoda, "Tsunoda should be a free agent prospect");
  assert.equal(tsunoda!.contract.buyoutClause, 0, "Free agent has 0 buyout clause");
});

test("WORKFORCE-03: Driver rejects lowball salary and returns counter-offer", () => {
  const career = createCareer("ferrari");
  const result = negotiateDriverContract(career, "tsunoda", 2, {
    salaryPerYear: 1_000_000, // Demands ~£4.6M+
    contractYears: 2,
    status: "equal",
    pointsBonus: 15_000,
    podiumBonus: 50_000,
    winBonus: 200_000,
    titleBonus: 1_000_000,
  });

  assert.equal(result.accepted, false);
  assert.ok(result.reason.includes("below"));
  assert.ok(result.counterOffer);
  assert.ok(result.counterOffer!.salaryPerYear > 1_000_000);
});

test("WORKFORCE-04: Championship caliber drivers refuse subordinate contract status", () => {
  const career = createCareer("ferrari");
  const result = negotiateDriverContract(career, "verstappen", 2, {
    salaryPerYear: 50_000_000,
    contractYears: 3,
    status: "second_driver", // Insulting to 97 OVR 3x Champion
    pointsBonus: 50_000,
    podiumBonus: 200_000,
    winBonus: 800_000,
    titleBonus: 5_000_000,
  });

  assert.equal(result.accepted, false);
  assert.ok(result.reason.includes("refuses a second driver contract status"));
});

test("WORKFORCE-05: Successful driver signing deducts buyout clause and updates lineup", () => {
  const career = createCareer("ferrari");
  // Sign free agent Tsunoda to seat 2
  const initialCash = career.finance!.cashBalance;

  const result = negotiateDriverContract(career, "tsunoda", 2, {
    salaryPerYear: 7_500_000,
    contractYears: 2,
    status: "equal",
    pointsBonus: 20_000,
    podiumBonus: 60_000,
    winBonus: 250_000,
    titleBonus: 1_500_000,
  });

  assert.equal(result.accepted, true);
  assert.equal(result.buyoutPaid, 0); // free agent
  const updatedCareer = result.career;

  const signedDriver = updatedCareer.market!.drivers.find((d) => d.id === "tsunoda");
  assert.equal(signedDriver!.currentTeamId, "ferrari");
  assert.equal(signedDriver!.contract.salaryPerYear, 7_500_000);
  assert.equal(signedDriver!.contract.status, "equal");
});

test("WORKFORCE-06: Poaching contracted rival driver triggers Cap-Exempt buyout clause", () => {
  const career = createCareer("ferrari");
  // Ferrari starts with £54M cash. Piastri buyout is £28M.
  const piastri = career.market!.drivers.find((d) => d.id === "piastri")!;
  const buyout = piastri.contract.buyoutClause;
  const initialCash = career.finance!.cashBalance;
  const initialCostCapSpent = career.finance!.costCapSpent;

  const result = negotiateDriverContract(career, "piastri", 2, {
    salaryPerYear: 22_000_000,
    contractYears: 3,
    status: "equal",
    pointsBonus: 30_000,
    podiumBonus: 100_000,
    winBonus: 400_000,
    titleBonus: 2_500_000,
  });

  assert.equal(result.accepted, true);
  assert.equal(result.buyoutPaid, buyout);

  // Cash deducted
  assert.equal(result.career.finance!.cashBalance, initialCash - buyout);
  // Cost cap NOT impacted (Driver buyouts are Art 3.1 Cap-Exempt!)
  assert.equal(result.career.finance!.costCapSpent, initialCostCapSpent);

  const updatedPiastri = result.career.market!.drivers.find((d) => d.id === "piastri");
  assert.equal(updatedPiastri!.currentTeamId, "ferrari");
});

test("WORKFORCE-07: Staff hiring and poaching counts buyout against Cost Cap", () => {
  const career = createCareer("ferrari");
  const initialCash = career.finance!.cashBalance;
  const initialCap = career.finance!.costCapSpent;

  // Poach Peter Bonnington (Bono) from Mercedes (£4M buyout)
  const result = negotiateStaffContract(career, "staff-bonnington", 3_000_000, 3);
  assert.equal(result.accepted, true);
  assert.equal(result.buyoutPaid, 4_000_000);

  // Cash deducted
  assert.equal(result.career.finance!.cashBalance, initialCash - 4_000_000);
  // Staff buyout DOES count against Cost Cap!
  assert.equal(result.career.finance!.costCapSpent, initialCap + 4_000_000);

  const bono = result.career.market!.staff.find((s) => s.id === "staff-bonnington");
  assert.equal(bono!.currentTeamId, "ferrari");
  assert.equal(bono!.salaryPerYear, 3_000_000);
});
