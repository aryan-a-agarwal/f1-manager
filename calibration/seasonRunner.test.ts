import assert from "node:assert/strict";
import test from "node:test";
import { createCareer } from "../lib/career/createCareer";
import { simulatedSessionEngine } from "../lib/career/sessionEngine";
import { simulateEntireWeekend } from "../lib/career/weekend";
import { saveCareer, type CareerStorage } from "../lib/career/storage";
import { chooseEmailDecision, resolveTimelineEvent, type CareerState } from "../lib/career";
import { teams } from "../lib/data/grid";

class MemoryStorage implements CareerStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

async function playWeekend(career:CareerState,roundId:string,engine:typeof simulatedSessionEngine,storage:CareerStorage){
  let state=career;
  for(let step=0;step<100;step++){
    state=await simulateEntireWeekend(state,roundId,engine,storage);
    if(state.season.calendar.rounds.find(round=>round.id===roundId)?.status==="archived")return state;
    if(state.clock.status!=="blocked")throw new Error("Weekend did not advance");
    const id=state.clock.blockingEventId!;const email=state.comms?.emails.find(item=>item.id===id);
    state=email?chooseEmailDecision(state,id,email.decisionChoices![0].id,storage):resolveTimelineEvent(state,id,storage);
  }
  throw new Error("Weekend exceeded the progress guard");
}

test("SEASON-01: Simulated session engine produces 22 valid driver results with realistic gaps", async () => {
  const career = createCareer("ferrari", { careerId: "season-test-1", now: new Date("2026-09-01T12:00:00Z") });
  const round = career.season.calendar.rounds[0];
  const race = round.sessions.find((s) => s.kind === "race")!;
  const participantIds = teams.flatMap((t) => t.drivers.map((d) => d.id));

  const input = {
    schemaVersion: 1 as const,
    id: "test-input",
    sessionId: race.id,
    roundId: round.id,
    snapshotId: "snap-1",
    sessionKind: race.kind,
    participantIds,
    randomSeed: 42,
    engineId: simulatedSessionEngine.id,
    engineVersion: simulatedSessionEngine.version,
    instructions: { runPlan: "neutral" as const, startingTyre: null, pitPlan: null, provenance: "player_selected" as const },
    provenance: "system_derived" as const,
  };

  const output = await simulatedSessionEngine.run(input);
  assert.equal(output.completionMode, "simulated");
  assert.equal(output.classification.length, 22);
  assert.equal(output.distancePercent, 100);

  // Position 1 should have gap 0 and status classified
  assert.equal(output.classification[0].position, 1);
  assert.equal(output.classification[0].gapMs, 0);
  assert.equal(output.classification[0].status, "classified");

  // Positions should be 1 to 22
  const positions = output.classification.map((c) => c.position);
  assert.deepEqual(positions, Array.from({ length: 22 }, (_, i) => i + 1));
});

test("SEASON-02: Simulate entire weekend resolves all sessions, awards FIA points, and archives weekend", async () => {
  const storage = new MemoryStorage();
  let career = saveCareer(createCareer("mclaren", { careerId: "season-test-2", now: new Date("2026-09-01T12:00:00Z") }), storage);
  const round = career.season.calendar.rounds[0];

  // Run full weekend
  career = await playWeekend(career, round.id, simulatedSessionEngine, storage);

  // Round should be archived
  const updatedRound = career.season.calendar.rounds.find((r) => r.id === round.id)!;
  assert.equal(updatedRound.status, "archived");

  // All 5 sessions should be completed
  assert.ok(updatedRound.sessions.every((s) => s.status === "completed"));

  // Championship standings should have points scored
  const totalDriverPoints = career.championship.drivers.reduce((sum, d) => sum + d.points, 0);
  const totalTeamPoints = career.championship.teams.reduce((sum, t) => sum + t.points, 0);

  // Full race points: 25+18+15+12+10+8+6+4+2+1 = 101 points
  assert.equal(totalDriverPoints, 101);
  assert.equal(totalTeamPoints, 101);

  // Winner has 25 points and 1 win
  const winner = career.championship.drivers.find((d) => d.points === 25);
  assert.ok(winner, "Winner must have 25 points");
  assert.equal(winner.wins, 1);
  assert.equal(winner.podiums, 1);
});

test("SEASON-03: Multiple consecutive race weekends accumulate points across the season", async () => {
  const storage = new MemoryStorage();
  let career = saveCareer(createCareer("mercedes", { careerId: "season-test-3", now: new Date("2026-09-01T12:00:00Z") }), storage);

  // Run Round 1
  career = await playWeekend(career, career.season.calendar.rounds[0].id, simulatedSessionEngine, storage);
  // Run Round 2
  career = await playWeekend(career, career.season.calendar.rounds[1].id, simulatedSessionEngine, storage);

  // Total points: Round 1 (101 pts) + Round 2 Sprint (36 pts) + Round 2 GP (101 pts) = 238 pts
  const totalDriverPoints = career.championship.drivers.reduce((sum, d) => sum + d.points, 0);
  assert.equal(totalDriverPoints, 238);

  // Both rounds are archived
  assert.equal(career.season.calendar.rounds[0].status, "archived");
  assert.equal(career.season.calendar.rounds[1].status, "archived");
});
