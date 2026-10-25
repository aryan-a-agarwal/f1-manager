import type { CareerState, TimelineEvent, EventCategory, FacilityKey } from "./types";
import { collectCareerScheduledEvents, DEFAULT_STOP_SETTINGS, type EnrichedScheduledEvent } from "./timeline";
import { toGameMinute, fromGameMinute, type TimeAdvanceRequest, type TimeAdvanceResult } from "./gameTime";
import { completeCarDevelopmentProjectState } from "./carDev";
import { processFacilityWearAndUpkeepState } from "./facilities";
import { saveCareer, type CareerStorage } from "./storage";

export type ScheduleAdvanceResult = TimeAdvanceResult & {
  outcome: "target_reached" | "action_required" | "session_ready" | "season_complete";
};

export function careerSchedule(career: CareerState): EnrichedScheduledEvent[] {
  const events = collectCareerScheduledEvents(career);
  for(const email of career.comms?.emails ?? []) {
    if(!email.requiresDecision || email.chosenDecisionId)continue;
    events.push({id:email.id,startsAt:{date:email.date,minuteOfDay:540},blocking:true,title:email.subject,
      category:email.category==="sponsors"?"sponsor_offers":"staff_meetings",severity:"mandatory",
      description:email.body,actionPage:"comms"});
  }
  for(const facility of Object.values(career.facilities?.facilities ?? {})) {
    if(!facility.upgradeInConstruction || !facility.upgradeCompletionDate)continue;
    events.push({id:`facility-${facility.key}-${facility.upgradeCompletionDate}-${facility.upgradeTargetLevel}-complete`,
      startsAt:{date:facility.upgradeCompletionDate,minuteOfDay:540},blocking:(career.stopSettings??DEFAULT_STOP_SETTINGS).carDevelopment,
      title:`${facility.name}: construction complete`,category:"facilities",severity:"important",actionPage:"team"});
  }
  const processed=new Set(career.scheduler.processedEventIds);
  const acknowledged=new Set(career.scheduler.acknowledgedEventIds);
  return events.filter(event=>!processed.has(event.id)&&!acknowledged.has(event.id))
    .sort((a,b)=>toGameMinute(a.startsAt)-toGameMinute(b.startsAt)
      || Number(b.severity==="mandatory")-Number(a.severity==="mandatory") || a.id.localeCompare(b.id));
}

function eventNotice(event:EnrichedScheduledEvent):TimelineEvent {
  return {id:event.id,title:event.title,category:event.category,severity:event.severity,date:event.startsAt.date,
    minuteOfDay:event.startsAt.minuteOfDay,description:event.description,actionPage:event.actionPage,
    actionLabel:event.actionPage==="comms"?"Make decision":undefined,
    metadata:{requiresDecision:event.actionPage==="comms"}};
}

function applyDueEvent(career:CareerState,event:EnrichedScheduledEvent):CareerState {
  let state=career;
  const project=state.projects?.find(item=>event.id.startsWith(`${item.id}-`));
  if(project){
    if(event.id===`${project.id}-testing-complete`) state=completeCarDevelopmentProjectState(state,project.id);
    else state={...state,projects:state.projects?.map(item=>item.id===project.id?{...item,phase:event.id.endsWith("design-complete")?"production":"testing"}:item)};
  }
  if(event.category==="facilities")state=processFacilityWearAndUpkeepState(state,0);
  if(event.id.endsWith("-preparation")) {
    const roundId=event.id.slice(0,-"-preparation".length);
    state={...state,season:{...state.season,calendar:{...state.season.calendar,rounds:state.season.calendar.rounds.map(round=>round.id===roundId&&round.status==="scheduled"?{...round,status:"preparation"}:round)}}};
  }
  // Sessions and undecided messages are consumed by their own explicit commands.
  const external=event.category==="race_weekend"&&!event.id.endsWith("-preparation") || event.actionPage==="comms";
  return external?state:{...state,scheduler:{...state.scheduler,processedEventIds:[...state.scheduler.processedEventIds,event.id]}};
}

