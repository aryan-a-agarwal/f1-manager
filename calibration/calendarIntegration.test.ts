import {createScenarioCareer as createCareer} from "./fixtures/managementScenario";
import assert from "node:assert/strict";
import test from "node:test";
import { createCareer as createPlainCareer, advanceCareerSchedule, advanceCareerOneDay, advanceCareerNextEvent, resolveTimelineEvent,
  simulateEntireWeekend, chooseEmailDecision, generateSeasonCalendar, isSeasonCalendar, parseCareerState,
  saveCareer, loadCareer, CAREER_STORAGE_KEY, CAREER_BACKUP_KEY, CareerSaveError, STANDARD_SESSIONS,
  advanceCareerNextRaceWeekend, simulateNextSession, resolveBlockingEvent, postponeCalendarSession,
  type CareerState, type CareerStorage } from "../lib/career";

class MemoryStorage implements CareerStorage {
  values=new Map<string,string>(); fail=false;
  getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){if(this.fail&&key===CAREER_STORAGE_KEY)throw new Error("Quota exceeded");this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}
function quiet():CareerState {
  const career=createCareer("ferrari",{careerId:"calendar-regression"});
  return {...career,events:[],comms:{...career.comms!,emails:[]},stopSettings:{carDevelopment:false,contracts:false,sponsorOffers:false,staffMeetings:false,majorNews:false,financialWarnings:false}};
}
function resolve(career:CareerState,storage:CareerStorage){
  const id=career.clock.blockingEventId!;
  const email=career.comms?.emails.find(item=>item.id===id);
  return email?chooseEmailDecision(career,id,email.decisionChoices![0].id,storage):resolveTimelineEvent(career,id,storage);
}

test("calendar profiles preserve format and support Saturday races and venue time zones",()=>{
  const profile={id:"saturday-test",version:2,label:"Test",rounds:[{trackId:"albert-park",grandPrixName:"Test GP",location:"Melbourne",weekendNumber:10,startDate:"2027-03-11",sessions:[...STANDARD_SESSIONS]}]};
  const calendar=generateSeasonCalendar(2027,profile);
  assert.equal(calendar.rounds.length,1);
  assert.equal(calendar.rounds[0].weekendEndDate,"2027-03-13");
  assert.equal(calendar.rounds[0].venueTimeZone,"Australia/Melbourne");
  assert.equal(calendar.timeBasis,"UTC");assert.equal(isSeasonCalendar(calendar),true);
  const invalid=structuredClone(calendar);invalid.rounds[0].sessions[1].minuteOfDay=500;
  assert.equal(isSeasonCalendar(invalid),false);
  assert.throws(()=>generateSeasonCalendar(2027,{...profile,rounds:[{...profile.rounds[0],trackId:"unknown-circuit"}]}));
  assert.ok(generateSeasonCalendar(2028).rounds.every(round=>round.sessions.every(session=>session.date.startsWith("2028-"))));
});

test("simultaneous and overdue blockers remain actionable without reversing time",()=>{
  const storage=new MemoryStorage();let career=quiet();career.projects=[];
  career.events=["a","b"].map(id=>({id,title:id,date:"2027-01-05",minuteOfDay:540,category:"contracts",severity:"mandatory"}));
  const first=advanceCareerNextEvent(career,storage);assert.equal(first.career.clock.blockingEventId,"a");
  const second=advanceCareerNextEvent(resolveTimelineEvent(first.career,"a",storage),storage);
  assert.equal(second.career.clock.blockingEventId,"b");assert.equal(second.career.clock.date,"2027-01-05");
  career={...career,clock:{...career.clock,date:"2027-01-10"}};
  const overdue=advanceCareerNextEvent(career,storage);assert.equal(overdue.career.clock.date,"2027-01-10");assert.equal(overdue.career.clock.blockingEventId,"a");
});

test("quick GP stops for decisions and cannot bypass them by acknowledgement",async()=>{
  const storage=new MemoryStorage();let career=createCareer("ferrari");const roundId=career.season.calendar.rounds[0].id;
  career=await simulateEntireWeekend(career,roundId,undefined,storage);
  assert.equal(career.clock.blockingEventId,"evt-2027-tech-meeting");assert.equal(career.weekendOperations.outputs.length,0);
  career=resolve(career,storage);career=await simulateEntireWeekend(career,roundId,undefined,storage);
  assert.equal(career.clock.blockingEventId,"email-floor-delay");assert.throws(()=>resolveTimelineEvent(career,"email-floor-delay",storage),/required decision/);
  const choice=career.comms!.emails.find(email=>email.id==="email-floor-delay")!.decisionChoices![0].id;
  career=chooseEmailDecision(career,"email-floor-delay",choice,storage);
  const repeated=chooseEmailDecision(career,"email-floor-delay",choice,storage);assert.equal(repeated,career);
  for(let count=0;count<40&&career.season.calendar.rounds[0].status!=="archived";count++){
    career=await simulateEntireWeekend(career,roundId,undefined,storage);
    if(career.clock.status==="blocked"&&!career.clock.blockingEventId!.includes("round-"))career=resolve(career,storage);
  }
  assert.equal(career.season.calendar.rounds[0].status,"archived");
  assert.equal(career.championship.drivers.reduce((sum,driver)=>sum+driver.points,0),101);
  assert.equal(career.events!.find(event=>event.id==="evt-2027-fia-homologation")!.resolved,true);
});

