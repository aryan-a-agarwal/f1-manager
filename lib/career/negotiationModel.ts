import type {ContractRole} from './contracts';
import type {NegotiationTerms,OfferClause} from './negotiation';

export type Offer={role:ContractRole;seat:1|2;salaryCents:number;terms:NegotiationTerms};
export type OfferContext={
  referenceRole?:ContractRole;currentRaceTeam?:string|null;age?:number|null;
  personId?:string;teamId?:string;date?:string;raceEndDate?:string|null;ability?:number|null;
  loyalty?:number|null;competitiveness?:number|null;currentCompetitiveness?:number|null;currentEmployerReputation?:number|null;
  roleSalaryCents?:Partial<Record<ContractRole,number>>;raceDates?:string[];fingerprint?:string;
  activeRace?:boolean;source?:string;preferredClauses?:Partial<Record<ContractRole,OfferClause[]>>;
};
export type NegotiatingProfile={seed:number;security:number;development:number;autonomy:number;performance:number;loyalty:number;patience:number;sensitivity:number;preferredSeasons:number;bonusCap:number;riskFactor:number};
export type DemandProfile={annualCents:number;minimumAnnualCents:number;recurringFloor:number;threshold:number;role:ContractRole;willing:boolean;refusal:string|null;profile:NegotiatingProfile;context:OfferContext};
export type OfferIssue={key:string;message:string;severity:'hard'|'important'|'tradeable';gap:number};
export type OfferAssessment={utility:number;threshold:number;guaranteedRatio:number;acceptable:boolean;issues:OfferIssue[];guaranteedCents:number;conditionalCents:number;bonusCreditCents:number;serviceYears:number;forecast:string;guaranteedByYear:{year:number;cents:number;fraction:number}[]};
export type OfferRound={offer:Offer;response:'accepted'|'counter'|'rejected'|'withdrawn';reason:string;counter?:Offer;assessment?:OfferAssessment;changes?:string[];conduct?:string;patience?:number};
export type OfferNegotiation={
  version?:2;engineVersion?:string;status:'open'|'accepted'|'withdrawn';expectedSalaryCents:number;frustration:number;rounds:OfferRound[];acceptedOffer?:Offer;
  seed?:number;profile?:NegotiatingProfile;context?:OfferContext;demands?:DemandProfile;patience?:number;trust?:number;stagnation?:number;
  bestUtility?:number;bestRole?:ContractRole;improvements?:number;recoveryUsed?:number;warning?:boolean;revision?:number;
  endedBy?:'player'|'driver';endedReason?:string;legacyCounter?:Offer;requestId?:string;acceptedAt?:string;
  reopenedFromRevision?:number;
  reopenedForRole?:ContractRole;
};
export const NEGOTIATION_CONFIG={version:'package-negotiations-v2',discount:.05,insultGuarantee:.2,insultUtility:.4,bonusCap:[.1,.2,.3],warning:15,meaningful:2,maxRecovery:6,defaultCommercial:10,defaultSimulator:{race_driver:10,reserve_driver:20},unknownRaceCents:150_000_000,unknownReserveCents:35_000_000} as const;
export const clamp=(n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
export function hashSeed(s:string){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function clauseValue(offer:Offer,kind:OfferClause['kind']){const c=offer.terms.clauses.find(c=>c.kind===kind);return c?.value??(kind==='protection'?100:kind==='commercial'?NEGOTIATION_CONFIG.defaultCommercial:kind==='simulator'?NEGOTIATION_CONFIG.defaultSimulator[offer.role]:0);}
export function canonicalOffer(o:Offer){return JSON.stringify({...o,salaryCents:Math.round(o.salaryCents),terms:{...o.terms,clauses:(['signing','loyalty','increase','win','podium','points','champion','appearance','practice','simulator','commercial','parity','promotion','release','protection'] as const).map(kind=>({kind,value:clauseValue(o,kind)}))}});}
export function editClause(o:Offer,kind:OfferClause['kind'],value:number):Offer {return {...o,terms:{...o.terms,clauses:[...o.terms.clauses.filter(c=>c.kind!==kind),{kind,value}]}};}
export function patienceLabel(s:OfferNegotiation){const p=s.patience??100-s.frustration;return p<=15?'Final attempt':p<35?'Impatient':p<60?'Engaged':'Patient';}
