"use client";
import {useEffect,useRef,useState} from "react";
import {pushTrail,type NavigationTrail} from "@/lib/profileNavigation";
const KEY="f1-manager-page-history-v1";
const path=()=>window.location.pathname+window.location.search;
export function useGameNavigation(){
  const trail=useRef<NavigationTrail>({entries:[],cursor:0});
  const [state,setState]=useState({canBack:false,canForward:false});
  function update(next:NavigationTrail){
    trail.current=next;setState({canBack:next.cursor>0,canForward:next.cursor<next.entries.length-1});
    try{sessionStorage.setItem(KEY,JSON.stringify(next));}catch{/* Optional navigation preference. */}
  }
  useEffect(()=>{
    let initial:NavigationTrail={entries:[path()],cursor:0};
    try{const stored=JSON.parse(sessionStorage.getItem(KEY)??"null");const index=window.history.state?.f1PageIndex;
      if(stored&&Array.isArray(stored.entries)&&stored.entries.every((item:unknown)=>typeof item==="string"&&item.startsWith("/game"))&&Number.isInteger(index)&&index>=0&&stored.entries[index]===path())initial={entries:stored.entries,cursor:index};
    }catch{/* Start a fresh trail if optional display state is malformed. */}
    window.history.replaceState({...window.history.state,f1PageIndex:initial.cursor},"",window.location.href);update(initial);
    const pop=(event:PopStateEvent)=>{
      const index=event.state?.f1PageIndex;
      if(Number.isInteger(index)&&trail.current.entries[index]===path())update({...trail.current,cursor:index});
      else{update({entries:[path()],cursor:0});window.history.replaceState({...window.history.state,f1PageIndex:0},"",window.location.href);}
    };
    window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop);
  },[]);
  function push(url:string){
    const next=pushTrail(trail.current,url);if(next===trail.current)return;
    window.history.pushState({...window.history.state,f1PageIndex:next.cursor},"",url);update(next);
    window.dispatchEvent(new PopStateEvent("popstate",{state:window.history.state}));
  }
  return {...state,push,back:()=>window.history.back(),forward:()=>window.history.forward()};
}
export function HistoryArrows({navigation}:{navigation:ReturnType<typeof useGameNavigation>}){
  return <nav className="page-history" aria-label="Page history"><button type="button" aria-label="Go back" title="Go back" disabled={!navigation.canBack} onClick={navigation.back}>←</button><button type="button" aria-label="Go forward" title="Go forward" disabled={!navigation.canForward} onClick={navigation.forward}>→</button></nav>;
}