test("daily and jump progression produce identical completed work without auto-fitting",()=>{
  const initial=quiet();initial.facilities!.facilities.factory={...initial.facilities!.facilities.factory,upgradeInConstruction:true,upgradeTargetLevel:4,upgradeCompletionDate:"2027-01-20"};
  const aStore=new MemoryStorage(),bStore=new MemoryStorage();let daily=structuredClone(initial);
  while(daily.clock.date<"2027-02-28")daily=advanceCareerOneDay(daily,aStore).career;
  const jumped=advanceCareerSchedule(initial,{type:"target",target:{date:"2027-02-28",minuteOfDay:540}},bStore).career;
  assert.deepEqual(daily.projects,jumped.projects);assert.deepEqual(daily.carDev,jumped.carDev);assert.deepEqual(daily.facilities,jumped.facilities);
  assert.equal(jumped.carDev!.inventory.length,8);assert.equal(jumped.facilities!.facilities.factory.level,4);
  assert.equal(jumped.facilities!.facilities.factory.upgradeInConstruction,false);
  assert.equal(jumped.carDev!.inventory.filter(part=>part.id.startsWith("part-proj-")).every(part=>!part.fittedCar1&&!part.fittedCar2),true);
  const repeat=advanceCareerSchedule(jumped,{type:"target",target:{date:"2027-03-01",minuteOfDay:540}},bStore).career;
  assert.equal(repeat.carDev!.inventory.length,8);
});

test("legacy partial careers migrate without rewriting played dates or results",async()=>{
  const storage=new MemoryStorage();let career=quiet();career.projects=[];
  career=await simulateEntireWeekend(career,career.season.calendar.rounds[0].id,undefined,storage);
  const raw=JSON.stringify({...career,schemaVersion:5,scheduler:undefined});const migrated=parseCareerState(raw)!;
  assert.ok(migrated);assert.equal(migrated.schemaVersion,8);
  assert.deepEqual(migrated.season.calendar.rounds,career.season.calendar.rounds);
  assert.deepEqual(migrated.weekendOperations.outputs,career.weekendOperations.outputs);
  assert.deepEqual(migrated.championship,career.championship);assert.deepEqual(migrated.clock,career.clock);
  assert.equal(migrated.metadata.careerId,career.metadata.careerId);
});

test("save failure and invalid imports preserve retained data",()=>{
  const storage=new MemoryStorage();const saved=saveCareer(quiet(),storage);const original=storage.getItem(CAREER_STORAGE_KEY);
  storage.fail=true;assert.throws(()=>saveCareer(saved,storage),CareerSaveError);assert.equal(storage.getItem(CAREER_STORAGE_KEY),original);
  storage.fail=false;storage.setItem(CAREER_STORAGE_KEY,"{invalid");storage.setItem(CAREER_BACKUP_KEY,"{invalid-backup");
  assert.throws(()=>loadCareer(storage),CareerSaveError);assert.equal(storage.getItem(CAREER_STORAGE_KEY),"{invalid");
});

test("sessions cannot be acknowledged away and next-weekend works mid-weekend",async()=>{
  const storage=new MemoryStorage();let career=quiet();career.projects=[];
  career=advanceCareerNextRaceWeekend(career,storage).career;
  const first=career.season.calendar.rounds[0].sessions[0];
  assert.equal(career.clock.blockingEventId,first.id);
  assert.throws(()=>resolveTimelineEvent(career,first.id,storage),/session/);
  assert.throws(()=>resolveBlockingEvent(career,first.id,storage),/session/);
  career=await simulateNextSession(career,undefined,storage);
  assert.equal(career.season.calendar.rounds[0].sessions[0].status,"completed");
  career=advanceCareerNextRaceWeekend(career,storage).career;
  assert.equal(career.clock.blockingEventId,career.season.calendar.rounds[0].sessions[1].id);
  assert.equal(career.clock.minuteOfDay,840);
});

test("postponement preserves valid order, updates the schedule and survives reload",()=>{
  const storage=new MemoryStorage();let career=quiet();career.projects=[];
  career=advanceCareerNextRaceWeekend(career,storage).career;
  const session=career.season.calendar.rounds[0].sessions[0];
  assert.throws(()=>postponeCalendarSession(career,session.id,{date:session.date,minuteOfDay:900},storage),/overlap/);
  career=postponeCalendarSession(career,session.id,{date:session.date,minuteOfDay:630},storage);
  assert.equal(career.clock.status,"paused");assert.equal(loadCareer(storage)!.season.calendar.rounds[0].sessions[0].minuteOfDay,630);
});
