import type {CareerState} from "./types";
import {teams} from "../data/grid";
import {assumedDriverSalary,DRIVER_SALARY_MODEL_VERSION} from "./driverSalaries";

export type ContractRole="race_driver"|"reserve_driver";
export type ContractPerson={id:string;name:string;careerDriverId:string|null};
export type ContractFact={id:string;personId:string;teamId:string;role:ContractRole;status:"confirmed"|"reported"|"unconfirmed";minimumEnd:number|null;exactEnd:number|null;salaryCents:number|null;sourceUrl:string;checkedOn:string;notes:string;scenarioTerms?:{endSeason:number;endBasis:"published_exact"|"game_assumption";seatBasis:"confirmed"|"game_assumption"}};
export type ContractSlot={teamId:string;role:ContractRole;number:1|2;personId:string|null;status:string};
export type ContractBaseline={datasetId:string;season:number;asOfDate:string;capturedOn:string;people:ContractPerson[];facts:ContractFact[];slots:ContractSlot[]};
export type ContractDraft={id:string;teamId:string;personId:string;role:ContractRole;seat:1|2;startSeason:number;seasons:number;salaryCents:number;createdOn:string;status:"draft"|"withdrawn"};
export type ContractDeskState={version:1;baseline:ContractBaseline;drafts:ContractDraft[];reserveRosterVersion?:string;salaryModel?:{version:string;entries:{factId:string;annualCents:number}[]}};

const record=(v:unknown):v is Record<string,unknown>=>typeof v==="object"&&v!==null&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==="string"&&v.length>0;
const year=(v:unknown)=>Number.isInteger(v)&&Number(v)>=1950&&Number(v)<=9999;
const money=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const date=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(`${v}T00:00:00Z`))&&new Date(`${v}T00:00:00Z`).toISOString().slice(0,10)===v;
const role=(v:unknown)=>v==="race_driver"||v==="reserve_driver";
const team=(v:unknown)=>teams.some(team=>team.id===v);
const unique=(values:unknown[])=>new Set(values).size===values.length;

