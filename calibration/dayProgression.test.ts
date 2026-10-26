import assert from "node:assert/strict";
import {test} from "node:test";
import {createCareer,advanceCareerOneDay,addDaysToDate,toGameMinute,type CareerStorage} from "../lib/career";

function memoryStorage():CareerStorage{
  const values=new Map<string,string>();
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};
}

test("daily ticker visits every date and stops at the first mandatory session",()=>{
  const storage=memoryStorage();
  let career=createCareer("mclaren",{careerId:"day-ticker"});
  const first=career.season.calendar.rounds[0].sessions[0];
  let ticks=0;
  while(career.clock.status!=="blocked"){
    const previous=career;
    const result=advanceCareerOneDay(career,storage);
    career=result.career;
    assert.ok(toGameMinute(career.clock)-toGameMinute(previous.clock)<=1440);
    if(career.clock.status!=="blocked")assert.equal(career.clock.date,addDaysToDate(previous.clock.date,1));
    assert.ok(++ticks<370,"Ticker must reach a required event");
  }
  assert.ok(ticks>1,"Continue must pass through intermediate days");
  assert.equal(career.clock.blockingEventId,first.id);
  assert.equal(career.clock.date,first.date);
  assert.equal(career.clock.minuteOfDay,first.minuteOfDay);
  const stopped=advanceCareerOneDay(career,storage);
  assert.equal(stopped.changed,false);
  assert.equal(stopped.career,career,"Repeated advancement cannot bypass the pending session");
  assert.ok(career.season.calendar.rounds[0].sessions.every(session=>session.status!=="completed"),"Day progression never simulates races implicitly");
});