/** One chronological advancement path for all application time controls. */
export function advanceCareerSchedule(career:CareerState,request:TimeAdvanceRequest,storage?:CareerStorage,options:{preparationStop?:boolean}={}):ScheduleAdvanceResult {
  if(career.clock.status==="blocked") {
    const notice=career.scheduler.pendingEvent;
    const event=careerSchedule(career).find(item=>item.id===career.clock.blockingEventId);
    return {career,changed:false,reachedEvent:event??(notice?{id:notice.id,startsAt:{date:notice.date,minuteOfDay:notice.minuteOfDay},blocking:true}:null),outcome:event?.category==="race_weekend"?"session_ready":"action_required"};
  }
  const initial=toGameMinute(career.clock);
  const scheduled=careerSchedule(career);
  const nextStop=scheduled.find(event=>event.blocking || (options.preparationStop&&event.id.endsWith("-preparation")));
  let target=request.type==="target"?toGameMinute(request.target):request.type==="day"?initial+1440:request.type==="hour"?initial+60:nextStop?Math.max(initial,toGameMinute(nextStop.startsAt)):initial;
  if(target<initial)throw new Error("Game time can only move forwards.");
  let state=career;
  let reached:EnrichedScheduledEvent|null=null;
  let iterations=0;
  while(true){
    const next=careerSchedule(state).find(event=>toGameMinute(event.startsAt)<=target);
    if(!next)break;
    if(++iterations>10000)throw new Error("Calendar progression stopped because the schedule made no progress.");
    const previousKey=`${next.id}|${state.scheduler.processedEventIds.length}`;
    const at=Math.max(toGameMinute(state.clock),toGameMinute(next.startsAt));
    state={...state,clock:{...state.clock,...fromGameMinute(at)}};
    state=applyDueEvent(state,next);
    const stop=next.blocking || (options.preparationStop&&next.id.endsWith("-preparation"));
    if(stop){
      reached=next;target=at;
      if(next.blocking)state={...state,clock:{...state.clock,status:"blocked",blockingEventId:next.id},scheduler:{...state.scheduler,pendingEvent:eventNotice(next)}};
      break;
    }
    const stillNext=careerSchedule(state).find(event=>toGameMinute(event.startsAt)<=target);
    if(stillNext&&`${stillNext.id}|${state.scheduler.processedEventIds.length}`===previousKey)throw new Error(`Unprocessed calendar event: ${next.title}`);
  }
  const changed=target!==initial||state!==career;
  if(!changed)return {career,changed:false,reachedEvent:null,outcome:nextStop?"target_reached":"season_complete"};
  const destination=fromGameMinute(target);
  state={...state,clock:{...state.clock,...destination,lastAdvance:{fromDate:career.clock.date,fromMinuteOfDay:career.clock.minuteOfDay,toDate:destination.date,toMinuteOfDay:destination.minuteOfDay,reason:request.type==="target"?"target":request.type}},season:{...state.season,currentEventId:reached?.id??state.season.currentEventId}};
  return {career:saveCareer(state,storage),changed:true,reachedEvent:reached,outcome:state.clock.status==="blocked"?(reached?.category==="race_weekend"?"session_ready":"action_required"):"target_reached"};
}

export function acknowledgeScheduledEvent(career:CareerState,id:string,storage?:CareerStorage):CareerState {
  const session=career.season.calendar.rounds.flatMap(round=>round.sessions).find(item=>item.id===id);
  if(session&&session.status!=="completed"&&session.status!=="cancelled")throw new Error("Complete or cancel the session through the race centre before continuing.");
  const email=career.comms?.emails.find(item=>item.id===id);
  if(email?.requiresDecision&&!email.chosenDecisionId)throw new Error("Make the required decision in Communications before continuing.");
  if(career.scheduler.acknowledgedEventIds.includes(id))return career;
  return saveCareer({...career,events:career.events?.map(event=>event.id===id?{...event,resolved:true}:event),
    clock:career.clock.blockingEventId===id?{...career.clock,status:"paused",blockingEventId:null}:career.clock,
    scheduler:{...career.scheduler,acknowledgedEventIds:[...career.scheduler.acknowledgedEventIds,id],pendingEvent:career.scheduler.pendingEvent?.id===id?null:career.scheduler.pendingEvent}},storage);
}
