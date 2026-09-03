import { teams } from "@/lib/data/grid";
import { circuitRaceFacts } from "@/lib/data/circuitFacts";
import { saveCareer, type CareerStorage } from "./storage";
import type { CalendarRound, CareerState, DomainEvent, SessionAttempt, SessionInput, SessionOutput, WeekendSnapshot, WeekendStatus } from "./types";
import { advanceCareerTime, fromGameMinute, toGameMinute, type ScheduledGameEvent } from "./gameTime";
import { administrativeSessionEngine, type SessionEngine, validateSessionOutput } from "./sessionEngine";

function findSession(career:CareerState, sessionId:string) {
  for (const round of career.season.calendar.rounds) {
    const index=round.sessions.findIndex((entry)=>entry.id===sessionId);
    if(index>=0) return {round,index,session:round.sessions[index]};
  }
  throw new Error("Calendar session not found.");
}

function replaceRound(career:CareerState, changed:CalendarRound):CareerState {
  return {...career,season:{...career.season,calendar:{...career.season.calendar,rounds:career.season.calendar.rounds.map((round)=>round.id===changed.id?changed:round)}}};
}

function replaceSession(career:CareerState, sessionId:string, changes:Record<string,unknown>, roundStatus?:WeekendStatus) {
  const {round}=findSession(career,sessionId);
  return replaceRound(career,{...round,status:roundStatus??round.status,sessions:round.sessions.map((entry)=>entry.id===sessionId?{...entry,...changes}:entry)});
}

function stableSeed(value:string) {
  let hash=2166136261;
  for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}

function makeSnapshot(career:CareerState, round:CalendarRound, now:Date):WeekendSnapshot {
  const circuit=circuitRaceFacts[round.trackId];
  if(!circuit) throw new Error(`Circuit facts are unavailable for ${round.trackId}.`);
  const lineups=career.workforce.lineups.filter((entry)=>entry.season===career.season.year);
  const participants=lineups.flatMap((lineup)=>lineup.driverIds.map((driverId)=>{const person=career.workforce.people.find((entry)=>entry.id===driverId);if(!person)throw new Error(`Driver record ${driverId} is missing.`);return {teamId:lineup.teamId,teamName:teams.find((team)=>team.id===lineup.teamId)?.name??lineup.teamId,driverId,driverName:person.name,abbreviation:teams.flatMap((team)=>team.drivers).find((driver)=>driver.id===driverId)?.abbreviation??driverId.slice(0,3).toUpperCase(),carNumber:person.carNumber};}));
  if(participants.length!==22 || new Set(participants.map((entry)=>entry.driverId)).size!==22) throw new Error("A weekend requires 22 unique drivers.");
  return {id:`${career.metadata.careerId}-${round.id}-snapshot`,schemaVersion:1,careerId:career.metadata.careerId,season:career.season.year,roundId:round.id,trackId:round.trackId,weekendNumber:round.weekendNumber,sprint:round.sprint,createdAt:now.toISOString(),rulesetVersion:"2026-format-v1",participants,circuit:{...circuit,provenance:"official_fact"}};
}

function priorSessionsResolved(career:CareerState, sessionId:string) {
  const sessions=career.season.calendar.rounds.flatMap((round)=>round.sessions);
  const index=sessions.findIndex((entry)=>entry.id===sessionId);
  return index>=0 && sessions.slice(0,index).every((entry)=>entry.status==="completed"||entry.status==="cancelled");
}

export function prepareWeekendSession(career:CareerState, sessionId:string, storage?:CareerStorage, now=new Date()) {
  const {round,session}=findSession(career,sessionId);
  if(session.status==="preparing") return career;
  if(career.clock.status!=="blocked"||career.clock.blockingEventId!==sessionId) throw new Error("The career clock has not reached this session.");
  if(session.status!=="scheduled"&&session.status!=="available") throw new Error("This session cannot enter preparation.");
  if(!priorSessionsResolved(career,sessionId)) throw new Error("Earlier sessions must be resolved first.");
  if(career.weekendOperations.activeWeekendId&&career.weekendOperations.activeWeekendId!==round.id) throw new Error("Another weekend is active.");
  let snapshot=career.weekendOperations.snapshots.find((entry)=>entry.roundId===round.id);
  if(!snapshot) snapshot=makeSnapshot(career,round,now);
  let changed=replaceSession(career,sessionId,{status:"preparing"},round.status==="scheduled"?"entered":"weekend_active");
  changed={...changed,season:{...changed.season,phase:"season",currentEventId:sessionId},weekendOperations:{...changed.weekendOperations,activeWeekendId:round.id,activeSessionId:sessionId,snapshots:changed.weekendOperations.snapshots.some((entry)=>entry.id===snapshot.id)?changed.weekendOperations.snapshots:[...changed.weekendOperations.snapshots,snapshot]}};
  return saveCareer(changed,storage,now);
}

