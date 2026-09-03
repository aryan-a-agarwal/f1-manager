import assert from "node:assert/strict";
import { appointDriver, appointTeamPrincipal, completeCurrentSeason, createCareer, seasonLineups, startNextSeason, type CareerStorage } from "../lib/career";

class MemoryStorage implements CareerStorage {private values=new Map<string,string>();getItem(key:string){return this.values.get(key)??null;}setItem(key:string,value:string){this.values.set(key,value);}removeItem(key:string){this.values.delete(key);}}
const storage=new MemoryStorage();
let career=createCareer("ferrari",{careerId:"lifecycle-test",now:new Date("2026-09-01T12:00:00Z")});
assert.equal(career.workforce.people.filter((entry)=>entry.kind==="driver").length,22);
assert.equal(career.workforce.people.filter((entry)=>entry.kind==="staff").length,11);
assert.equal(seasonLineups(career).length,11);
career=appointDriver(career,"ferrari",2,{id:"future-driver",name:"Future Driver",kind:"driver",carNumber:99},2028,storage);
career=appointTeamPrincipal(career,"ferrari",{id:"future-principal",name:"Future Principal",kind:"staff"},2028,storage);
const future=seasonLineups(career,2028).find((entry)=>entry.teamId==="ferrari")!;
assert.deepEqual(future.driverIds,["leclerc","future-driver"]);
assert.equal(future.teamPrincipalId,"future-principal");
assert.throws(()=>appointDriver(career,"mclaren",1,{id:"future-driver",name:"Future Driver",kind:"driver"},2028,storage),/already has a seat/);
career={...career,season:{...career.season,phase:"season",calendar:{...career.season.calendar,rounds:career.season.calendar.rounds.map((round)=>({...round,status:"archived"}))}}};
career=completeCurrentSeason(career,storage,new Date("2027-12-20T12:00:00Z"));
assert.equal(career.season.phase,"offseason");
assert.equal(career.seasonHistory.length,1);
assert.equal(career.seasonHistory[0].calendar.rounds.length,24);
career=startNextSeason(career,storage,new Date("2028-01-01T12:00:00Z"));
assert.equal(career.season.year,2028);
assert.equal(career.season.phase,"preseason");
assert.equal(career.clock.date,"2028-01-04");
assert.equal(career.season.calendar.rounds[0].weekendId,"2028-W10");
assert.equal(career.championship.year,2028);
assert.equal(career.championship.drivers.find((entry)=>entry.driverId==="future-driver")?.teamId,"ferrari");
assert.equal(career.weekendOperations.outputs.length,0);
assert.equal(career.seasonHistory.length,1);

console.log("Season lifecycle and workforce calibration passed.");
