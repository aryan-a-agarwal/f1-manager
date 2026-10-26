"use client";

import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {addDaysToDate,advanceCareerOneDay,findNextActionableEvent,type CareerState} from "@/lib/career";
import {careerSchedule} from "@/lib/career/scheduler";

/** IPL-style visible day ticker; all time still passes through the F1 scheduler. */
export default function DayProgressControl({career,updateCareer,onBlocked,onError}:{career:CareerState;updateCareer:(career:CareerState)=>void;onBlocked:(career:CareerState,eventId:string)=>void;onError:(message:string)=>void}){
  const [running,setRunning]=useState(false);
  const [open,setOpen]=useState(false);
  const [notice,setNotice]=useState<{message:string;created:number}|null>(null);
  const continueRef=useRef<HTMLButtonElement>(null);
  const stopRef=useRef<HTMLButtonElement>(null);
  const tick=useRef<()=>void>(()=>{});
  const stripRef=useRef<HTMLDivElement>(null);
  const previousTiles=useRef(new Map<string,number>());
  useLayoutEffect(()=>{
    const tiles=Array.from(stripRef.current?.querySelectorAll<HTMLElement>("[data-date]")??[]);
    const positions=new Map<string,number>();
    for(const tile of tiles){
      const date=tile.dataset.date!;
      const left=tile.offsetLeft;
      positions.set(date,left);
      const previous=previousTiles.current.get(date);
      if(open&&previousTiles.current.size){
        const distance=previous==null?tile.offsetWidth+10:previous-left;
        if(distance)tile.animate([{transform:`translateX(${distance}px)`},{transform:"translateX(0)"}],{duration:400,easing:"cubic-bezier(.25,.8,.25,1)"});
      }
    }
    previousTiles.current=positions;
  },[career.clock.date,open]);
  const blocked=career.clock.status==="blocked";
  const next=findNextActionableEvent(career);
  const schedule=careerSchedule(career);
  const stop=()=>{setRunning(false);continueRef.current?.focus();};
  function pauseForEvent(state:CareerState,eventId:string){
    setRunning(false);setOpen(false);continueRef.current?.focus();
    const title=careerSchedule(state).find(event=>event.id===eventId)?.title??state.scheduler.pendingEvent?.title??"a required event";
    setNotice({message:`Paused for ${title}`,created:Date.now()});
    onBlocked(state,eventId);
  }
  useEffect(()=>{
    if(!notice)return;
    const timer=window.setTimeout(()=>setNotice(null),5000);
    return()=>window.clearTimeout(timer);
  },[notice]);
  function advanceDay(){
    if(blocked){if(career.clock.blockingEventId)pauseForEvent(career,career.clock.blockingEventId);return;}
    if(!next){setRunning(false);return;}
    try{
      const result=advanceCareerOneDay(career);
      updateCareer(result.career);
      if(!result.changed||result.career.clock.status==="blocked"){
        setRunning(false);
        if(result.career.clock.blockingEventId)pauseForEvent(result.career,result.career.clock.blockingEventId);
      }
    }catch(error){setRunning(false);onError(error instanceof Error?error.message:"Day advancement failed.");}
  }
  tick.current=advanceDay;
  useEffect(()=>{
    if(!running)return;
    // A fresh timeout per committed day prevents overlapping saves or stale ticks.
    const timer=window.setTimeout(()=>tick.current(),850);
    return()=>window.clearTimeout(timer);
  },[running,career]);
  useEffect(()=>{
    if(!open)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setRunning(false);setOpen(false);continueRef.current?.focus();}};
    window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
  },[open]);
  useEffect(()=>{if(running)stopRef.current?.focus();},[running]);
  function start(){
    if(blocked){if(career.clock.blockingEventId)pauseForEvent(career,career.clock.blockingEventId);return;}
    setOpen(true);setRunning(true);
  }
  return <div className="day-progress-controls">
    <button ref={continueRef} className={`day-continue${blocked?" is-blocked":""}`} onClick={running?stop:start} disabled={!next&&!blocked} aria-label={running?"Stop day-by-day simulation":blocked?"Open required action":"Continue day-by-day simulation"}>{running?"■ Stop":blocked?"Action required":"▶ Continue"}</button>
    <button className="day-calendar-toggle" aria-label="Toggle progression calendar" aria-expanded={open} aria-controls="day-progression-calendar" onClick={()=>{if(running)stop();setOpen(!open);}}>⌄</button>
    <section id="day-progression-calendar" className={`day-calendar-drop${open?" is-open":""}`} aria-hidden={!open} ref={element=>{if(element)element.inert=!open;}} aria-label="Day-by-day simulation calendar">
      <div className="day-calendar-heading"><div><strong>{running?"Advancing day by day":blocked?"Action required":"Calendar paused"}</strong><p aria-live="polite">{career.clock.date} · {String(Math.floor(career.clock.minuteOfDay/60)).padStart(2,"0")}:{String(career.clock.minuteOfDay%60).padStart(2,"0")}</p></div><div className="day-calendar-actions"><button ref={stopRef} onClick={running?stop:start} disabled={!next&&!blocked}>{running?"■ Stop (Esc)":blocked?"Open session / action":"▶ Continue"}</button><button onClick={()=>{stop();setOpen(false);}} aria-label="Close progression calendar">×</button></div></div>
      <div className="day-calendar-strip" ref={stripRef}>{[-1,0,1,2,3,4,5].map(offset=>{
        const date=addDaysToDate(career.clock.date,offset);
        const events=schedule.filter(event=>event.startsAt.date===date);
        const formatted=new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`));
        return <article key={date} data-date={date} className={`day-calendar-tile${offset===0?" current":""}${offset<0?" past":""}`} aria-current={offset===0?"date":undefined}><time dateTime={date}>{formatted}</time><small>{offset===0?"Today":offset===-1?"Yesterday":""}</small><div>{events.slice(0,3).map(event=><span className={event.blocking?"mandatory":""} key={event.id}>{event.title}</span>)}{events.length>3&&<small>+{events.length-3} more</small>}</div></article>;
      })}</div>
      <footer><span>{blocked?"Complete the required action before continuing.":next?`Next: ${next.event.title} · ${next.event.startsAt.date}`:"No remaining scheduled events. Review the season in the race centre."}</span><button onClick={()=>{stop();advanceDay();}} disabled={blocked||running||!next}>Advance one day</button></footer>
    </section>
    {notice&&<aside className="day-event-notice" role="status"><span aria-hidden="true">Ⅱ</span><div><strong>{notice.message}</strong><p>Complete this event to continue.</p></div><button aria-label="Dismiss pause notification" onClick={()=>setNotice(null)}>×</button></aside>}
  </div>;
}
