import assert from "node:assert/strict";
import test from "node:test";
import {createCareer,parseCareerState,simulateEntireWeekend,loadCareer,CAREER_STORAGE_KEY,CAREER_BACKUP_KEY,type CareerStorage} from "../lib/career";
import {createScenarioCareer} from "./fixtures/managementScenario";

test("new careers contain the season core without unimplemented management state",()=>{
  const career=createCareer("ferrari");
  assert.deepEqual(career.events,[]);assert.deepEqual(career.projects,[]);
  for(const key of ['comms','commercial','finance','carDev','facilities','market','weekendSim'] as const)assert.equal(career[key],undefined);
  assert.equal(career.season.calendar.rounds.length,24);
  assert.ok(career.workforce.people.length>0);
});

test("legacy cleanup removes unfinished management while preserving played races and a backup",async()=>{
  const scenario=createScenarioCareer("ferrari");
  const simulationValues=new Map<string,string>();
  const simulationStorage:CareerStorage={getItem:key=>simulationValues.get(key)??null,setItem:(key,value)=>{simulationValues.set(key,value);},removeItem:key=>{simulationValues.delete(key);}};
  const played=await simulateEntireWeekend(createCareer("ferrari"),scenario.season.calendar.rounds[0].id,undefined,simulationStorage);
  const customEmail={...scenario.comms!.emails[0],id:"generated-player-message",subject:"Project result",requiresDecision:false};
  const raw=JSON.stringify({...played,schemaVersion:6,
    events:[...scenario.events!,{...scenario.events![0],id:"player-meeting"}],
    projects:[...scenario.projects!,{...scenario.projects![0],id:"player-project",name:"My project"}],
    comms:{...scenario.comms!,emails:[...scenario.comms!.emails,customEmail]},
    commercial:scenario.commercial,
    clock:{...played.clock,status:"blocked",blockingEventId:"email-floor-delay"},
    scheduler:{...played.scheduler,pendingEvent:{...scenario.events![0],id:"email-floor-delay"}},
    finance:{...played.finance!,transactions:[{id:"tx-init-chassis-r&d",date:"2027-01-03",amount:-14200000,category:"car_development",description:"Demo",isCostCapExempt:false},{id:"player-spend",date:"2027-03-14",amount:-100,category:"car_development",description:"My project",isCostCapExempt:false}],costCapSpent:14200100},
  });
  const values=new Map([[CAREER_STORAGE_KEY,raw]]);
  const storage:CareerStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};
  const cleaned=loadCareer(storage)!;
  assert.equal(cleaned.schemaVersion,8);assert.equal(values.get(CAREER_BACKUP_KEY),raw);
  assert.equal(cleaned.clock.status,"paused");assert.equal(cleaned.clock.blockingEventId,null);assert.equal(cleaned.scheduler.pendingEvent,null);
  assert.deepEqual(cleaned.projects,[]);assert.deepEqual(cleaned.events,[]);
  for(const key of ['comms','commercial','finance','carDev','facilities','market','weekendSim'] as const)assert.equal(cleaned[key],undefined);
  assert.deepEqual(cleaned.season.calendar,played.season.calendar);
  assert.deepEqual(cleaned.weekendOperations,played.weekendOperations);
  assert.deepEqual(cleaned.championship,played.championship);
  assert.deepEqual(parseCareerState(JSON.stringify(cleaned)),cleaned);
});
