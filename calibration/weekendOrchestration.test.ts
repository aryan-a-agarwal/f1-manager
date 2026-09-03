import assert from "node:assert/strict";
import {
  acknowledgeOutboxEvent,
  advanceCareerWeekend,
  archiveWeekend,
  continueCareerToNextSession,
  createCareer,
  completeCurrentSeason,
  exportRacePackage,
  finishSessionAttempt,
  isPreparationAvailable,
  nextCalendarSession,
  prepareWeekendSession,
  processChampionshipEvents,
  recoverInterruptedSession,
  saveCareer,
  startSessionAttempt,
  startNextSeason,
  weekendIntegrityReport,
  type CareerState,
  type CareerStorage,
  type SessionEngine,
} from "../lib/career";

class MemoryStorage implements CareerStorage {
  private values = new Map<string,string>();
  getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}

async function main(){
const preparationStorage=new MemoryStorage();
let preparationCareer=saveCareer(createCareer("mclaren",{careerId:"preparation-test"}),preparationStorage);
const preparationAdvance=advanceCareerWeekend(preparationCareer,preparationStorage);
preparationCareer=preparationAdvance.career;
assert.equal(preparationCareer.clock.date,"2027-03-05");
assert.equal(preparationCareer.season.calendar.rounds[0].status,"preparation");
assert.equal(preparationCareer.clock.status,"paused");
const sessionAdvance=advanceCareerWeekend(preparationCareer,preparationStorage);
assert.equal(sessionAdvance.career.clock.status,"blocked");
assert.equal(sessionAdvance.reachedEvent?.id,"2027-round-01-practice_1");

const storage=new MemoryStorage();
let career=saveCareer(createCareer("ferrari",{careerId:"weekend-test",now:new Date("2026-09-01T12:00:00Z")}),storage);
assert.equal(isPreparationAvailable(career,"2027-round-01"),false);

let advance=continueCareerToNextSession(career,storage);
career=advance.career;
const firstId=advance.reachedEvent!.id;
career=prepareWeekendSession(career,firstId,storage,new Date("2027-03-12T10:00:00Z"));
assert.equal(career.weekendOperations.snapshots.length,1);
assert.equal(career.weekendOperations.snapshots[0].participants.length,22);
assert.equal(new Set(career.weekendOperations.snapshots[0].participants.map((entry)=>entry.teamId)).size,11);
assert.equal(career.weekendOperations.snapshots[0].circuit.lapLengthKm,5.278);
assert.equal(prepareWeekendSession(career,firstId,storage),career);

career=startSessionAttempt(career,firstId,undefined,storage,new Date("2027-03-12T10:01:00Z"));
const firstAttempt=career.weekendOperations.attempts[0];
assert.equal(firstAttempt.attemptNumber,1);
assert.equal(startSessionAttempt(career,firstId,undefined,storage),career);

career=recoverInterruptedSession(career,storage);
assert.equal(career.weekendOperations.attempts[0].status,"failed");
assert.equal(nextCalendarSession(career.season.calendar)?.session.status,"preparing");
career=startSessionAttempt(career,firstId,undefined,storage);
assert.equal(career.weekendOperations.attempts[1].attemptNumber,2);
assert.notEqual(career.weekendOperations.attempts[1].randomSeed,firstAttempt.randomSeed);

const invalidEngine:SessionEngine={
  id:"administrative-placeholder",version:"1.0.0",supports:()=>true,
  async run(input){return {schemaVersion:1,id:"invalid",attemptId:"wrong",sessionId:input.sessionId,completionMode:"administrative_placeholder",classification:[],distancePercent:null,provenance:"administrative_placeholder",engineId:this.id,engineVersion:this.version,createdAt:new Date().toISOString()};},
};
career=await finishSessionAttempt(career,firstId,invalidEngine,storage);
assert.equal(career.weekendOperations.attempts[1].status,"failed");
assert.equal(nextCalendarSession(career.season.calendar)?.session.status,"preparing");

career=startSessionAttempt(career,firstId,undefined,storage);
career=await finishSessionAttempt(career,firstId,undefined,storage);
assert.equal(nextCalendarSession(career.season.calendar)?.session.kind,"practice_2");
assert.equal(career.weekendOperations.outputs[0].classification.length,0);
assert.equal(career.weekendOperations.outputs[0].provenance,"administrative_placeholder");
assert.equal(career.weekendOperations.outbox[0].type,"SessionCompleted");
assert.doesNotThrow(()=>JSON.parse(exportRacePackage(career,firstId)));

async function completeNext(state:CareerState){
  const moved=continueCareerToNextSession(state,storage);
  const id=moved.reachedEvent!.id;
  let changed=prepareWeekendSession(moved.career,id,storage);
  changed=startSessionAttempt(changed,id,undefined,storage);
  return finishSessionAttempt(changed,id,undefined,storage);
}
for(let index=0;index<4;index++) career=await completeNext(career);
assert.equal(career.season.calendar.rounds[0].status,"race_completed");
assert.equal(career.weekendOperations.outbox.filter((entry)=>entry.type==="GrandPrixCompleted").length,1);
assert.equal(weekendIntegrityReport(career,"2027-round-01").valid,true);
assert.throws(()=>continueCareerToNextSession(career,storage),/Archive/);

career=archiveWeekend(career,"2027-round-01",storage);
assert.equal(career.season.calendar.rounds[0].status,"archived");
assert.equal(career.weekendOperations.activeWeekendId,null);
const pending=career.weekendOperations.outbox[0];
career=acknowledgeOutboxEvent(career,pending.id,storage);
assert.equal(career.weekendOperations.outbox[0].status,"processed");

while(nextCalendarSession(career.season.calendar)){
  career=await completeNext(career);
  const activeId=career.weekendOperations.activeWeekendId;
  const active=activeId?career.season.calendar.rounds.find((round)=>round.id===activeId):null;
  if(active?.status==="race_completed") career=archiveWeekend(career,active.id,storage);
}
assert.equal(career.weekendOperations.snapshots.length,24);
assert.equal(career.weekendOperations.outputs.length,120);
assert.equal(career.weekendOperations.outbox.filter((entry)=>entry.type==="GrandPrixCompleted").length,24);
assert.ok(career.season.calendar.rounds.every((round)=>round.status==="archived"));
assert.ok(career.season.calendar.rounds.every((round)=>weekendIntegrityReport(career,round.id).valid));
career=processChampionshipEvents(career,storage);
assert.ok(career.weekendOperations.outbox.every((entry)=>entry.status==="processed"));
assert.ok(career.championship.drivers.every((entry)=>entry.points===0));
career=completeCurrentSeason(career,storage);
career=startNextSeason(career,storage);
assert.equal(career.season.year,2028);
assert.equal(career.seasonHistory.length,1);
assert.equal(career.seasonHistory[0].results.length,120);

console.log("Weekend orchestration calibration passed.");
}

main().catch((error)=>{console.error(error);process.exitCode=1;});
