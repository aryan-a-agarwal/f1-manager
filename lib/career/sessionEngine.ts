import type { SessionInput, SessionKind, SessionOutput } from "./types";

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
