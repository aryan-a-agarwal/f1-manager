import assert from "node:assert/strict";
import { teams } from "../lib/data/grid";
import { createCareer, simulateEntireWeekend, resolveTimelineEvent, chooseEmailDecision, completeCurrentSeason, startNextSeason,
  saveCareer, loadCareer, type CareerState, type CareerStorage } from "../lib/career";

class MemoryStorage implements CareerStorage {
  values=new Map<string,string>();getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){this.values.set(key,value);}removeItem(key:string){this.values.delete(key);}
}
async function season(career:CareerState,storage:CareerStorage){
  let state=career;
  const year=state.season.year;
  for(const round of state.season.calendar.rounds){
    let done=false;
    for(let attempt=0;attempt<80;attempt++){
      state=await simulateEntireWeekend(state,round.id,undefined,storage);
      if(state.season.calendar.rounds.find(item=>item.id===round.id)?.status==="archived"){done=true;break;}
      assert.equal(state.clock.status,"blocked");
      const id=state.clock.blockingEventId!;
      const email=state.comms?.emails.find(item=>item.id===id);
      state=email?chooseEmailDecision(state,id,email.decisionChoices![0].id,storage):resolveTimelineEvent(state,id,storage);
    }
    assert.ok(done,`Progress stalled at ${round.id}`);
  }
  assert.equal(state.weekendOperations.outputs.length,120);
  assert.equal(new Set(state.weekendOperations.outputs.map(result=>result.id)).size,120);
  assert.equal(state.championship.drivers.reduce((sum,row)=>sum+row.points,0),2640);
  assert.equal(state.championship.teams.reduce((sum,row)=>sum+row.points,0),2640);
  assert.ok(state.season.calendar.rounds.every(round=>round.status==="archived"&&round.sessions.every(session=>session.date.startsWith(`${year}-`))));
  state=saveCareer(state,storage);
  const reloaded=loadCareer(storage)!;assert.ok(reloaded);assert.deepEqual(reloaded.championship,state.championship);
  state=completeCurrentSeason(reloaded,storage);return state;
}
async function main(){
  for(const team of teams){const storage=new MemoryStorage();let career=createCareer(team.id,{careerId:`soak-${team.id}`});career=await season(career,storage);assert.equal(career.seasonHistory.length,1);console.log(`Full calendar season: ${team.shortName} PASS`);}
  for(const team of ["ferrari","audi","mclaren"]){const storage=new MemoryStorage();let career=createCareer(team,{careerId:`three-year-${team}`});for(let index=0;index<3;index++){career=await season(career,storage);assert.equal(career.seasonHistory.length,index+1);if(index<2){career=startNextSeason(career,storage);assert.equal(career.season.year,2028+index);assert.ok(career.events!.every(event=>event.date.startsWith(`${career.season.year}-`)));career=loadCareer(storage)!;}}assert.equal(new Set(career.seasonHistory.flatMap(archive=>archive.calendar.rounds.map(round=>round.id))).size,72);console.log(`Three calendar seasons: ${team} PASS`);}
  console.log("Calendar soak passed: 20 complete seasons, 480 weekends, 2400 sessions. Economy and contract lifecycle remain separate work.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
