import seed from "@/supabase/seed-data/2027-contract-clauses.json";
import type {CareerState} from "./types";

export type ContractClausePackage = {version:string;personSlug:string;teamId:string;role:string;startSeason:number;endSeason:number;category:string;rationale:string;clauses:{kind:string;title:string;terms:string;basis:string;execution:string;parameters:Record<string,string|number|boolean|undefined>}[]};

export function isClausePackage(value:unknown):value is ContractClausePackage {
  if(!value||typeof value!=="object")return false;
  const p=value as ContractClausePackage;
  return typeof p.version==="string"&&typeof p.personSlug==="string"&&typeof p.teamId==="string"&&
    ["race_driver","reserve_driver"].includes(p.role)&&Number.isInteger(p.startSeason)&&Number.isInteger(p.endSeason)&&p.endSeason>=p.startSeason&&
    typeof p.category==="string"&&typeof p.rationale==="string"&&Array.isArray(p.clauses)&&p.clauses.length>0&&
    p.clauses.every(c=>c!==null&&typeof c==="object"&&
      typeof c.kind==="string"&&typeof c.title==="string"&&typeof c.terms==="string"&&
      c.basis==="game_assumption"&&c.execution==="recorded_only"&&c.parameters!==null&&typeof c.parameters==="object"&&
      Object.values(c.parameters).every(v=>typeof v==="string"||typeof v==="boolean"||(typeof v==="number"&&Number.isFinite(v)&&v>=0)))&&new Set(p.clauses.map(c=>c.kind)).size===p.clauses.length;
}

/** Add missing starting terms once. Never replace negotiated terms or attach another team's package. */
export function ensureStartingContractClauses(career:CareerState):CareerState {
  const desk=career.contractDesk;
  if(!desk||![seed.datasetId,'f1-2027-starting-grid-2026-10-26-v1'].includes(desk.baseline.datasetId))return career;
  let changed=false;
  const facts=desk.baseline.facts.map(f=>{
    if(f.clausePackage)return f;
    const p=seed.packages.find(p=>p.personSlug===f.personId&&p.teamId===f.teamId&&p.role===f.role&&p.endSeason===f.scenarioTerms?.endSeason);
    if(!p)return f;
    changed=true;
    return {...f,clausePackage:structuredClone(p)};
  });
  return changed?{...career,contractDesk:{...desk,baseline:{...desk.baseline,facts}}}:career;
}
