import type { ClassificationEntry, SessionInput, SessionKind, SessionOutput } from "./types";

export interface SessionEngine {
  id:string;
  version:string;
  supports(kind:SessionKind):boolean;
  run(input:SessionInput):Promise<SessionOutput>;
}

export const administrativeSessionEngine: SessionEngine = {
  id:"administrative-placeholder",
  version:"1.0.0",
  supports:() => true,
  async run(input) {
    return {
      schemaVersion:1,
      id:`${input.id}-output`,
      attemptId:input.id.replace("-input",""),
      sessionId:input.sessionId,
      completionMode:"administrative_placeholder",
      classification:[],
      distancePercent:null,
      provenance:"administrative_placeholder",
      engineId:this.id,
      engineVersion:this.version,
      createdAt:new Date().toISOString(),
    };
  },
};

const driverBaseRatings: Record<string, number> = {
  verstappen: 92,
  norris: 91,
  leclerc: 90,
  hamilton: 89,
  piastri: 88,
  russell: 88,
  sainz: 86,
  alonso: 86,
  albon: 83,
  antonelli: 82,
  gasly: 82,
  ocon: 81,
  hadjar: 80,
  stroll: 79,
  bearman: 80,
  hulkenberg: 80,
  lawson: 80,
  lindblad: 78,
  bortoleto: 78,
  colapinto: 79,
  perez: 78,
  bottas: 79,
};

function pseudoRandom(seed: number, index: number) {
  const x = Math.sin(seed + index * 101.7) * 10000;
  return x - Math.floor(x);
}

export const simulatedSessionEngine: SessionEngine = {
  id: "simulated-fast-engine",
  version: "1.0.0",
  supports: () => true,
  async run(input: SessionInput): Promise<SessionOutput> {
    const scoredDrivers = input.participantIds.map((driverId, idx) => {
      const base = input.carPerformance?.scores[driverId] ?? driverBaseRatings[driverId] ?? 80;
      const variance = (pseudoRandom(input.randomSeed, idx) - 0.5) * 9;
      return { driverId, score: base + variance };
    });

    scoredDrivers.sort((a, b) => b.score - a.score);

    const isRace = input.sessionKind === "race" || input.sessionKind === "sprint";
    const totalLaps = input.sessionKind === "sprint" ? (input.carPerformance?Math.ceil(100/input.carPerformance.lapLengthKm):19) : isRace ? (input.carPerformance?.raceLaps??58) : 15;
    const baseLapMs = isRace ? 5_400_000 : 82_000;

    let cumulativeGap = 0;
    const classification: ClassificationEntry[] = scoredDrivers.map((item, idx) => {
      const pos = idx + 1;
      if (pos === 1) {
        return {
          position: 1,
          driverId: item.driverId,
          status: "classified" as const,
          laps: totalLaps,
          timeMs: baseLapMs,
          gapMs: 0,
        };
      }

      // Small chance of DNF for position 22 in a Grand Prix
      const isDnf = isRace && pos === 22 && (input.randomSeed % 4 === 0);
      if (isDnf) {
        return {
          position: pos,
          driverId: item.driverId,
          status: "retired" as const,
          laps: Math.floor(totalLaps * 0.6),
          timeMs: null,
          gapMs: null,
        };
      }

      const stepGap = Math.round(800 + pseudoRandom(input.randomSeed, pos) * 2200);
      cumulativeGap += stepGap;

      return {
        position: pos,
        driverId: item.driverId,
        status: "classified" as const,
        laps: totalLaps,
        timeMs: baseLapMs + cumulativeGap,
        gapMs: cumulativeGap,
      };
    });

    return {
      schemaVersion: 1,
      id: `${input.id}-output`,
      attemptId: input.id.replace("-input", ""),
      sessionId: input.sessionId,
      completionMode: "simulated",
      classification,
      distancePercent: 100,
      provenance: "engine_generated",
      engineId: this.id,
      engineVersion: this.version,
      createdAt: new Date().toISOString(),
    };
  },
};

export function validateSessionOutput(input:SessionInput, output:SessionOutput) {
  if (output.schemaVersion !== 1 || output.sessionId !== input.sessionId || output.attemptId !== input.id.replace("-input","") || output.engineId !== input.engineId || output.engineVersion !== input.engineVersion) return false;
  const participantIds = new Set(input.participantIds);
  const drivers = output.classification.map((entry) => entry.driverId);
  if (new Set(drivers).size !== drivers.length || drivers.some((id) => !participantIds.has(id))) return false;
  const positions = output.classification.map((entry) => entry.position);
  if (new Set(positions).size !== positions.length || positions.some((position) => !Number.isInteger(position) || position < 1)) return false;
  if (["sprint_qualifying","sprint","qualifying","race"].includes(input.sessionKind) && output.completionMode === "simulated" && output.classification.length !== input.participantIds.length) return false;
  if(output.completionMode==="simulated"&&(typeof output.distancePercent!=="number"||output.distancePercent<0||output.distancePercent>100))return false;
  if(output.completionMode==="administrative_placeholder"&&output.distancePercent!==null)return false;
  if ([...positions].sort((a,b)=>a-b).some((position,index)=>position!==index+1)) return false;
  return output.classification.every((entry) => (entry.laps === null || (Number.isInteger(entry.laps) && entry.laps >= 0))
    && (entry.timeMs === null || (Number.isInteger(entry.timeMs) && entry.timeMs >= 0))
    && (entry.gapMs === null || (Number.isInteger(entry.gapMs) && entry.gapMs >= 0)));
}