export function isContractDeskState(value:unknown):value is ContractDeskState{
  if(!record(value)||value.version!==1||!record(value.baseline)||!Array.isArray(value.drafts))return false;
  if(value.reserveRosterVersion!==undefined&&!text(value.reserveRosterVersion))return false;
  const b=value.baseline;
  if(!text(b.datasetId)||!year(b.season)||!date(b.asOfDate)||!date(b.capturedOn)||!Array.isArray(b.people)||!Array.isArray(b.facts)||!Array.isArray(b.slots))return false;
  if(!b.people.every(p=>record(p)&&text(p.id)&&text(p.name)&&(p.careerDriverId===null||text(p.careerDriverId)))||!unique(b.people.map(p=>p.id)))return false;
  const personIds=new Set(b.people.map(p=>p.id));
  if(!b.facts.every(f=>record(f)&&text(f.id)&&personIds.has(f.personId)&&team(f.teamId)&&role(f.role)&&["confirmed","reported","unconfirmed"].includes(String(f.status))&&(f.minimumEnd===null||year(f.minimumEnd))&&(f.exactEnd===null||year(f.exactEnd))&&!(f.minimumEnd!=null&&f.exactEnd!=null&&Number(f.exactEnd)<Number(f.minimumEnd))&&(f.salaryCents===null||money(f.salaryCents))&&typeof f.sourceUrl==="string"&&/^https:\/\//.test(f.sourceUrl)&&date(f.checkedOn)&&typeof f.notes==="string")||!unique(b.facts.map(f=>f.id)))return false;
  if(b.slots.length!==teams.length*4||!b.slots.every(s=>record(s)&&team(s.teamId)&&role(s.role)&&Number.isInteger(s.number)&&[1,2].includes(Number(s.number))&&(s.personId===null||personIds.has(s.personId))&&text(s.status))||!unique(b.slots.map(s=>`${s.teamId}:${s.role}:${s.number}`)))return false;
  const minimumRaceFacts=b.facts.filter(f=>f.role==="race_driver").length;
  if(minimumRaceFacts<teams.length*2)return false;
  const factIds=new Set(b.facts.map(f=>f.id));
  if(!b.facts.every(f=>f.scenarioTerms===undefined||(record(f.scenarioTerms)&&year(f.scenarioTerms.endSeason)&&Number(f.scenarioTerms.endSeason)>=Number(b.season)&&["published_exact","game_assumption"].includes(String(f.scenarioTerms.endBasis))&&["confirmed","game_assumption"].includes(String(f.scenarioTerms.seatBasis))&&(f.exactEnd===null||f.scenarioTerms.endSeason===f.exactEnd)&&(f.minimumEnd===null||Number(f.scenarioTerms.endSeason)>=Number(f.minimumEnd)))))return false;
  if(value.salaryModel!==undefined){
    const model=value.salaryModel;
    if(!record(model)||!text(model.version)||!Array.isArray(model.entries)||!unique(model.entries.map(e=>record(e)?e.factId:null))||!model.entries.every(e=>record(e)&&factIds.has(e.factId)&&money(e.annualCents)&&Number(e.annualCents)>0))return false;
  }
  if(!value.drafts.every(d=>record(d)&&text(d.id)&&team(d.teamId)&&personIds.has(d.personId)&&role(d.role)&&Number.isInteger(d.seat)&&[1,2].includes(Number(d.seat))&&year(d.startSeason)&&Number.isInteger(d.seasons)&&Number(d.seasons)>=1&&Number(d.seasons)<=5&&money(d.salaryCents)&&Number(d.salaryCents)>0&&Number.isSafeInteger(Number(d.salaryCents)*Number(d.seasons))&&date(d.createdOn)&&["draft","withdrawn"].includes(String(d.status))))return false;
  return unique(value.drafts.map(d=>d.id));
}

export function initializeContractDesk(career:CareerState,baseline:ContractBaseline):CareerState{
  if(career.contractDesk)return career; // Reference updates never rewrite a career's baseline.
  const desk:ContractDeskState={version:1,baseline:structuredClone(baseline),drafts:[]};
  if(!isContractDeskState(desk))throw new Error("The contract reference is incomplete or invalid. No career data was changed.");
  return ensureContractSalaries({...career,contractDesk:desk});
}

/** Add missing game assumptions only; imported facts, existing amounts and drafts are untouched. */
export function ensureContractSalaries(career:CareerState):CareerState{
  const desk=career.contractDesk;if(!desk)return career;
  const existing=desk.salaryModel?.entries??[];
  const additions=desk.baseline.facts.filter(f=>f.salaryCents===null&&!existing.some(e=>e.factId===f.id)).flatMap(f=>{
    const amount=assumedDriverSalary(f.personId,f.role)??assumedDriverSalary(desk.baseline.people.find(p=>p.id===f.personId)?.name??"",f.role);
    return amount===null?[]:[{factId:f.id,annualCents:amount}];
  });
  if(!additions.length)return career;
  return {...career,contractDesk:{...desk,salaryModel:{version:desk.salaryModel?.version??DRIVER_SALARY_MODEL_VERSION,entries:[...existing,...additions]}}};
}

export function contractSalary(desk:ContractDeskState,fact:ContractFact):{annualCents:number|null;basis:"reference"|"game_estimate"|"unrecorded"}{
  if(fact.salaryCents!==null)return {annualCents:fact.salaryCents,basis:"reference"};
  const assumption=desk.salaryModel?.entries.find(e=>e.factId===fact.id);
  return assumption?{annualCents:assumption.annualCents,basis:"game_estimate"}:{annualCents:null,basis:"unrecorded"};
}

export function saveContractDraft(career:CareerState,input:Omit<ContractDraft,"createdOn"|"status"|"teamId">):CareerState{
  if(!career.contractDesk)throw new Error("Set up the contract reference first.");
  const old=career.contractDesk.drafts.find(d=>d.id===input.id);
  if(old&&old.teamId!==career.player.teamId)throw new Error("You can only manage your own team's drafts.");
  if(old?.status==="withdrawn")throw new Error("A withdrawn draft cannot be overwritten. Create a new draft.");
  if(input.startSeason<career.season.year+1)throw new Error("Drafts must begin next season or later.");
  if(input.startSeason>career.season.year+5)throw new Error("Drafts can start at most five seasons ahead.");
  const draft:ContractDraft={...input,teamId:career.player.teamId,createdOn:old?.createdOn??career.clock.date,status:"draft"};
  const next={...career,contractDesk:{...career.contractDesk,drafts:[...career.contractDesk.drafts.filter(d=>d.id!==input.id),draft]}};
  if(!isContractDeskState(next.contractDesk))throw new Error("Choose a driver, a valid seat, one to five seasons and a positive annual salary in whole cents.");
  return next;
}

export function withdrawContractDraft(career:CareerState,id:string):CareerState{
  const desk=career.contractDesk;
  const draft=desk?.drafts.find(d=>d.id===id);
  if(!desk||!draft||draft.teamId!==career.player.teamId)throw new Error("This draft is not managed by your team.");
  if(draft.status==="withdrawn")return career;
  return {...career,contractDesk:{...desk,drafts:desk.drafts.map(d=>d.id===id?{...d,status:"withdrawn"}:d)}};
}

/** Draft conflicts are visible review issues, never implied acceptance or seat reservations. */
export function contractDraftIssues(career:CareerState,draft:ContractDraft):string[]{
  const desk=career.contractDesk;if(!desk)return ["Contract baseline is unavailable."];
  const issues:string[]=[];
  const end=draft.startSeason+draft.seasons-1;
  const facts=desk.baseline.facts.filter(f=>f.personId===draft.personId);
  if(!facts.length)issues.push("No resolved contract reference: availability requires review.");
  for(const fact of facts){
    if(fact.scenarioTerms){
      if(fact.scenarioTerms.endSeason>=draft.startSeason)issues.push(`Game contract covers ${fact.scenarioTerms.endSeason}; choose a later season or resolve the existing commitment.`);
      continue;
    }
    if(fact.status!=="confirmed")issues.push(`${fact.status} ${fact.role.replace("_"," ")} commitment: verify before making an offer.`);
    if(fact.exactEnd===null)issues.push("Exact expiry is undisclosed: do not assume this driver is available.");
    if((fact.exactEnd??fact.minimumEnd??desk.baseline.season)>=draft.startSeason)issues.push(`Published commitment covers at least ${fact.exactEnd??fact.minimumEnd??desk.baseline.season}; release or later coverage needs review.`);
  }
  for(const other of desk.drafts){
    if(other.id===draft.id||other.status!=="draft"||other.startSeason>end||other.startSeason+other.seasons-1<draft.startSeason)continue;
    if(other.personId===draft.personId)issues.push("Another draft proposes overlapping seasons for this driver.");
    if(other.teamId===draft.teamId&&other.role===draft.role&&other.seat===draft.seat)issues.push("Another draft targets the same seat in overlapping seasons.");
  }
  const occupant=desk.baseline.slots.find(s=>s.teamId===draft.teamId&&s.role===draft.role&&s.number===draft.seat)?.personId;
  if(occupant&&occupant!==draft.personId){
    const obligations=desk.baseline.facts.filter(f=>f.personId===occupant&&f.teamId===draft.teamId&&f.role===draft.role);
    if(!obligations.length||obligations.some(f=>f.scenarioTerms?f.scenarioTerms.endSeason>=draft.startSeason:f.exactEnd===null||f.exactEnd>=draft.startSeason))issues.push("The current reference seat holder's obligations must be resolved before replacement.");
  }
  if(draft.startSeason<=career.season.year)issues.push("The proposed start season has passed; revise this draft.");
  issues.push("Signing is unavailable until the finance and driver-acceptance systems are implemented.");
  return [...new Set(issues)];
}

export function parseContractSalary(value:string):number{
  if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error("Enter an annual USD salary with no more than two decimal places.");
  const [whole,cents=""]=value.split(".");
  const amount=Number(whole)*100+Number(cents.padEnd(2,"0"));
  if(!Number.isSafeInteger(amount)||amount<=0)throw new Error("Salary must be positive and within the supported range.");
  return amount;
}
