import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCostCapStatus,
  calculateWccPrizeProjection,
  createCareer as createPlainCareer,
  createInitialCommercial,
  createInitialFinance,
  executeDriverPrDay,
  recordFinancialTransaction,
  signSponsorContract,
} from "../lib/career";

test("COMM-01: Commercial initializes with 7 slots, driver marketability, prestige, and WCC projection", () => {
  const comm = createInitialCommercial("ferrari", 2027);

  assert.equal(comm.activeContracts.length,0);
  assert.equal(comm.availableOffers.length,0);
  assert.deepEqual(comm.driverMarketability,{});
  assert.equal(comm.merchandiseRevenueYtd,0);
});

test("COMM-02: Concorde WCC prize money calculation computes 11-tier distribution & deltas", () => {
  const career = createCareer("ferrari");
  const projection = calculateWccPrizeProjection("ferrari", career.championship);

  assert.ok(projection.currentPosition >= 1 && projection.currentPosition <= 11);
  assert.ok(projection.projectedPayout >= 32_000_000 && projection.projectedPayout <= 125_000_000);

  // If not P1, must calculate delta ahead
  if (projection.currentPosition > 1) {
    assert.ok(projection.gapAheadPts !== null);
    assert.ok(projection.payoutDeltaAhead !== null && projection.payoutDeltaAhead > 0);
    assert.ok(projection.targetConstructorAhead !== null);
  }

  // If not P11, must calculate delta behind
  if (projection.currentPosition < 11) {
    assert.ok(projection.gapBehindPts !== null);
    assert.ok(projection.payoutDeltaBehind !== null && projection.payoutDeltaBehind > 0);
    assert.ok(projection.threatConstructorBehind !== null);
  }
});

test("COMM-03: Driver PR event awards cash bonus and applies driver fatigue/sim trade-off", () => {
  const career = createCareer("ferrari");
  assert.ok(career.commercial);
  assert.ok(career.finance);

  const titleContract = career.commercial.activeContracts.find((c) => c.slot === "title")!;
  const initialCompleted = titleContract.prDaysCompleted;
  const initialCash = career.finance.cashBalance;
  const initialMorale = career.comms?.driverBriefings.driver_1.morale ?? 80;

  const updated = executeDriverPrDay(career, titleContract.id, "driver_1");

  const updatedContract = updated.commercial?.activeContracts.find((c) => c.id === titleContract.id)!;
  assert.equal(updatedContract.prDaysCompleted, initialCompleted + 1);

  // Cash awarded
  assert.equal(updated.finance?.cashBalance, initialCash + titleContract.prBonusPerEvent);

  // Driver sim prep / morale trade-off applied
  const updatedMorale = updated.comms?.driverBriefings.driver_1.morale ?? 0;
  assert.ok(updatedMorale < initialMorale, "Driver morale/confidence should decrease due to missing sim prep");
});

test("COMM-04: Signing a sponsor replacement updates active contract and removes offer", () => {
  const career = createCareer("ferrari");
  const offer = career.commercial?.availableOffers[0]!;

  const updated = signSponsorContract(career, offer.id, offer.slot);

  const activeInSlot = updated.commercial?.activeContracts.find((c) => c.slot === offer.slot);
  assert.equal(activeInSlot?.id, offer.id);
  assert.equal(activeInSlot?.name, offer.name);

  const stillInOffers = updated.commercial?.availableOffers.some((o) => o.id === offer.id);
  assert.equal(stillInOffers, false, "Offer should be removed from available pool");
});

test("FIN-01: Finance initializes with cash reserves, £135M cost cap, and transaction ledger", () => {
  const fin = createInitialFinance("ferrari", 2027);

  assert.equal(fin.costCapLimit, 135_000_000);
  assert.ok(fin.cashBalance > 0);
  assert.equal(fin.costCapSpent,0);
  assert.equal(fin.costCapExemptSpent,0);
  assert.equal(fin.transactions.length,0);
});

test("FIN-02: Transaction recording strictly segregates Cap-Exempt vs Cap-Counted expenses", () => {
  const career = createCareer("ferrari");
  const initialCapSpent = career.finance?.costCapSpent ?? 0;
  const initialExemptSpent = career.finance?.costCapExemptSpent ?? 0;
  const initialCash = career.finance?.cashBalance ?? 0;

  // 1. Record Cap-Exempt expense (e.g. driver salary £5M)
  const afterExempt = recordFinancialTransaction(
    career,
    -5_000_000,
    "driver_salaries",
    "Mid-season driver retainer",
    true, // exempt
  );

  assert.equal(afterExempt.finance?.cashBalance, initialCash - 5_000_000);
  assert.equal(afterExempt.finance?.costCapSpent, initialCapSpent, "Cost cap spent must NOT increase for exempt items");
  assert.equal(afterExempt.finance?.costCapExemptSpent, initialExemptSpent + 5_000_000);

  // 2. Record Cap-Counted expense (e.g. car development £2.5M)
  const afterCounted = recordFinancialTransaction(
    afterExempt,
    -2_500_000,
    "car_development",
    "Floor composite autoclave production",
    false, // counts against cap!
  );

  assert.equal(afterCounted.finance?.cashBalance, initialCash - 7_500_000);
  assert.equal(afterCounted.finance?.costCapSpent, initialCapSpent + 2_500_000, "Cost cap spent MUST increase for counted items");
});

test("FIN-03: Cost cap status calculates headroom and flags warning/breach thresholds", () => {
  const career = createCareer("ferrari");

  const compliantStatus = calculateCostCapStatus(career);
  assert.equal(compliantStatus.status, "compliant");
  assert.ok(compliantStatus.headroom > 0);

  // Artificially push expenses near cap
  const nearCapCareer = {
    ...career,
    finance: {
      ...career.finance!,
      costCapSpent: 130_000_000, // > 95%
    },
  };
  const warningStatus = calculateCostCapStatus(nearCapCareer);
  assert.equal(warningStatus.status, "warning");

  // Artificially breach cap
  const breachCareer = {
    ...career,
    finance: {
      ...career.finance!,
      costCapSpent: 136_500_000, // > 135M
    },
  };
  const breachedStatus = calculateCostCapStatus(breachCareer);
  assert.equal(breachedStatus.status, "breached");
  assert.match(breachedStatus.sanctionsRisk, /points deduction/);
});
