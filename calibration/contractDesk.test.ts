import assert from "node:assert/strict";
import {test} from "node:test";
import {createCareer,saveCareer,loadCareer,CAREER_STORAGE_KEY,type CareerStorage} from "../lib/career";
import {teams} from "../lib/data/grid";
import {initializeContractDesk,isContractDeskState,saveContractDraft,withdrawContractDraft,contractDraftIssues,parseContractSalary,ensureContractSalaries,contractSalary,type ContractBaseline,type ContractDraft} from "../lib/career/contracts";
import {assumedDriverSalary} from "../lib/career/driverSalaries";
import reference2027 from "../supabase/seed-data/2027-driver-contract-reference.json";

function baseline():ContractBaseline{
  return {datasetId:"test-reference",season:2027,asOfDate:"2026-10-25",capturedOn:"2027-01-04",
    people:teams.flatMap(t=>t.drivers.map(d=>({id:d.id,name:d.name,careerDriverId:d.id}))),
    facts:teams.flatMap(t=>t.drivers.map(d=>({id:`fact-${d.id}`,personId:d.id,teamId:t.id,role:"race_driver" as const,status:"confirmed" as const,minimumEnd:2027,exactEnd:2027,salaryCents:null,sourceUrl:"https://example.test/reference",checkedOn:"2026-10-25",notes:"Test fixture"}))),
    slots:teams.flatMap(t=>(["race_driver","reserve_driver"] as const).flatMap(role=>([1,2] as const).map(number=>({teamId:t.id,role,number,personId:role==="race_driver"?t.drivers[number-1].id:null,status:role==="race_driver"?"confirmed":"vacant"})))),
  };
}
function storage(){const values=new Map<string,string>();const store:CareerStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};return {values,store};}
function legacyCareer(){return {...createCareer("mclaren",{careerId:"contracts-test"}),contractDesk:undefined};}
function ready(){return initializeContractDesk(legacyCareer(),baseline());}
const input={id:"draft-1",personId:"norris",role:"race_driver" as const,seat:1 as const,startSeason:2028,seasons:2,salaryCents:123456789};

test("contract baseline is complete, frozen, saveable and never rewrites the roster",()=>{
  const original=legacyCareer();const reference=baseline();
  const initialized=initializeContractDesk(original,reference);
  reference.facts[0].notes="Changed upstream";
  assert.notEqual(initialized.contractDesk!.baseline.facts[0].notes,"Changed upstream");
  assert.equal(initializeContractDesk(initialized,baseline()),initialized);
  assert.deepEqual(initialized.workforce,original.workforce);
  assert.deepEqual(initialized.weekendOperations,original.weekendOperations);
  assert.equal(initialized.finance,undefined);
  const {store}=storage();const saved=saveCareer(initialized,store);
  assert.deepEqual(loadCareer(store)!.contractDesk,saved.contractDesk);
  const incomplete=baseline();incomplete.slots.pop();
  assert.throws(()=>initializeContractDesk(original,incomplete),/incomplete/);
});

test("drafts are idempotent, reversible planning records with exact cents",()=>{
  const original=ready();let state=saveContractDraft(original,input);
  state=saveContractDraft(state,{...input,seasons:3});
  assert.equal(state.contractDesk!.drafts.length,1);
  assert.equal(state.contractDesk!.drafts[0].seasons,3);
  assert.deepEqual(state.workforce,original.workforce);
  assert.deepEqual(state.clock,original.clock);
  assert.equal(state.finance,undefined);
  assert.equal(parseContractSalary("1234567.89"),123456789);
  for(const value of ["", "0", "-1", "1.001", "1e6", "12abc", "99999999999999999999"])assert.throws(()=>parseContractSalary(value));
  state=withdrawContractDraft(state,"draft-1");
  assert.equal(state.contractDesk!.drafts[0].status,"withdrawn");
  assert.equal(withdrawContractDraft(state,"draft-1"),state);
  assert.throws(()=>saveContractDraft(state,input),/withdrawn/);
});