export function startSessionAttempt(career:CareerState, sessionId:string, engine:SessionEngine=administrativeSessionEngine, storage?:CareerStorage, now=new Date()) {
  const {round,session}=findSession(career,sessionId);
  if(session.status==="running"&&career.weekendOperations.attempts.some((entry)=>entry.sessionId===sessionId&&entry.status==="running")) return career;
  if(session.status!=="preparing") throw new Error("The session is not prepared.");
  if(!engine.supports(session.kind)) throw new Error(`${engine.id} does not support ${session.kind}.`);
  if(career.weekendOperations.attempts.some((entry)=>entry.sessionId===sessionId&&entry.status==="running")) throw new Error("This session already has an active attempt.");
  const snapshot=career.weekendOperations.snapshots.find((entry)=>entry.roundId===round.id);
  if(!snapshot) throw new Error("The weekend snapshot is missing.");
  const attemptNumber=career.weekendOperations.attempts.filter((entry)=>entry.sessionId===sessionId).length+1;
  const attemptId=`${sessionId}-attempt-${attemptNumber}`;
  const inputId=`${attemptId}-input`;
  const seed=stableSeed(`${career.metadata.careerId}|${career.season.year}|${round.id}|${sessionId}|${attemptNumber}`);
  const input:SessionInput={schemaVersion:1,id:inputId,sessionId,roundId:round.id,snapshotId:snapshot.id,sessionKind:session.kind,participantIds:snapshot.participants.map((entry)=>entry.driverId),randomSeed:seed,engineId:engine.id,engineVersion:engine.version,instructions:{runPlan:"neutral",startingTyre:null,pitPlan:null,provenance:"player_selected"},provenance:"system_derived"};
  const attempt:SessionAttempt={id:attemptId,sessionId,inputId,attemptNumber,status:"running",engineId:engine.id,engineVersion:engine.version,randomSeed:seed,inputChecksum:stableSeed(JSON.stringify(input)).toString(16).padStart(8,"0"),startedAt:now.toISOString(),completedAt:null,failureReason:null};
  let changed=replaceSession(career,sessionId,{status:"running"},"weekend_active");
  changed={...changed,weekendOperations:{...changed.weekendOperations,inputs:[...changed.weekendOperations.inputs,input],attempts:[...changed.weekendOperations.attempts,attempt]}};
  return saveCareer(changed,storage,now);
}

function finalRoundStatus(round:CalendarRound, sessionId:string):WeekendStatus {
  const session=round.sessions.find((entry)=>entry.id===sessionId);
  if(session?.kind==="race") return "race_completed";
  if(session?.kind==="qualifying") return "race_ready";
  if(session?.kind==="practice_3"||session?.kind==="sprint") return "practice_completed";
  return "weekend_active";
}

function event(id:string,type:DomainEvent["type"],roundId:string,sessionId:string|null,resultId:string|null,now:Date):DomainEvent {
  return {id,type,roundId,sessionId,resultId,createdAt:now.toISOString(),status:"pending"};
}

export async function finishSessionAttempt(career:CareerState, sessionId:string, engine:SessionEngine=administrativeSessionEngine, storage?:CareerStorage, now=new Date()) {
  const {round,session}=findSession(career,sessionId);
  if(session.status==="completed"&&career.weekendOperations.outputs.some((entry)=>entry.sessionId===sessionId)) return career;
  if(session.status!=="running") throw new Error("The session is not running.");
  const attempt=career.weekendOperations.attempts.find((entry)=>entry.sessionId===sessionId&&entry.status==="running");
  if(!attempt) throw new Error("The active session attempt is missing.");
  const input=career.weekendOperations.inputs.find((entry)=>entry.id===attempt.inputId);
  if(!input) throw new Error("The session input is missing.");
  if(engine.id!==attempt.engineId||engine.version!==attempt.engineVersion) throw new Error("The selected engine does not match the attempt.");
  let processing=replaceSession(career,sessionId,{status:"processing"});
  let output:SessionOutput;
  try { output=await engine.run(input); }
  catch(error) { return failSessionAttempt(processing,attempt.id,error instanceof Error?error.message:"Engine failure",storage,now); }
  if(!validateSessionOutput(input,output)) return failSessionAttempt(processing,attempt.id,"Engine output validation failed.",storage,now);
  const attempts=processing.weekendOperations.attempts.map((entry)=>entry.id===attempt.id?{...entry,status:"completed" as const,completedAt:now.toISOString()}:entry);
  let changed=replaceSession(processing,sessionId,{status:"completed",resultId:output.id},finalRoundStatus(round,sessionId));
  const outbox=[...changed.weekendOperations.outbox,event(`${output.id}-completed`,"SessionCompleted",round.id,sessionId,output.id,now)];
  if(session.kind==="race") outbox.push(event(`${output.id}-grand-prix`,"GrandPrixCompleted",round.id,sessionId,output.id,now));
  changed={...changed,clock:{...changed.clock,status:"paused",blockingEventId:null},weekendOperations:{...changed.weekendOperations,activeSessionId:null,attempts,outputs:[...changed.weekendOperations.outputs,output],outbox}};
  return saveCareer(changed,storage,now);
}

