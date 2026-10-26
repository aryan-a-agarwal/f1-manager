import assert from "node:assert/strict";
import {test} from "node:test";
import seed from "../supabase/seed-data/2027-starting-grid.json";
import {teams} from "../lib/data/grid";
import {createCareer,saveCareer,loadCareer,type CareerStorage} from "../lib/career";
import {contractSalary,contractDraftIssues,isContractDeskState,type ContractDraft} from "../lib/career/contracts";

test("new saves match all 22 database starting seats: 19 confirmed and three continuations",()=>{
  const career=createCareer("haas");const desk=career.contractDesk!;
  assert.equal(desk.baseline.datasetId,seed.dataset_id);
  const race=seed.contracts.filter(r=>r.role==="race_driver");
  assert.equal(race.length,22);assert.equal(new Set(race.map(r=>r.person_slug)).size,22);
  assert.equal(race.filter(r=>r.seat_basis==="confirmed").length,19);
  assert.deepEqual(race.filter(r=>r.seat_basis==="game_assumption").map(r=>r.driver_id).sort(),["bearman","lawson","lindblad"]);
  assert.deepEqual(career.workforce.lineups.find(l=>l.teamId==="haas")!.driverIds,["camara","bearman"]);
  assert.equal(career.championship.drivers.length,22);
  assert.ok(career.championship.drivers.some(d=>d.driverId==="camara"));assert.ok(!career.championship.drivers.some(d=>d.driverId==="ocon"));
  for(const row of race){
    assert.equal(teams.find(t=>t.id===row.team_id)!.drivers[row.slot_number-1].id,row.driver_id);
    assert.equal(career.workforce.lineups.find(l=>l.teamId===row.team_id)!.driverIds[row.slot_number-1],row.driver_id);
    const agreement=career.workforce.agreements.find(a=>a.personId===row.driver_id)!;
    assert.equal(agreement.endSeason,row.end_season);assert.equal(agreement.salary,row.annual_salary_usd_cents);
    assert.equal(agreement.termBasis,row.term_basis);assert.equal(agreement.salaryBasis,"game_estimate");
  }
  assert.equal(desk.baseline.slots.filter(s=>s.role==="reserve_driver").length,22);
});

test("all starting terms and salaries match the database export while preserving reference uncertainty",()=>{
  const career=createCareer("mclaren");const desk=career.contractDesk!;
  assert.equal(isContractDeskState(desk),true);
  for(const row of seed.contracts){
    const fact=desk.baseline.facts.find(f=>f.personId===row.person_slug)!;
    assert.equal(fact.salaryCents,null);
    assert.equal(fact.exactEnd,row.reference_exact_end);
    assert.equal(fact.scenarioTerms!.endSeason,row.end_season);
    assert.equal(fact.scenarioTerms!.seatBasis,row.seat_basis);
    assert.equal(contractSalary(desk,fact).annualCents,row.annual_salary_usd_cents);
  }
  const draft:ContractDraft={id:"test",personId:"lando-norris",role:"race_driver",seat:1,teamId:"mclaren",startSeason:2028,seasons:1,salaryCents:100,createdOn:career.clock.date,status:"draft"};
  const issues=contractDraftIssues(career,draft);
  assert.ok(issues.some(i=>i.includes("Game contract covers 2030")));
  assert.ok(!issues.some(i=>i.includes("undisclosed")),"Explicit scenario terms resolve the game expiry without rewriting the public fact");
});

test("existing saved lineups are loaded without applying the new starting grid",()=>{
  const legacy=createCareer("haas");delete legacy.contractDesk;
  const camara=legacy.workforce.people.find(p=>p.id==="camara")!;camara.id="ocon";camara.name="Esteban Ocon";camara.carNumber=31;
  legacy.workforce.lineups.find(l=>l.teamId==="haas")!.driverIds[0]="ocon";
  const values=new Map<string,string>();const storage:CareerStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);},removeItem:k=>{values.delete(k);}};
  saveCareer(legacy,storage);const loaded=loadCareer(storage)!;
  assert.equal(loaded.contractDesk,undefined);
  assert.equal(loaded.workforce.lineups.find(l=>l.teamId==="haas")!.driverIds[0],"ocon");
  assert.equal(loaded.workforce.people.find(p=>p.id==="ocon")!.name,"Esteban Ocon");
});
