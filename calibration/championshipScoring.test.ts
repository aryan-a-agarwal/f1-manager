import assert from "node:assert/strict";
import { teams } from "../lib/data/grid";
import { createCareer, pointsScale, processChampionshipEventsState } from "../lib/career";

assert.deepEqual(pointsScale("race",100),[25,18,15,12,10,8,6,4,2,1]);
assert.deepEqual(pointsScale("race",60),[19,14,12,10,8,6,4,3,2,1]);
assert.deepEqual(pointsScale("race",30),[13,10,8,6,5,4,3,2,1]);
assert.deepEqual(pointsScale("sprint",49),[]);
assert.deepEqual(pointsScale("sprint",50),[8,7,6,5,4,3,2,1]);
assert.deepEqual(pointsScale("race",100,1),[]);

const career=createCareer("ferrari",{careerId:"scoring-test",now:new Date("2026-09-01T12:00:00Z")});
const round=career.season.calendar.rounds[0];
const race=round.sessions.find((entry)=>entry.kind==="race")!;
const participants=teams.flatMap((team)=>team.drivers.map((driver)=>({teamId:team.id,teamName:team.name,driverId:driver.id,driverName:driver.name,abbreviation:driver.abbreviation,carNumber:driver.number})));
const output={schemaVersion:1 as const,id:"result-1",attemptId:"attempt-1",sessionId:race.id,completionMode:"simulated" as const,distancePercent:100,classification:participants.map((entry,index)=>({position:index+1,driverId:entry.driverId,status:"classified" as const,laps:58,timeMs:index===0?5400000:null,gapMs:index===0?0:index*1000})),provenance:"engine_generated" as const,engineId:"test-engine",engineVersion:"1",createdAt:"2027-03-14T15:30:00.000Z"};
const snapshot={id:"snapshot-1",schemaVersion:1 as const,careerId:career.metadata.careerId,season:2027,roundId:round.id,trackId:round.trackId,weekendNumber:round.weekendNumber,sprint:false,createdAt:"2027-03-12T10:00:00.000Z",rulesetVersion:"2026-format-v1" as const,participants,circuit:{lapLengthKm:5.278,raceLaps:58,raceDistanceKm:306.124,provenance:"official_fact" as const}};
const withResult={...career,weekendOperations:{...career.weekendOperations,snapshots:[snapshot],outputs:[output],outbox:[{id:"event-1",type:"SessionCompleted" as const,roundId:round.id,sessionId:race.id,resultId:output.id,createdAt:output.createdAt,status:"pending" as const}]}};
const processed=processChampionshipEventsState(withResult);
assert.equal(processed.championship.drivers.find((entry)=>entry.driverId===participants[0].driverId)?.points,25);
assert.equal(processed.championship.drivers.find((entry)=>entry.driverId===participants[1].driverId)?.points,18);
assert.equal(processed.championship.teams.find((entry)=>entry.teamId===participants[0].teamId)?.points,43);
assert.equal(processed.championship.processedResultIds.length,1);
assert.equal(processed.weekendOperations.outbox[0].status,"processed");
assert.deepEqual(processChampionshipEventsState(processed).championship,processed.championship);

console.log("Championship scoring calibration passed.");
