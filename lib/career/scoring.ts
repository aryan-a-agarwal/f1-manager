import { saveCareer, type CareerStorage } from "./storage";
import type { CareerState, ChampionshipState, ClassificationEntry, DriverStanding, TeamStanding } from "./types";

const FULL_RACE=[25,18,15,12,10,8,6,4,2,1];
const HALF_RACE=[19,14,12,10,8,6,4,3,2,1];
const QUARTER_RACE=[13,10,8,6,5,4,3,2,1];
const MINIMUM_RACE=[6,4,3,2,1];
const SPRINT=[8,7,6,5,4,3,2,1];

export function pointsScale(kind:"race"|"sprint",distancePercent:number,leaderLaps=2){
  if(leaderLaps<2)return [];
  if(kind==="sprint")return distancePercent>=50?SPRINT:[];
  if(distancePercent>=75)return FULL_RACE;
  if(distancePercent>=50)return HALF_RACE;
  if(distancePercent>=25)return QUARTER_RACE;
  if(distancePercent>0)return MINIMUM_RACE;
  return [];
}

function addFinish<T extends DriverStanding|TeamStanding>(row:T,position:number,points:number,grandPrix:boolean):T {
  return {...row,points:row.points+points,wins:row.wins+(grandPrix&&position===1?1:0),podiums:row.podiums+(grandPrix&&position<=3?1:0),finishes:grandPrix?{...row.finishes,[position]:Number(row.finishes[position]??0)+1}:row.finishes};
}

function scoreClassification(championship:ChampionshipState,classification:ClassificationEntry[],teamsByDriver:Map<string,string>,scale:readonly number[],grandPrix:boolean){
  let drivers=championship.drivers;let constructors=championship.teams;
  for(const result of classification){if(result.status!=="classified")continue;const points=scale[result.position-1]??0;const teamId=teamsByDriver.get(result.driverId);drivers=drivers.map((row)=>row.driverId===result.driverId?addFinish(row,result.position,points,grandPrix):row);if(teamId)constructors=constructors.map((row)=>row.teamId===teamId?addFinish(row,result.position,points,grandPrix):row);}
  return {...championship,drivers,teams:constructors};
}

export function processChampionshipEventsState(career:CareerState):CareerState {
  let championship=career.championship;
  let outbox=career.weekendOperations.outbox;
  for(const event of outbox.filter((entry)=>entry.status==="pending")){
    if(event.type==="SessionCompleted"&&event.resultId&&!championship.processedResultIds.includes(event.resultId)){
      const output=career.weekendOperations.outputs.find((entry)=>entry.id===event.resultId);
      const session=career.season.calendar.rounds.flatMap((round)=>round.sessions).find((entry)=>entry.id===event.sessionId);
      if(!output||!session)throw new Error("A pending scoring event is missing its result or session.");
      if((session.kind==="race"||session.kind==="sprint")&&output.completionMode==="simulated"){
        const snapshot=career.weekendOperations.snapshots.find((entry)=>entry.roundId===event.roundId);
        if(!snapshot)throw new Error("The scoring participant snapshot is missing.");
        const teamsByDriver=new Map(snapshot.participants.map((entry)=>[entry.driverId,entry.teamId]));
        const leaderLaps=output.classification.find((entry)=>entry.position===1)?.laps??0;
        championship=scoreClassification(championship,output.classification,teamsByDriver,pointsScale(session.kind,output.distancePercent??0,leaderLaps),session.kind==="race");
      }
      championship={...championship,processedResultIds:[...championship.processedResultIds,event.resultId]};
    }
    outbox=outbox.map((entry)=>entry.id===event.id?{...entry,status:"processed"}:entry);
  }
  return {...career,championship,weekendOperations:{...career.weekendOperations,outbox}};
}

export function processChampionshipEvents(career:CareerState,storage?:CareerStorage){
  const changed=processChampionshipEventsState(career);
  return changed===career?career:saveCareer(changed,storage);
}

function countAt(row:DriverStanding|TeamStanding,position:number){return Number(row.finishes[position]??0);}
export function compareStandings(a:DriverStanding|TeamStanding,b:DriverStanding|TeamStanding){if(b.points!==a.points)return b.points-a.points;for(let position=1;position<=22;position++){const difference=countAt(b,position)-countAt(a,position);if(difference)return difference;}return ("driverName" in a?a.driverName:a.teamName).localeCompare("driverName" in b?b.driverName:b.teamName);}