export function failSessionAttempt(career:CareerState,attemptId:string,reason:string,storage?:CareerStorage,now=new Date()) {
  const attempt=career.weekendOperations.attempts.find((entry)=>entry.id===attemptId);
  if(!attempt||attempt.status!=="running") throw new Error("Running attempt not found.");
  let changed=replaceSession(career,attempt.sessionId,{status:"preparing"});
  changed={...changed,weekendOperations:{...changed.weekendOperations,attempts:changed.weekendOperations.attempts.map((entry)=>entry.id===attemptId?{...entry,status:"failed" as const,completedAt:now.toISOString(),failureReason:reason}:entry)}};
  return saveCareer(changed,storage,now);
}

export function recoverInterruptedSession(career:CareerState,storage?:CareerStorage) {
  const running=career.weekendOperations.attempts.find((entry)=>entry.status==="running");
  return running?failSessionAttempt(career,running.id,"Interrupted session recovered after reload.",storage):career;
}

export function archiveWeekend(career:CareerState,roundId:string,storage?:CareerStorage,now=new Date()) {
  const round=career.season.calendar.rounds.find((entry)=>entry.id===roundId);
  if(round?.status==="archived") return career;
  if(!round||round.status!=="race_completed") throw new Error("Only a completed race weekend can be archived.");
  let changed=replaceRound(career,{...round,status:"archived"});
  changed={...changed,weekendOperations:{...changed.weekendOperations,activeWeekendId:null,activeSessionId:null,outbox:[...changed.weekendOperations.outbox,event(`${roundId}-archived`,"WeekendArchived",roundId,null,null,now)]}};
  return saveCareer(changed,storage,now);
}

export function cancelCalendarSession(career:CareerState,sessionId:string,storage?:CareerStorage,now=new Date()) {
  const {round,session}=findSession(career,sessionId);
  if(session.kind==="race") throw new Error("Race cancellation requires the future sporting-results system.");
  if(session.status==="completed"||session.status==="cancelled") return career;
  if(!priorSessionsResolved(career,sessionId)) throw new Error("Earlier sessions must be resolved first.");
  let changed=replaceSession(career,sessionId,{status:"cancelled"},"weekend_active");
  if(changed.clock.blockingEventId===sessionId) changed={...changed,clock:{...changed.clock,status:"paused",blockingEventId:null},weekendOperations:{...changed.weekendOperations,activeSessionId:null}};
  return saveCareer(changed,storage,now);
}

export function postponeCalendarSession(career:CareerState,sessionId:string,target:{date:string;minuteOfDay:number},storage?:CareerStorage,now=new Date()) {
  const {round,session,index}=findSession(career,sessionId);
  if(session.status==="completed"||session.status==="cancelled") throw new Error("A resolved session cannot be postponed.");
  const targetValue=toGameMinute(target);
  const current=toGameMinute({date:career.clock.date,minuteOfDay:career.clock.minuteOfDay});
  if(targetValue<=current) throw new Error("A postponed session must be in the future.");
  const following=round.sessions[index+1];
  if(following&&targetValue>=toGameMinute({date:following.date,minuteOfDay:following.minuteOfDay})) throw new Error("A postponed session cannot overlap the next session.");
  let changed=replaceSession(career,sessionId,{status:"scheduled",date:target.date,minuteOfDay:target.minuteOfDay});
  if(changed.clock.blockingEventId===sessionId) changed={...changed,clock:{...changed.clock,status:"paused",blockingEventId:null},weekendOperations:{...changed.weekendOperations,activeSessionId:null}};
  return saveCareer(changed,storage,now);
}

