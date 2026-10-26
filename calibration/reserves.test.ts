import assert from "node:assert/strict";
import {test} from "node:test";
import seed from "../supabase/seed-data/2027-starting-grid.json";
import {createCareer,saveCareer,loadCareer,type CareerStorage} from "../lib/career";
import {ensureCareerReserves} from "../lib/career/reserves";
import {contractSalary,isContractDeskState,saveContractDraft} from "../lib/career/contracts";

test("all eleven teams have two paid reserves while the race championship remains 22 drivers",()=>{
  const career=createCareer("mclaren");const desk=career.contractDesk!;
  assert.equal(isContractDeskState(desk),true);
  assert.equal(desk.baseline.people.length,new Set(seed.contracts.map(r=>r.person_slug)).size);
  assert.equal(desk.baseline.facts.filter(f=>f.role==="reserve_driver").length,22);
  for(const lineup of career.workforce.lineups){
    assert.equal(lineup.reserveDriverIds?.filter(Boolean).length,2);
    assert.notEqual(lineup.reserveDriverIds![0],lineup.reserveDriverIds![1]);
    for(const [index,id] of lineup.reserveDriverIds!.entries()){
      assert.ok(!career.championship.drivers.some(d=>d.driverId===id));
      const agreement=career.workforce.agreements.find(a=>a.teamId===lineup.teamId&&a.role===`reserve_${index+1}`)!;
      assert.equal(agreement.personId,id);assert.ok(agreement.salary!>0);assert.equal(agreement.salaryBasis,"game_estimate");
      const source=seed.contracts.find(r=>r.team_id===lineup.teamId&&r.role==="reserve_driver"&&r.slot_number===index+1)!;
      assert.equal(agreement.salary,source.annual_salary_usd_cents);
      const fact=desk.baseline.facts.find(f=>f.teamId===lineup.teamId&&f.personId===source.person_slug&&f.role==="reserve_driver")!;
      assert.equal(contractSalary(desk,fact).annualCents,source.annual_salary_usd_cents);
    }
  }
  assert.equal(career.championship.drivers.length,22);
  assert.equal(new Set(career.workforce.people.map(p=>p.id)).size,career.workforce.people.length);
});

test("shared Tsunoda has one identity, two explicit retainers and no extra race entry",()=>{
  const career=createCareer("red-bull");
  assert.equal(career.workforce.people.filter(p=>p.name==="Yuki Tsunoda").length,1);
  const contracts=career.workforce.agreements.filter(a=>a.personId==="yuki-tsunoda");
  assert.equal(contracts.length,2);assert.equal(contracts.reduce((sum,a)=>sum+a.salary!,0),150_000_000);
  assert.deepEqual(contracts.map(a=>a.teamId).sort(),["racing-bulls","red-bull"]);
});

test("existing career reserve update is additive, preserves custom pay and drafts, and runs once",()=>{
  let legacy=createCareer("haas");const reserveIds=new Set(legacy.workforce.lineups.flatMap(l=>l.reserveDriverIds??[]));
  legacy.workforce={...legacy.workforce,people:legacy.workforce.people.filter(p=>!reserveIds.has(p.id)),agreements:legacy.workforce.agreements.filter(a=>!a.role.startsWith("reserve_")),lineups:legacy.workforce.lineups.map(({reserveDriverIds,...lineup})=>lineup)};
  const desk=legacy.contractDesk!;delete desk.reserveRosterVersion;
  desk.baseline.facts=desk.baseline.facts.filter(f=>f.role==="race_driver"||f.personId==="leonardo-fornaroli");
  desk.baseline.slots=desk.baseline.slots.map(s=>s.role==="reserve_driver"&&s.personId!=="leonardo-fornaroli"?{...s,personId:null,status:"vacant"}:s);
  const fornaroli=desk.baseline.facts.find(f=>f.personId==="leonardo-fornaroli")!;
  desk.salaryModel!.entries=desk.salaryModel!.entries.filter(e=>desk.baseline.facts.some(f=>f.id===e.factId));
  desk.salaryModel!.entries.find(e=>e.factId===fornaroli.id)!.annualCents=123456;
  legacy=saveContractDraft(legacy,{id:"saved-offer",personId:"oliver-bearman",role:"race_driver",seat:2,startSeason:2028,seasons:2,salaryCents:12300});
  const raceFacts=structuredClone(legacy.contractDesk!.baseline.facts.filter(f=>f.role==="race_driver"));
  const before=JSON.stringify({clock:legacy.clock,results:legacy.weekendOperations,championship:legacy.championship,drafts:legacy.contractDesk!.drafts,raceDrivers:legacy.workforce.lineups.map(l=>l.driverIds)});
  const updated=ensureCareerReserves(legacy);
  assert.notEqual(updated,legacy);assert.equal(ensureCareerReserves(updated),updated);
  assert.equal(JSON.stringify({clock:updated.clock,results:updated.weekendOperations,championship:updated.championship,drafts:updated.contractDesk!.drafts,raceDrivers:updated.workforce.lineups.map(l=>l.driverIds)}),before);
  assert.deepEqual(updated.contractDesk!.baseline.facts.filter(f=>f.role==="race_driver"),raceFacts);
  assert.equal(contractSalary(updated.contractDesk!,fornaroli).annualCents,123456);
  assert.equal(updated.contractDesk!.baseline.facts.filter(f=>f.role==="reserve_driver").length,22);
  const values=new Map<string,string>();const storage:CareerStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);},removeItem:k=>{values.delete(k);}};
  saveCareer(updated,storage);assert.deepEqual(loadCareer(storage)!.workforce,updated.workforce);
  assert.equal(legacy.workforce.lineups[0].reserveDriverIds,undefined);
});
