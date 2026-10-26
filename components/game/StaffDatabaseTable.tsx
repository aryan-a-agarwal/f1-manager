"use client";
import {useEffect,useMemo,useState} from "react";
import {StaffLink,useProfiles} from "./Profiles";
import {STAFF_GROUPS,buildStaffRows,compareStaffRows,staffFieldLabel,staffMatches} from "@/lib/staffDatabase";
import type {DatabaseRow} from "@/lib/driverProfileData";

export default function StaffDatabaseTable(){
 const {catalogue,career,loading,errors}=useProfiles();
 const [search,setSearch]=useState(""),[team,setTeam]=useState("all"),[role,setRole]=useState("all");
 const [groups,setGroups]=useState<string[]>(["appointment"]),[sort,setSort]=useState("name"),[direction,setDirection]=useState<"asc"|"desc">("asc"),[width,setWidth]=useState(9);
 useEffect(()=>{const resize=()=>setWidth(window.innerWidth<700?3:window.innerWidth<1000?5:9);resize();window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
 const rows=useMemo(()=>buildStaffRows(catalogue.people as unknown as DatabaseRow[],catalogue.staff as unknown as DatabaseRow[],catalogue.teams as unknown as DatabaseRow[],career.clock.date),[catalogue,career.clock.date]);
 const options=(key:string)=>[...new Set(rows.flatMap(r=>String(r.values[key]??"").split("; ").filter(Boolean)))].sort();
 const shown=rows.filter(r=>staffMatches(r,search)&&(team==="all"||String(r.values.team??"").split("; ").includes(team))&&(role==="all"||String(r.values.role??"").split("; ").includes(role))).sort((a,b)=>compareStaffRows(a,b,sort,direction));
 const selected=STAFF_GROUPS.filter(g=>groups.includes(g.id));
 const tables=(selected.length?selected:[STAFF_GROUPS[0]]).flatMap(g=>{const chunks=[];for(let i=0;i<g.fields.length;i+=width)chunks.push({id:`${g.id}-${i}`,label:g.label,fields:g.fields.slice(i,i+width)});return chunks;});
 const toggleSort=(key:string)=>{setDirection(sort===key&&direction==="asc"?"desc":"asc");setSort(key);};
 return <section className="driver-database" aria-label="Staff database">
  <div className="driver-database-tools"><label className="driver-database-search"><span className="driver-database-control-label">Search staff</span><input type="search" aria-label="Search staff" placeholder="Search staff, teams or nationality" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <label><span className="driver-database-control-label">Team</span><select aria-label="Team" value={team} onChange={e=>setTeam(e.target.value)}><option value="all">All teams</option>{options("team").map(v=><option key={v}>{v}</option>)}</select></label>
   <label><span className="driver-database-control-label">Role</span><select aria-label="Role" value={role} onChange={e=>setRole(e.target.value)}><option value="all">All roles</option>{options("role").map(v=><option key={v}>{v}</option>)}</select></label>
   <button className="driver-database-reset" onClick={()=>{setSearch("");setTeam("all");setRole("all");setGroups(["appointment"]);setSort("name");setDirection("asc");}}>Reset view</button>
  </div>
  <fieldset className="driver-database-groups"><legend>Display staff groups</legend>{STAFF_GROUPS.map(g=><label key={g.id}><input type="checkbox" checked={groups.includes(g.id)} onChange={e=>setGroups(e.target.checked?[...groups,g.id]:groups.filter(id=>id!==g.id))}/>{g.label}</label>)}<button type="button" onClick={()=>setGroups(STAFF_GROUPS.map(g=>g.id))}>All groups</button></fieldset>
  <p className="driver-database-note">{loading?"Loading staff…":`${shown.length} of ${rows.length} staff`} · Click a column heading to sort. Appointments are reference records; unallocated expertise is unrated.</p>
  {errors.length>0&&<p className="profile-notice" role="status">Some reference data could not be loaded.</p>}
  {tables.map(table=><section className="driver-database-block" key={table.id}><h2>{table.label}</h2><div className="driver-database-scroll" role="region" aria-label={`${table.label} staff details`}><table><caption>Staff details. Select a heading to sort.</caption><thead><tr>{["name",...table.fields].map(key=><th key={key} scope="col" aria-sort={sort===key?direction==="asc"?"ascending":"descending":"none"}><button onClick={()=>toggleSort(key)}>{key==="name"?"Staff member":staffFieldLabel(key)}<span aria-hidden="true">{sort===key?direction==="asc"?" ↑":" ↓":" ↕"}</span></button></th>)}</tr></thead><tbody>{shown.map(row=><tr key={row.id}><td><StaffLink id={row.id} name={row.name}/><small>{row.values.team??"No recorded team"}</small></td>{table.fields.map(key=><td key={key} className={row.values[key]==null?"driver-database-missing":undefined}>{row.values[key]??(key.endsWith("_expertise")||key.endsWith("_rating")?"Unrated":"Not recorded")}</td>)}</tr>)}</tbody></table>{!loading&&!shown.length&&<p className="driver-database-empty">No staff match these filters.</p>}</div></section>)}
 </section>;
}