export function acknowledgeOutboxEvent(career:CareerState,eventId:string,storage?:CareerStorage,now=new Date()) {
  const pending=career.weekendOperations.outbox.find((entry)=>entry.id===eventId);
  if(!pending) throw new Error("Outbox event not found.");
  if(pending.status==="processed") return career;
  return saveCareer({...career,weekendOperations:{...career.weekendOperations,outbox:career.weekendOperations.outbox.map((entry)=>entry.id===eventId?{...entry,status:"processed"}:entry)}},storage,now);
}

export function weekendIntegrityReport(career:CareerState,roundId:string) {
  const round=career.season.calendar.rounds.find((entry)=>entry.id===roundId);
  const snapshot=career.weekendOperations.snapshots.find((entry)=>entry.roundId===roundId);
  const issues:string[]=[];
  if(!round) issues.push("Round missing.");
  if(!snapshot) issues.push("Weekend snapshot missing.");
  if(snapshot&&(snapshot.participants.length!==22||new Set(snapshot.participants.map((entry)=>entry.driverId)).size!==22)) issues.push("Participant snapshot is invalid.");
  if(round?.sessions.some((entry)=>entry.status!=="completed"&&entry.status!=="cancelled")) issues.push("One or more sessions are unresolved.");
  if(round?.sessions.some((entry)=>entry.status==="completed"&&!entry.resultId)) issues.push("A completed session has no result.");
  return {roundId,valid:issues.length===0,issues,pendingOutboxEvents:career.weekendOperations.outbox.filter((entry)=>entry.roundId===roundId&&entry.status==="pending").length};
}

export function exportRacePackage(career:CareerState,sessionId:string) {
  const attempt=career.weekendOperations.attempts.filter((entry)=>entry.sessionId===sessionId).at(-1);
  const input=attempt&&career.weekendOperations.inputs.find((entry)=>entry.id===attempt.inputId);
  const snapshot=input&&career.weekendOperations.snapshots.find((entry)=>entry.id===input.snapshotId);
  const output=attempt&&career.weekendOperations.outputs.find((entry)=>entry.attemptId===attempt.id);
  if(!attempt||!input||!snapshot) throw new Error("Race package is incomplete.");
  return JSON.stringify({schemaVersion:1,snapshot,input,attempt,output:output??null},null,2);
}

export function isPreparationAvailable(career:CareerState,roundId:string) {
  const round=career.season.calendar.rounds.find((entry)=>entry.id===roundId);
  if(!round) return false;
  const first=round.sessions[0];
  const current=toGameMinute({date:career.clock.date,minuteOfDay:career.clock.minuteOfDay});
  const start=toGameMinute({date:first.date,minuteOfDay:first.minuteOfDay});
  return start-current<=7*24*60&&start>=current;
}

export function weekendMilestones(career:CareerState):ScheduledGameEvent[] {
  const preparation=career.season.calendar.rounds
    .filter((round)=>round.status==="scheduled")
    .map((round)=>{
      const first=round.sessions[0];
      return {id:`${round.id}-preparation`,startsAt:fromGameMinute(toGameMinute({date:first.date,minuteOfDay:first.minuteOfDay})-7*24*60),blocking:false};
    });
  const sessions=career.season.calendar.rounds.flatMap((round)=>round.sessions.filter((entry)=>entry.status!=="completed"&&entry.status!=="cancelled").map((entry)=>({id:entry.id,startsAt:{date:entry.date,minuteOfDay:entry.minuteOfDay},blocking:true})));
  return [...preparation,...sessions];
}

export function advanceCareerWeekend(career:CareerState,storage?:CareerStorage) {
  if(career.weekendOperations.activeWeekendId){const active=career.season.calendar.rounds.find((round)=>round.id===career.weekendOperations.activeWeekendId);if(active?.status==="race_completed")throw new Error("Archive the completed weekend before continuing.");}
  const result=advanceCareerTime(career,{type:"next_event"},weekendMilestones(career),storage);
  if(!result.reachedEvent?.id.endsWith("-preparation")) return result;
  const roundId=result.reachedEvent.id.slice(0,-"-preparation".length);
  const round=result.career.season.calendar.rounds.find((entry)=>entry.id===roundId);
  if(!round) throw new Error("Preparation milestone round not found.");
  const changed=saveCareer(replaceRound(result.career,{...round,status:"preparation"}),storage);
  return {...result,career:changed};
}
