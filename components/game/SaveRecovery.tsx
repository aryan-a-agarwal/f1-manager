"use client";
import { useState } from "react";
import { CAREER_STORAGE_KEY, CAREER_BACKUP_KEY, deleteCareer, importCareer } from "@/lib/career";

export default function SaveRecovery({message}:{message:string}) {
  const [error,setError]=useState(message);
  const [confirmReset,setConfirmReset]=useState(false);
  function download(){
    const payload={primary:localStorage.getItem(CAREER_STORAGE_KEY),backup:localStorage.getItem(CAREER_BACKUP_KEY)};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const link=document.createElement("a");link.href=url;link.download="f1-career-recovery.json";link.click();URL.revokeObjectURL(url);
  }
  return <main className="save-recovery"><section><small>CAREER RECOVERY</small><h1>Your saved career needs attention</h1><p role="alert">{error}</p><p>Your stored data has been retained. Download it before attempting recovery, or restore a valid career export.</p><div><button onClick={download}>Download retained save data</button><button onClick={()=>window.location.reload()}>Retry loading</button></div><label>Restore career export<input type="file" accept=".json,application/json" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;try{importCareer(await file.text());window.location.reload();}catch(cause){setError(cause instanceof Error?cause.message:"The export could not be restored.");}}}/></label>{confirmReset?<div><p>This permanently removes the current career and backup from this browser. Download the retained data first.</p><button onClick={()=>setConfirmReset(false)}>Cancel</button><button onClick={()=>{deleteCareer();window.location.assign("/setup");}}>Confirm new career</button></div>:<button onClick={()=>setConfirmReset(true)}>Start a new career…</button>}</section></main>;
}