test("unresolved terms and overlapping seat/driver drafts remain explicit review issues",()=>{
  let state=ready();
  const norris=state.contractDesk!.baseline.facts.find(f=>f.personId==="norris")!;
  norris.exactEnd=null;norris.minimumEnd=2030;
  state=saveContractDraft(state,input);
  state=saveContractDraft(state,{...input,id:"draft-2"});
  const issues=contractDraftIssues(state,state.contractDesk!.drafts[0]);
  assert.ok(issues.some(i=>i.includes("undisclosed")));
  assert.ok(issues.some(i=>i.includes("2030")));
  assert.ok(issues.some(i=>i.includes("overlapping seasons for this driver")));
  assert.ok(issues.some(i=>i.includes("same seat")));
  assert.ok(issues.some(i=>i.includes("Signing is unavailable")));
  assert.throws(()=>saveContractDraft(state,{...input,startSeason:2027}),/next season/);
  assert.throws(()=>saveContractDraft(state,{...input,seasons:6}),/one to five/);
  assert.throws(()=>saveContractDraft(state,{...input,personId:"missing"}),/Choose a driver/);
  assert.throws(()=>saveContractDraft(state,{...input,salaryCents:1.5}),/whole cents/);
});

test("reserve drafts support two positions without creating appointments",()=>{
  const original=ready();let state=saveContractDraft(original,{...input,role:"reserve_driver",seat:2});
  assert.equal(state.contractDesk!.drafts[0].role,"reserve_driver");
  assert.equal(state.contractDesk!.baseline.slots.filter(s=>s.teamId==="mclaren"&&s.role==="reserve_driver").length,2);
  assert.deepEqual(state.workforce,original.workforce);
  assert.throws(()=>saveContractDraft(state,{...input,seat:3 as 1}),/valid seat/);
  const invalid=structuredClone(state.contractDesk!);invalid.drafts[0].status="accepted" as ContractDraft["status"];
  assert.equal(isContractDeskState(invalid),false);
});

test("failed persistence leaves the last saved draft and career intact",()=>{
  const {values,store}=storage();const state=saveCareer(ready(),store);
  const previous=values.get(CAREER_STORAGE_KEY);
  const failing:CareerStorage={...store,setItem:(key,value)=>{if(key===CAREER_STORAGE_KEY)throw new Error("quota");store.setItem(key,value);}};
  assert.throws(()=>saveCareer(saveContractDraft(state,input),failing),/previous save is intact/);
  assert.equal(values.get(CAREER_STORAGE_KEY),previous);
  assert.equal(loadCareer(store)!.contractDesk!.drafts.length,0);
});

test("all published 2027 driver commitments have positive, role-specific game salary values",()=>{
  for(const fact of reference2027.contracts){
    const salary=assumedDriverSalary(fact.person_slug,fact.role);
    assert.ok(salary!==null&&Number.isSafeInteger(salary)&&salary>0,`${fact.person_slug} must have a salary`);
  }
  assert.equal(assumedDriverSalary("Leonardo Fornaroli","reserve_driver"),75_000_000);
  assert.equal(assumedDriverSalary("Leonardo Fornaroli","race_driver"),null);
  assert.equal(assumedDriverSalary("Unknown Driver","race_driver"),null);
});

test("salary backfill preserves sourced terms and existing saved salary assumptions",()=>{
  const original=ready();const sourceFacts=structuredClone(original.contractDesk!.baseline.facts);
  const legacy={...original,contractDesk:{...original.contractDesk!,salaryModel:undefined}};
  const backfilled=ensureContractSalaries(legacy);
  assert.ok(backfilled.contractDesk!.baseline.facts.every(f=>contractSalary(backfilled.contractDesk!,f).annualCents!==null));
  assert.deepEqual(backfilled.contractDesk!.baseline.facts,sourceFacts);
  assert.deepEqual(backfilled.workforce,legacy.workforce);
  assert.equal(ensureContractSalaries(backfilled),backfilled);
  const norris=backfilled.contractDesk!.baseline.facts.find(f=>f.personId==="norris")!;
  assert.equal(contractSalary(backfilled.contractDesk!,norris).basis,"game_estimate");
  backfilled.contractDesk!.salaryModel!.entries.find(e=>e.factId===norris.id)!.annualCents=12345;
  assert.equal(ensureContractSalaries(backfilled),backfilled);
  assert.equal(contractSalary(backfilled.contractDesk!,norris).annualCents,12345);
  norris.salaryCents=98765;
  assert.deepEqual(contractSalary(backfilled.contractDesk!,norris),{annualCents:98765,basis:"reference"});
  const {store}=storage();saveCareer(backfilled,store);
  assert.deepEqual(loadCareer(store)!.contractDesk!.salaryModel,backfilled.contractDesk!.salaryModel);
});
