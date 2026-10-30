"use client";

import {createContext,useContext,useEffect,useState,type MouseEvent,type ReactNode} from "react";
import {teams} from "@/lib/data/grid";
import type {CareerState} from "@/lib/career";
import {normalizedName,profileUrl,type ProfileTarget} from "@/lib/profileNavigation";
import {ContractNegotiation} from "./ContractNegotiation";
import {ContractClauses} from "./ContractClauses";
import {contractSalary} from "@/lib/career/contracts";
import {assumedDriverSalary} from "@/lib/career/driverSalaries";
import {supabase} from "@/lib/supabaseClient";
import teamBaselineSeed from "@/supabase/seed-data/2027-team-baselines.json";
import ownershipSeed from "@/supabase/seed-data/2027-team-ownership.json";
import {matchingTeamRecord,teamRatingGroups} from "@/lib/teamProfileData";
import {DRIVER_PROFILE_TABLES,DRIVER_ATTRIBUTE_GROUPS,matchingDriverRecords,linkedDriverRows,databaseFields,databaseFieldLabel,databaseValueText,driverAttributeDisplay,type DatabaseRow} from "@/lib/driverProfileData";
import {calculateDriverRatings} from "@/lib/driverRatings";
import {STAFF_GROUPS,staffFieldLabel} from "@/lib/staffDatabase";

type Person={id:number;slug:string;first_name:string;last_name:string;display_name:string;date_of_birth:string|null;racing_nationality:string|null;place_of_birth:string|null;person_type:string;f1_debut_season:number|null;source_key:string;verified_on:string};
type Entry={person_id:number;series:string;season:number;entrant_name:string;entry_role:string;car_number:number|null;source_key:string;verified_on:string};
type TeamFact={id:number;slug:string;short_name:string;official_full_name:string;legal_name:string|null;base_city:string|null;base_country:string|null;team_chief:string|null;technical_chief:string|null;chassis:string|null;power_unit:string|null;first_team_entry:number|null;source_key:string;verified_on:string};
type Staff={person_id:number;team_id:number;season:number;role_title:string};
type Contract={id:string;person_id:number;team_id:number;role:string;confirmation_status:string;confirmed_through_season:number|null;exact_end_year:number|null;actual_contract_start_year:number|null;annual_salary_usd_cents:number|null;salary_status:string;source_url:string;verified_on:string;notes:string;dataset_id:string};
type Slot={dataset_id:string;team_id:number;role:string;slot_number:number;person_id:number|null;assignment_status:string};
type Source={source_key:string;publisher:string;title:string;url:string;retrieved_on:string};
type Dataset={id:string;season:number;as_of_date:string};
type TeamAchievement={team_id:number|null;team_slug:string;constructors_championships:number;drivers_championships:number;race_wins:number;podiums:number;pole_positions:number;fastest_laps:number;first_win_year:number|null;last_win_year:number|null;last_championship_year:number|null;notable_achievements:string|null};
type DriverCareerStint={person_id:number|null;driver_slug:string;season:number;team_name:string;team_slug:string|null;starts:number;wins:number;podiums:number;poles:number;points:number;championship_position:number|null;titles_won:number};
type DriverDatabaseCatalogue=Record<keyof typeof DRIVER_PROFILE_TABLES,DatabaseRow[]>;
type Catalogue=DriverDatabaseCatalogue&{people:Person[];entries:Entry[];teams:TeamFact[];staff:Staff[];contracts:Contract[];slots:Slot[];sources:Source[];datasets:Dataset[];teamAchievements:TeamAchievement[];driverHistory:DriverCareerStint[];teamBaselines:DatabaseRow[];teamOwners:DatabaseRow[];teamOwnership:DatabaseRow[]};
const EMPTY:Catalogue={people:[],entries:[],teams:[],staff:[],contracts:[],slots:[],sources:[],datasets:[],teamAchievements:[],driverHistory:[],teamBaselines:[],teamOwners:[],teamOwnership:[],driverRecords:[],driverContracts:[],driverStats:[],driverRatings:[],startingContracts:[],startingSlots:[],startingDatasets:[],legacyTeams:[]};
type ProfileContextValue={updateCareer:(career:CareerState)=>void;career:CareerState;catalogue:Catalogue;loading:boolean;errors:string[];open:(target:ProfileTarget)=>void};
const ProfileContext=createContext<ProfileContextValue|null>(null);
export function useProfiles(){const value=useContext(ProfileContext);if(!value)throw new Error("Profiles require the game profile provider.");return value;}

export function ProfileProvider({career,updateCareer,open,children}:{career:CareerState;updateCareer:(career:CareerState)=>void;open:(target:ProfileTarget)=>void;children:ReactNode}){
  const [catalogue,setCatalogue]=useState<Catalogue>(EMPTY),[loading,setLoading]=useState(true),[errors,setErrors]=useState<string[]>([]);
  useEffect(()=>{let live=true;
    const queries={people:"people",entries:"series_entries",teams:"f1_team_facts",staff:"f1_team_staff",contracts:"driver_contracts_2027",slots:"f1_team_driver_slots",sources:"data_sources",datasets:"f1_contract_reference_datasets",teamAchievements:"f1_team_achievements",driverHistory:"f1_driver_career_history",teamBaselines:"f1_team_game_baselines",teamOwners:"f1_owners",teamOwnership:"f1_team_ownership_periods",...DRIVER_PROFILE_TABLES};
    Promise.allSettled(Object.values(queries).map(async table=>{const rows:unknown[]=[];for(let offset=0;;offset+=500){let query=supabase.from(table).select("*");for(const key of table==="f1_team_driver_slots"||table==="f1_starting_team_slots"?["dataset_id","team_id","role","slot_number"]:["id"])query=query.order(key);const result=await query.range(offset,offset+499);if(result.error)throw new Error(`${table}: ${result.error.message}`);rows.push(...result.data??[]);if((result.data?.length??0)<500)return rows;}})).then(results=>{
      if(!live)return;const values:Record<string,unknown>={},failures:string[]=[];
      Object.keys(queries).forEach((key,index)=>{const result=results[index];values[key]=result.status==="fulfilled"?result.value:[];if(result.status==="rejected"&&!['teamBaselines','teamOwners','teamOwnership'].includes(key))failures.push(result.reason instanceof Error?result.reason.message:"Reference data unavailable");});
      // A clearly labelled local preview remains available until the separate database migration is applied.
      if(!(values.teamBaselines as unknown[]).length)values.teamBaselines=teamBaselineSeed.teams.map(row=>({...row,storage:'local_preview'}));
      if(!(values.teamOwners as unknown[]).length||!(values.teamOwnership as unknown[]).length){values.teamOwners=ownershipSeed.owners.map(owner=>({...owner,id:owner.slug,storage:'local_preview'}));const teamFacts=values.teams as TeamFact[];values.teamOwnership=ownershipSeed.relationships.flatMap(link=>{const team=teamFacts.find(item=>item.slug===link.team_slug);return team?[{id:`${link.team_slug}:${link.owner_slug}`,team_id:team.id,owner_id:link.owner_slug,relationship:link.relationship,ownership_percentage:link.percentage,dataset_version:ownershipSeed.dataset_version,source_url:ownershipSeed.owners.find(o=>o.slug===link.owner_slug)?.source_url,storage:'local_preview'}]:[];});}
      setCatalogue(values as Catalogue);setErrors(failures);setLoading(false);
    });return()=>{live=false;};
  },[]);
  return <ProfileContext.Provider value={{career,updateCareer,catalogue,loading,errors,open}}>{children}</ProfileContext.Provider>;
}

function activate(event:MouseEvent<HTMLAnchorElement>,open:()=>void){if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();event.stopPropagation();open();}
export function DriverLink({id,name,children,className=""}:{id:string;name?:string;children?:ReactNode;className?:string}){
  const {open}=useProfiles();const target:ProfileTarget={kind:"driver",id};
  return <a className={`entity-link ${className}`} href={profileUrl(typeof window==="undefined"?"/game":window.location.href,target)} onClick={event=>activate(event,()=>open(target))} title={`Open ${name??"driver"} profile`}>{children??name??id}</a>;
}
export function StaffLink({id,name}:{id:string;name:string}){
  const {open}=useProfiles();const target:ProfileTarget={kind:"staff",id};
  return <a className="entity-link" href={profileUrl(typeof window==="undefined"?"/game":window.location.href,target)} onClick={event=>activate(event,()=>open(target))} title={`Open ${name} profile`}>{name}</a>;
}
export function TeamLink({id,name,children,className=""}:{id?:string;name?:string;children?:ReactNode;className?:string}){
  const {open,catalogue}=useProfiles();const identity=resolveTeam(catalogue,id??name??"");
  const target:ProfileTarget={kind:"team",id:identity.game?.id??(identity.fact?`ref:${identity.fact.id}`:id??`entry:${name}`)};
  return <a className={`entity-link ${className}`} href={profileUrl(typeof window==="undefined"?"/game":window.location.href,target)} onClick={event=>activate(event,()=>open(target))} title={`Open ${name??identity.fact?.short_name??identity.game?.shortName??"team"} profile`}>{children??name??identity.fact?.short_name??identity.game?.shortName??id}</a>;
}
function teamNameKey(name:string){return normalizedName(name).replace(/formulaone|formula1/g,"f1").replace(/team/g,"");}
export function resolveTeam(catalogue:Catalogue,id:string){
  const name=id.startsWith("entry:")?id.slice(6):id;
  let fact=catalogue.teams.find(item=>`ref:${item.id}`===id||item.slug===id||[item.short_name,item.official_full_name].some(value=>teamNameKey(value)===teamNameKey(name)));
  let game=teams.find(item=>item.id===id||(item.id==="red-bull"&&id==="red-bull-racing")||[item.name,item.shortName].some(value=>teamNameKey(value)===teamNameKey(name)));
  if(!game&&fact)game=teams.find(item=>teamNameKey(item.shortName)===teamNameKey(fact!.short_name)||(item.id==="haas"&&fact!.slug==="haas"));
  if(!fact&&game)fact=catalogue.teams.find(item=>item.slug===game!.id||(game!.id==="red-bull"&&item.slug==="red-bull-racing"));
  return {fact,game,name};
}
export function resolveDriver(career:CareerState,catalogue:Catalogue,id:string){
  const legacy=catalogue.driverRecords.find(row=>`legacy:${row.id}`===id);
  let person=career.workforce.people.find(item=>item.kind==="driver"&&item.id===id);
  const grid=teams.flatMap(team=>team.drivers).find(item=>item.id===id);
  const reference=catalogue.people.find(item=>item.person_type.includes("driver")&&(`person:${item.id}`===id||item.slug===id||normalizedName(item.display_name)===normalizedName(person?.name??grid?.name??"")));
  if(!person&&reference)person=career.workforce.people.find(item=>item.kind==="driver"&&normalizedName(item.name)===normalizedName(reference.display_name));
  return {person,grid,reference,legacy};
}
function date(value:string|null|undefined){return value?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`)):"Not recorded";}
function age(dob:string|undefined|null,today:string){if(!dob)return null;return Number(today.slice(0,4))-Number(dob.slice(0,4))-(today.slice(5)<dob.slice(5)?1:0);}
function Detail({label,value}:{label:string;value:ReactNode}){return <div><dt>{label}</dt><dd>{value===null||value===undefined||value===""?"Not recorded":value}</dd></div>;}
function Card({title,children}:{title:string;children:ReactNode}){return <section className="profile-card"><h2>{title}</h2>{children}</section>;}
function initials(name:string){return name.split(" ").filter(Boolean).map(word=>word[0]).slice(0,2).join("");}
function sourceLink(url:string){return /^https:\/\//.test(url)?url:undefined;}
function ProfileSectionLink({target,children}:{target:string;children:ReactNode}){return <a href={`#${target}`} onClick={event=>{event.preventDefault();document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"});}}>{children}</a>;}

function StaffProfile({id}:{id:string}){
 const {career,catalogue,loading}=useProfiles();
 const person=catalogue.people.find(p=>`person:${p.id}`===id||p.slug===id);
 if(!person)return loading?null:<Card title="Staff member not found"><p>No reference record is available.</p></Card>;
 const assignments=catalogue.staff.filter(row=>row.person_id===person.id).sort((a,b)=>b.season-a.season);
 const saved=career.workforce.people.filter(p=>p.kind==="staff"&&normalizedName(p.name)===normalizedName(person.display_name));
 const agreements=career.workforce.agreements.filter(a=>saved.some(p=>p.id===a.personId));
 return <><header className="profile-hero"><div className="profile-monogram">{initials(person.display_name)}</div><div><small>STAFF PROFILE</small><h1>{person.display_name}</h1><p>{person.racing_nationality??"Nationality not recorded"}</p>{assignments[0]&&<TeamLink id={`ref:${assignments[0].team_id}`} name={catalogue.teams.find(t=>t.id===assignments[0].team_id)?.short_name??"Team"}/>}</div></header>
 <nav className="profile-section-nav" aria-label="Staff profile sections"><ProfileSectionLink target="staff-overview">Overview</ProfileSectionLink><ProfileSectionLink target="staff-attributes">Attributes</ProfileSectionLink><ProfileSectionLink target="staff-appointments">Appointments</ProfileSectionLink><ProfileSectionLink target="staff-records">Database records</ProfileSectionLink></nav>
 <div id="staff-overview" className="profile-grid"><Card title="Staff details"><dl className="profile-facts"><Detail label="First name" value={person.first_name}/><Detail label="Last name" value={person.last_name}/><Detail label="Date of birth" value={date(person.date_of_birth)}/><Detail label="Age at career date" value={age(person.date_of_birth,career.clock.date)}/><Detail label="Nationality" value={person.racing_nationality}/><Detail label="Place of birth" value={person.place_of_birth}/></dl></Card><Card title="Saved career agreements">{agreements.length?agreements.map(a=><div key={a.id}><TeamLink id={a.teamId} name={teams.find(t=>t.id===a.teamId)?.shortName??a.teamId}/><p>{a.role.replaceAll("_"," ")} · {a.startSeason}–{a.endSeason??"Unknown"}</p></div>):<p>No saved career agreement recorded.</p>}</Card></div>
 <section id="staff-attributes" className="profile-section-heading"><small>DATABASE ATTRIBUTES</small><h2>Expertise & engineering</h2><p>Staff ratings have not been allocated. Values are shown as unrated until they can be linked to a person and deliberately assigned.</p><div className="profile-grid">{STAFF_GROUPS.slice(2).map(group=><Card key={group.id} title={group.label}><dl className="profile-rating-grid">{group.fields.map(key=><div key={key}><dt>{staffFieldLabel(key)}</dt><dd className="profile-unrated">{key==="primary_specialism"?"Not recorded":"Unrated"}</dd></div>)}</dl></Card>)}</div></section>
 <section id="staff-appointments"><Card title="Recorded team appointments">{assignments.length?<div className="profile-record-list">{assignments.map((a,index)=><article key={index}><small>{a.season} · {a.role_title}</small><TeamLink id={`ref:${a.team_id}`} name={catalogue.teams.find(t=>t.id===a.team_id)?.short_name??"Team not recorded"}/><DatabaseRecord row={a as unknown as DatabaseRow} title="All appointment fields"/></article>)}</div>:<p>No team appointments recorded.</p>}</Card></section>
 <section id="staff-records"><Card title="Database records"><DatabaseRecord row={person as unknown as DatabaseRow} title="All identity fields"/><ReferenceSource sourceKey={person.source_key} verifiedOn={person.verified_on}/></Card></section></>;
}

export function ProfilePage({target}:{target:ProfileTarget}){
  const {loading,errors}=useProfiles();
  return <div className="full-profile" key={`${target.kind}:${target.id}`}>
    {loading&&<p className="profile-notice" role="status">Loading reference details…</p>}
    {errors.length>0&&<p className="profile-notice" role="status">Some reference data is unavailable. Saved career information is still shown; missing details remain unrecorded.</p>}
    {target.kind==="negotiation"?<ContractNegotiation id={target.id}/>:target.kind==="driver"?<DriverProfile id={target.id}/>:target.kind==="staff"?<StaffProfile id={target.id}/>:<TeamProfile id={target.id}/>}
  </div>;
}
function DriverProfile({id}:{id:string}){
  const {career,catalogue,loading,open}=useProfiles();const {person,grid,reference,legacy}=resolveDriver(career,catalogue,id);
  const name=person?.name??reference?.display_name??grid?.name??(legacy?String(legacy["driver-name"]??[legacy.first_name,legacy.last_name].filter(Boolean).join(" ")):undefined);
  if(!name)return loading?null:<Card title="Driver not found"><p>This driver is not in the loaded career or reference catalogue.</p></Card>;
  const lineup=person?career.workforce.lineups.find(row=>row.season===career.season.year&&row.driverIds.includes(person.id)):undefined;
  const currentTeam=lineup?teams.find(team=>team.id===lineup.teamId):undefined;
  const standing=person?career.championship.drivers.find(row=>row.driverId===person.id):undefined;
  const entries=reference?catalogue.entries.filter(entry=>entry.person_id===reference.id).sort((a,b)=>b.season-a.season):[];
  const contracts=reference?catalogue.contracts.filter(row=>row.person_id===reference.id):[];
  const history=person?career.seasonHistory.map(season=>({year:season.year,standing:season.championship.drivers.find(row=>row.driverId===person.id)})).filter(row=>row.standing):[];
  return <><header className="profile-hero driver-profile-hero" style={{"--profile-accent":currentTeam?.primary??"#4779bd"} as React.CSSProperties}><div className="profile-monogram">{initials(name)}</div><div className="driver-profile-identity"><small>DRIVER PROFILE</small><h1>{name}</h1><p>{reference?.racing_nationality??grid?.nationality??"Nationality not recorded"}{(person?.carNumber??grid?.number)!=null?` · #${person?.carNumber??grid?.number}`:""}</p>{currentTeam?<TeamLink id={currentTeam.id} name={currentTeam.name}/>:<span className="profile-muted">No race assignment in this career</span>}</div><button className="negotiation-profile-button" onClick={()=>open({kind:"negotiation",id})}>Negotiate contract</button></header>
    <nav className="profile-section-nav" aria-label="Driver profile sections"><ProfileSectionLink target="driver-overview">Overview</ProfileSectionLink><ProfileSectionLink target="driver-attributes">Attributes</ProfileSectionLink><ProfileSectionLink target="driver-agreements">Contracts</ProfileSectionLink><ProfileSectionLink target="driver-records">History & records</ProfileSectionLink><ProfileSectionLink target="driver-database">All database records</ProfileSectionLink></nav>
    <div id="driver-overview" className="profile-grid"><Card title="Driver details"><dl className="profile-facts"><Detail label="First name" value={reference?.first_name}/><Detail label="Last name" value={reference?.last_name}/><Detail label="Date of birth" value={date(reference?.date_of_birth)}/><Detail label="Age at career date" value={age(reference?.date_of_birth,career.clock.date)}/><Detail label="Nationality" value={reference?.racing_nationality??grid?.nationality}/><Detail label="Place of birth" value={reference?.place_of_birth}/><Detail label="F1 debut season" value={reference?.f1_debut_season}/><Detail label="Career race team" value={currentTeam?<TeamLink id={currentTeam.id} name={currentTeam.shortName}/>:null}/></dl></Card>
    <Card title={`${career.season.year} · This career`}>{standing?<><dl className="profile-stat-grid"><Detail label="Points" value={standing.points}/><Detail label="Race wins" value={standing.wins}/><Detail label="Podiums" value={standing.podiums}/></dl><p className="profile-muted">Results from this saved career. Imported real-world totals are not combined with them.</p></>:<p>No championship entry recorded in this career.</p>}</Card>
    <div className="profile-wide"><DriverDatabaseInformation name={name} reference={reference} careerPersonId={person?.id}/></div>
    <Card title="Career history">{history.length?<div className="profile-record-list">{history.map(row=><article key={row.year}><small>{row.year} SEASON</small><strong>{row.standing!.points} points · {row.standing!.wins} wins · {row.standing!.podiums} podiums</strong><TeamLink id={row.standing!.teamId} name={teams.find(team=>team.id===row.standing!.teamId)?.shortName??row.standing!.teamId}/></article>)}</div>:<p>No completed seasons recorded for this driver.</p>}</Card>
    <div className="profile-wide"><ReferenceSource sourceKey={reference?.source_key} verifiedOn={reference?.verified_on}/></div></div>
  </>;
}
function DriverDatabaseInformation({name,reference,careerPersonId}:{name:string;reference?:Person;careerPersonId?:string}){
  const {career,catalogue,loading}=useProfiles();
  const drivers=matchingDriverRecords(catalogue.driverRecords,{name:reference?.display_name??name,dob:reference?.date_of_birth});
  const legacyContracts=linkedDriverRows(catalogue.driverContracts,drivers),stats=linkedDriverRows(catalogue.driverStats,drivers),ratings=linkedDriverRows(catalogue.driverRatings,drivers);
  const personId=reference?.id,slug=reference?.slug;
  const matches=(row:{person_id?:unknown;driver_slug?:unknown;person_slug?:unknown})=>personId!==undefined&&row.person_id===personId||!!slug&&(row.driver_slug===slug||row.person_slug===slug);
  const entries=catalogue.entries.filter(matches),published=catalogue.contracts.filter(matches),history=catalogue.driverHistory.filter(matches).sort((a,b)=>b.season-a.season);
  const scenarios=catalogue.startingContracts.filter(matches).sort((a,b)=>String(b.dataset_id).localeCompare(String(a.dataset_id)));
  const datasetIds=new Set(scenarios.map(r=>r.dataset_id));
  const latestId=catalogue.startingDatasets.filter(r=>datasetIds.has(r.id)).map(r=>String(r.id)).sort().at(-1);
  const latest=scenarios.filter(r=>r.dataset_id===latestId);
  const workforce=career.workforce.agreements.filter(a=>a.personId===careerPersonId);
  const referenceRows: {title:string;table:string;rows:DatabaseRow[]}[]=[
    {title:"Identity & biography",table:"people",rows:reference?[reference as unknown as DatabaseRow]:[]},
    {title:"Driver attributes & imported identity",table:"drivers",rows:drivers},
    {title:"Series entries",table:"series_entries",rows:entries as unknown as DatabaseRow[]},
    {title:"Year-by-year F1 history",table:"f1_driver_career_history",rows:history as unknown as DatabaseRow[]},
    {title:"Imported career totals",table:"driver_career_stats",rows:stats},
    {title:"Rating snapshots",table:"driver_rating_history",rows:ratings},
    {title:"Published contract references",table:"driver_contracts_2027",rows:published as unknown as DatabaseRow[]},
    {title:"Starting agreements · all versions",table:"f1_starting_driver_contracts",rows:scenarios},
    {title:"Starting seat assignments · all versions",table:"f1_starting_team_slots",rows:catalogue.startingSlots.filter(matches)},
    {title:"Reference seat assignments",table:"f1_team_driver_slots",rows:catalogue.slots.filter(matches) as unknown as DatabaseRow[]},
    {title:"Imported contracts · unverified",table:"driver_contracts",rows:legacyContracts},
    {title:"Recorded staff appointments",table:"f1_team_staff",rows:catalogue.staff.filter(matches) as unknown as DatabaseRow[]},
    {title:"Starting dataset definitions",table:"f1_starting_grid_datasets",rows:catalogue.startingDatasets.filter(r=>datasetIds.has(r.id))},
    {title:"Contract reference datasets",table:"f1_contract_reference_datasets",rows:catalogue.datasets.filter(d=>published.some(p=>p.dataset_id===d.id)) as unknown as DatabaseRow[]},
  ];
  const sourceKeys=new Set(referenceRows.flatMap(group=>group.rows.map(row=>row.source_key)).filter(Boolean));
  referenceRows.push({title:"Source records",table:"data_sources",rows:catalogue.sources.filter(s=>sourceKeys.has(s.source_key)) as unknown as DatabaseRow[]});
  return <div className="driver-database-sections">
    <section id="driver-attributes"><div className="profile-section-heading"><small>DATABASE ATTRIBUTES</small><h2>Ability, condition & development</h2><p>Assigned game ratings from the database. Attributes that have not been deliberately rated are marked Unrated; database defaults are not treated as ratings. These snapshots are separate from live career condition.</p></div>
      {drivers.length?drivers.map(driver=><div className="profile-grid" key={String(driver.id)}>{DRIVER_ATTRIBUTE_GROUPS.map(group=><Card key={group.title} title={group.title}><dl className="profile-rating-grid">{group.fields.map(key=>{const calculated=calculateDriverRatings(driver,reference?.date_of_birth??driver.date_of_birth,career.clock.date);const value=key==="current_overall_rating"?calculated.overall:key==="potential_rating"?calculated.potential:driver[key];const display=driverAttributeDisplay(key,value);return <div key={key}><dt>{key==="potential_rating"?"Estimated potential":databaseFieldLabel(key)}</dt><dd className={display.unrated?"profile-unrated":undefined}>{display.text}</dd>{display.rating!==null&&<meter min="0" max="100" value={display.rating} aria-label={databaseFieldLabel(key)}/>}</div>;})}</dl></Card>)}</div>):<Card title="Driver attributes"><p>{loading?"Loading driver attributes…":"No attribute record is stored for this driver. Ratings and condition have not been invented."}</p></Card>}
    </section>
    <section id="driver-agreements"><div className="profile-section-heading"><small>COMMITMENTS</small><h2>Contracts & appointments</h2><p>The database starting scenario, published reference material and this saved career are shown separately. Older imports are available in the complete records below.</p></div>
      <div className="profile-grid"><Card title="Latest database starting contracts">{latest.length?latest.map(row=><article className="profile-scenario" key={String(row.id)}><h3><TeamLink id={`ref:${row.team_id}`} name={catalogue.teams.find(t=>t.id===row.team_id)?.short_name??String(row.team_id)}/></h3><dl className="profile-facts">{["role","slot_number","start_season","end_season","seat_basis","term_basis","annual_salary_usd_cents","salary_basis","reference_status","reference_confirmed_through","reference_exact_end"].map(key=><Detail key={key} label={databaseFieldLabel(key)} value={databaseValueText(key,row[key])}/>)}</dl><p>{String(row.notes??"")}</p><DatabaseRecord row={row} title="All contract fields & sources"/></article>):<p>No starting-scenario agreement recorded.</p>}</Card>
      <Card title="Agreements in this saved career"><p className="profile-muted">Annual salaries are shown in USD. Stored assumptions do not establish a publicly disclosed salary or trigger payroll.</p>{workforce.length?workforce.map(row=><article className="profile-scenario" key={row.id}><TeamLink id={row.teamId} name={teams.find(t=>t.id===row.teamId)?.shortName}/><dl className="profile-facts"><Detail label="Role" value={row.role.replaceAll("_"," ")}/><Detail label="Term" value={`${row.startSeason}–${row.endSeason??"Not recorded"}`}/><Detail label="Annual salary" value={databaseValueText("annual_salary_usd_cents",row.salary)}/><Detail label="Salary basis" value={row.salaryBasis?.replaceAll("_"," ")}/><Detail label="Term basis" value={row.termBasis?.replaceAll("_"," ")}/></dl><DatabaseRecord row={row as unknown as DatabaseRow} title="All saved agreement fields"/></article>):<p>No saved workforce agreement.</p>}</Card>
      <div className="profile-wide"><CareerReserveContracts personId={slug??career.contractDesk?.baseline.people.find(p=>p.careerDriverId===careerPersonId)?.id}/></div>
      <div className="profile-wide"><Card title="Published contract references"><ContractList contracts={published}/></Card></div></div>
    </section>
    <section id="driver-records"><div className="profile-section-heading"><small>REFERENCE HISTORY</small><h2>Entries, statistics & rating history</h2><p>Historical snapshots may use different cut-off dates. Totals are kept separate and are never added to simulated career results.</p></div><div className="profile-grid">
      <Card title="Recorded series entries">{entries.length?<div className="profile-record-list">{entries.slice().sort((a,b)=>b.season-a.season).map((entry,index)=><article key={index}><small>{entry.season} · {entry.series} · {entry.entry_role.replaceAll("_"," ")}</small><TeamLink name={entry.entrant_name}/><span>{entry.car_number==null?"Car number not recorded":`Car #${entry.car_number}`}</span><DatabaseRecord row={entry as unknown as DatabaseRow} title="Entry details & source"/></article>)}</div>:<p>No series entry recorded.</p>}</Card>
      <Card title="Imported career statistics">{stats.length?stats.map((row,index)=><article className="profile-scenario" key={index}><small>Imported snapshot · {String(row.season??"season not recorded")}</small><dl className="profile-stat-grid">{["starts","wins","world_championships"].map(key=><Detail key={key} label={databaseFieldLabel(key)} value={databaseValueText(key,row[key])}/>)}</dl><DatabaseRecord row={row} title="All statistics fields"/></article>):<p>No imported career totals stored.</p>}</Card>
      <div className="profile-wide"><Card title="Recorded F1 seasons & team history">{history.length?<><div className="profile-history-table"><table><thead><tr>{["Season","Team","Starts","Wins","Podiums","Poles","Points","Position","Titles","Record"].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{history.map((row,index)=><tr key={index}><td>{row.season}</td><td><TeamLink id={row.team_slug??undefined} name={row.team_name}/></td><td>{row.starts}</td><td>{row.wins}</td><td>{row.podiums}</td><td>{row.poles}</td><td>{row.points}</td><td>{row.championship_position??"Not recorded"}</td><td>{row.titles_won}</td><td><DatabaseRecord row={row as unknown as DatabaseRow} title="Details"/></td></tr>)}</tbody></table></div><p>As recorded in the database; this history has no attached verification source or cut-off date.</p></>:<p>No historical season records stored.</p>}</Card></div>
      <div className="profile-wide"><Card title="Rating history">{ratings.length?ratings.slice().sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at))).map((row,index)=><DatabaseRecord key={index} row={row} driverAttributes title={`${row.season??"Undated season"} · overall ${row.overall_rating??"not recorded"} · ${row.recorded_at??"date not recorded"}`}/>):<p>No rating snapshots stored.</p>}</Card></div>
    </div></section>
    <section id="driver-database"><div className="profile-section-heading"><small>COMPLETE DATABASE RECORD</small><h2>All recorded driver information</h2><p>Open a category and record to inspect every stored field, including source links, dates, identifiers, null values and older versions. Imported contracts marked unverified are historical records, not the current game agreement.</p></div>
      <Card title="Database records by category"><div className="profile-database-groups">{referenceRows.map(group=><details key={group.table} className="profile-data-group"><summary>{group.title}<span>{group.rows.length} {group.rows.length===1?"record":"records"}</span></summary><p className="profile-muted">{group.table}</p>{group.rows.length?group.rows.map((row,index)=><DatabaseRecord key={index} row={row} title={recordTitle(row,index)} legacyTeam={group.table==="drivers"||group.table==="driver_contracts"} driverAttributes={group.table==="drivers"||group.table==="driver_rating_history"}/>):<p>No linked record stored.</p>}</details>)}</div></Card>
    </section>
  </div>;
}
function recordTitle(row:DatabaseRow,index:number){return [row.season??row.start_season,row.team_name??row.entrant_name,row.role??row.entry_role,row.display_name,row.dataset_id].filter(v=>v!==null&&v!==undefined).join(" · ")||`Record ${index+1}`;}
function DatabaseRecord({row,title,legacyTeam=false,driverAttributes=false}:{row:DatabaseRow;title:string;legacyTeam?:boolean;driverAttributes?:boolean}){
  const {catalogue}=useProfiles();
  function value(key:string,text:string):ReactNode{
    if(/^https:\/\//i.test(text))return <a href={text} className="profile-source-link" target="_blank" rel="noreferrer">{text} ↗</a>;
    if(key==="source_key") {const source=catalogue.sources.find(s=>s.source_key===row[key]);if(source&&sourceLink(source.url))return <a href={source.url} target="_blank" rel="noreferrer">{source.title} · {source.publisher} ({text}) ↗</a>;}
    if(key==="team_id"){if(legacyTeam){const team=catalogue.legacyTeams.find(t=>t.id===row[key]);if(team)return <><TeamLink id={typeof team.slug==="string"?team.slug:undefined} name={String(team.short_name??team.constructor_name??"Team")}/> · {text}</>;}else{const team=catalogue.teams.find(t=>t.id===row[key]);if(team)return <><TeamLink id={`ref:${team.id}`} name={team.short_name}/> · {text}</>;}}
    return text;
  }
  return <details className="profile-data-record"><summary>{title}</summary><dl className="profile-facts">{databaseFields(row,driverAttributes).map(field=><Detail key={field.key} label={field.label} value={value(field.key,field.value)}/>)}</dl></details>;
}
function ContractList({contracts}:{contracts:Contract[]}){
  const {catalogue}=useProfiles();
  if(!contracts.length)return <p>No published contract reference recorded. This does not establish free-agent status.</p>;
  return <div className="profile-record-list">{contracts.map(row=>{const team=catalogue.teams.find(team=>team.id===row.team_id),dataset=catalogue.datasets.find(item=>item.id===row.dataset_id);return <article key={row.id} className="profile-contract"><div className="profile-record-heading"><TeamLink id={team?`ref:${team.id}`:undefined} name={team?.short_name??"Team not recorded"}/><span className={`profile-status ${row.confirmation_status}`}>{row.confirmation_status}</span></div><small>{dataset?.season??2027} reference · {row.role.replaceAll("_"," ")} · checked {date(row.verified_on)}</small><dl className="profile-facts"><Detail label="Confirmed through at least" value={row.confirmed_through_season}/><Detail label="Exact expiry year" value={row.exact_end_year}/><ProfileContractSalary row={row}/></dl><p>{row.notes}</p>{sourceLink(row.source_url)&&<a className="profile-source-link" href={row.source_url} target="_blank" rel="noreferrer">Read contract source ↗</a>}</article>;})}</div>;
}
function TeamProfile({id}:{id:string}){
  const {career,catalogue,loading}=useProfiles();const {game,fact,name:entryName}=resolveTeam(catalogue,id);
  const entries=catalogue.entries.filter(row=>teamNameKey(row.entrant_name)===teamNameKey(entryName)||!!fact&&[fact.short_name,fact.official_full_name,game?.name??""].some(name=>teamNameKey(row.entrant_name)===teamNameKey(name)));
  if(!game&&!fact&&!entries.length)return loading?null:<Card title="Team not found"><p>This team is not in the loaded career or reference catalogue.</p></Card>;
  const name=fact?.official_full_name??game?.name??entryName;
  const lineup=game?career.workforce.lineups.find(row=>row.teamId===game.id&&row.season===career.season.year):undefined;
  const standing=game?career.championship.teams.find(row=>row.teamId===game.id):undefined;
  const drivers=(lineup?.driverIds??[]).map(driverId=>career.workforce.people.find(person=>person.id===driverId)).filter(person=>person!==undefined);
  const slots=fact?catalogue.slots.filter(row=>row.team_id===fact.id&&row.role==="reserve_driver").sort((a,b)=>a.slot_number-b.slot_number):[];
  const staff=fact?catalogue.staff.filter(row=>row.team_id===fact.id):[];
  const contracts=fact?catalogue.contracts.filter(row=>row.team_id===fact.id&&row.role==="race_driver"):[];
  return <><header className="profile-hero" style={{"--profile-accent":game?.primary??"#4779bd"} as React.CSSProperties}><div className="profile-monogram team">{(fact?.short_name??game?.shortName??entryName).slice(0,3).toUpperCase()}</div><div><small>TEAM PROFILE</small><h1>{name}</h1><p>{fact?[fact.base_city,fact.base_country].filter(Boolean).join(", "):game?.base??"Reference entry team"}</p><span className="profile-muted">{game?`${career.season.year} career constructor`:"Series entry catalogue"}</span></div></header>
    <TeamPalmaresBanner teamSlug={fact?.slug??game?.id} />
    {fact&&<TeamOwnership teamId={fact.id}/>}
    {fact&&<TeamBaselineDetails slug={fact.slug}/>}
    <div className="profile-grid"><Card title="Team details"><dl className="profile-facts"><Detail label="Official name" value={fact?.official_full_name??game?.name??entryName}/><Detail label="Legal name" value={fact?.legal_name}/><Detail label="Base" value={fact?[fact.base_city,fact.base_country].filter(Boolean).join(", "):game?.base}/><Detail label="Reference team chief" value={fact?.team_chief}/><Detail label="Reference technical chief" value={fact?.technical_chief}/><Detail label="Reference chassis" value={fact?.chassis}/><Detail label="Reference power unit" value={fact?.power_unit}/><Detail label="First F1 entry" value={fact?.first_team_entry}/></dl></Card>
    <Card title={`${career.season.year} · This career`}>{standing?<><dl className="profile-stat-grid"><Detail label="Points" value={standing.points}/><Detail label="Race wins" value={standing.wins}/><Detail label="Podiums" value={standing.podiums}/></dl><h3>Race driver line-up</h3><div className="profile-record-list">{drivers.map(driver=><article key={driver.id}><DriverLink id={driver.id} name={driver.name}/>{driver.carNumber!=null&&<small>Car #{driver.carNumber}</small>}</article>)}</div><p className="profile-muted">Saved lineup; published 2027 contract references below may differ.</p></>:<p>No constructor championship entry in this career.</p>}</Card>
    <div className="profile-wide"><TeamAttributeRatings slug={fact?.slug??game?.id} name={fact?.short_name??game?.shortName}/></div>
    {game&&<>{career.contractDesk?.reserveRosterVersion?<CareerReserveContracts teamId={game.id}/>:<Card title="2027 reserve reference slots">{slots.length?slots.map(slot=>{const person=catalogue.people.find(person=>person.id===slot.person_id);return <div className="profile-slot" key={`${slot.dataset_id}-${slot.slot_number}`}><small>RESERVE {slot.slot_number}</small>{person?<DriverLink id={`person:${person.id}`} name={person.display_name}/>:<strong>Vacant</strong>}<span>{slot.assignment_status}</span></div>;}):<p>No reserve reference assignments loaded.</p>}<p className="profile-muted">Reference capacity only. Recruitment and race substitution are not implemented.</p></Card>}
    <Card title="Reference personnel">{staff.length?<div className="profile-record-list">{staff.map(row=>{const person=catalogue.people.find(p=>p.id===row.person_id);return <article key={`${row.person_id}-${row.role_title}`}>{person?<StaffLink id={`person:${person.id}`} name={person.display_name}/>:<strong>Name not recorded</strong>}<small>{row.season} · {row.role_title}</small></article>})}</div>:<p>No personnel reference records loaded.</p>}</Card></>}
    <div className="profile-wide"><Card title="Published race-driver commitments">{contracts.length?<div className="profile-record-list">{contracts.map(row=>{const person=catalogue.people.find(person=>person.id===row.person_id);return <article key={row.id}><div className="profile-record-heading">{person?<DriverLink id={`person:${person.id}`} name={person.display_name}/>:<strong>Name not recorded</strong>}<span className={`profile-status ${row.confirmation_status}`}>{row.confirmation_status}</span></div><p>{row.notes}</p><span>{row.exact_end_year?`Exact expiry: ${row.exact_end_year}`:row.confirmed_through_season?`Confirmed through at least ${row.confirmed_through_season}; exact expiry not recorded`:"2027 coverage not independently confirmed"}</span><dl className="profile-facts"><ProfileContractSalary row={row}/></dl>{sourceLink(row.source_url)&&<a className="profile-source-link" href={row.source_url} target="_blank" rel="noreferrer">Source ↗</a>}</article>;})}</div>:<p>No contract reference recorded.</p>}</Card></div>
    <div className="profile-wide"><Card title="Recorded series entries">{entries.length?<div className="profile-entry-grid">{entries.map((entry,index)=>{const person=catalogue.people.find(person=>person.id===entry.person_id);return <article key={`${entry.person_id}-${index}`}><small>{entry.season} · {entry.series} · {entry.entry_role.replaceAll("_"," ")}</small>{person?<DriverLink id={`person:${person.id}`} name={person.display_name}/>:<strong>Name not recorded</strong>}</article>;})}</div>:<p>No series-entry reference records loaded.</p>}</Card></div>
    <div className="profile-wide"><ReferenceSource sourceKey={fact?.source_key??entries[0]?.source_key} verifiedOn={fact?.verified_on??entries[0]?.verified_on}/></div></div>
  </>;
}
function TeamAttributeRatings({slug,name}:{slug?:string;name?:string}){
  const {catalogue,loading}=useProfiles();
  const row=matchingTeamRecord(catalogue.legacyTeams,slug,name);
  if(!row)return loading?<p className="profile-muted">Loading team attributes…</p>:null;
  const teamSlug=slug==="red-bull"?"red-bull-racing":slug;
  const baseline=catalogue.teamBaselines.find(item=>item.team_slug===teamSlug&&item.dataset_version==="f1-team-baseline-2027-v1");
  const ratings=baseline?.ratings&&typeof baseline.ratings==="object"?baseline.ratings as Record<string,unknown>:undefined;
  const groups=teamRatingGroups(row,ratings);
  return <Card title="Team attributes">{baseline?.storage==="local_preview"&&<p className="profile-muted">Local preview · database migration pending</p>}<p className="profile-muted">{ratings?"2027 starting ratings are game-balance assumptions. They do not yet activate management systems.":"Team ratings have not been allocated yet. Unassigned attributes are marked Unrated; stored database defaults are not treated as ratings."}</p><div className="profile-database-groups team-rating-groups">{groups.map(group=><details className="profile-data-group" key={group.title} open={group.title==="Identity & reputation"}><summary>{group.title}<span>{group.fields.length} attributes</span></summary><dl className="profile-rating-grid">{group.fields.map(field=><div key={field.key}><dt>{field.label}</dt><dd className={field.text==="Unrated"?"profile-unrated":undefined}>{field.text}</dd></div>)}</dl></details>)}</div></Card>;
}
function TeamBaselineDetails({slug}:{slug:string}){
  const {catalogue}=useProfiles();const row=catalogue.teamBaselines.find(item=>item.team_slug===slug&&item.dataset_version==="f1-team-baseline-2027-v1");
  if(!row)return null;
  return <div className="profile-wide"><Card title="2027 team starting assumptions">{row.storage==="local_preview"&&<p className="profile-muted">Local preview · database migration pending</p>}<p className="profile-muted">Game-balance estimates, not verified financial statements or live career values. Facilities and finances are not activated by these records.</p><div className="profile-database-groups">{([["facilities","Facilities & condition"],["financial_assumptions_usd_millions","Financial assumptions · USD millions"],["objectives","Starting objectives"]] as const).map(([key,label])=>{const values=row[key] as Record<string,unknown>|undefined;return values?<details className="profile-data-group" key={key}><summary>{label}<span>{Object.keys(values).length} values</span></summary><dl className="profile-facts">{Object.entries(values).map(([field,value])=><Detail key={field} label={databaseFieldLabel(field)} value={value===null?"Not recorded":typeof value==="boolean"?(value?"Yes":"No"):String(value)}/>)}</dl></details>:null;})}</div></Card></div>;
}
function TeamOwnership({teamId}:{teamId:number}){
  const {catalogue}=useProfiles();
  const links=catalogue.teamOwnership.filter(r=>r.team_id===teamId&&r.dataset_version==="f1-team-baseline-2027-v1");
  if(!links.length)return null;
  return <div className="profile-wide"><Card title="Starting ownership">{links[0]?.storage==="local_preview"&&<p className="profile-muted">Local preview · database migration pending</p>}<p className="profile-muted">Based on published ownership and backing; continuation into 2027 is a game assumption. Unpublished ownership stakes remain unrecorded.</p><div className="profile-record-list">{links.map((link,index)=>{const owner=catalogue.teamOwners.find(o=>o.id===link.owner_id);return <article key={String(link.id??index)}><strong>{String(owner?.name??"Owner not recorded")}</strong><small>{String(link.relationship??"").replaceAll("_"," ")}{typeof link.ownership_percentage==="number"?` · ${link.ownership_percentage}%`:" · stake not recorded"}</small>{typeof link.source_url==="string"&&<a className="profile-source-link" href={link.source_url} target="_blank" rel="noreferrer">Ownership source ↗</a>}</article>;})}</div></Card></div>;
}
function CareerReserveContracts({personId,teamId}:{personId?:string;teamId?:string}){
  const {career}=useProfiles();const desk=career.contractDesk;
  if(!desk?.reserveRosterVersion||!personId&&!teamId)return null;
  const facts=desk.baseline.facts.filter(f=>f.role==="reserve_driver"&&(!personId||f.personId===personId)&&(!teamId||f.teamId===teamId));
  if(!facts.length)return null;
  return <Card title="Career reserve contracts"><div className="profile-record-list">{facts.map(f=>{
    const driver=desk.baseline.people.find(p=>p.id===f.personId),salary=contractSalary(desk,f);
    const slot=desk.baseline.slots.find(s=>s.teamId===f.teamId&&s.role==="reserve_driver"&&s.personId===f.personId);
    const shared=desk.baseline.facts.filter(other=>other.role==="reserve_driver"&&other.personId===f.personId).length>1;
    return <article key={f.id}>{teamId&&driver?<DriverLink id={driver.careerDriverId??driver.id} name={driver.name}/>:<TeamLink id={f.teamId} name={teams.find(t=>t.id===f.teamId)?.shortName}/>}
      <small>Reserve {slot?.number??""} · {slot?.status.replaceAll("_"," ")} · {shared?"Shared arrangement":"Team appointment"}</small>
      <strong>{salary.annualCents===null?"Salary not recorded":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(salary.annualCents/100)+" / year"}</strong>
      <small>F1 reserve retainer · game estimate · game term through {f.scenarioTerms?.endSeason??2027}</small>
      <ContractClauses package={f.clausePackage}/>
      <a className="profile-source-link" href={f.sourceUrl} target="_blank" rel="noreferrer">Team connection source ↗</a>
    </article>;
  })}</div><p className="profile-muted">Unconfirmed 2027 appointments are game assumptions. Race substitution, eligibility and event availability checks are not yet implemented.</p></Card>;
}
function ProfileContractSalary({row}:{row:Contract}){
  const {career,catalogue}=useProfiles();
  const desk=career.contractDesk;
  const reference=catalogue.people.find(p=>p.id===row.person_id);
  const saved=desk?.baseline.facts.find(f=>f.id===row.id||(f.personId===reference?.slug&&f.role===row.role&&f.teamId===resolveTeam(catalogue,`ref:${row.team_id}`).game?.id));
  const salary=saved&&desk?contractSalary(desk,saved):null;
  const estimate=assumedDriverSalary(reference?.slug??"",row.role)??assumedDriverSalary(reference?.display_name??"",row.role);
  const amount=salary?.annualCents??row.annual_salary_usd_cents??estimate;
  const estimated=salary?.annualCents!=null?salary.basis==="game_estimate":row.annual_salary_usd_cents===null&&estimate!==null;
  return <><Detail label={estimated?"Annual salary · game estimate":"Annual salary"} value={amount==null?null:new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(amount/100)}/>{saved?.scenarioTerms&&<Detail label={saved.scenarioTerms.endBasis==="published_exact"?"Game contract expiry":"Game contract expiry · assumption"} value={saved.scenarioTerms.endSeason}/>}<ContractClauses package={saved?.clausePackage}/></>;
}
function ReferenceSource({sourceKey,verifiedOn}:{sourceKey?:string;verifiedOn?:string}){
  const {catalogue}=useProfiles();const source=catalogue.sources.find(row=>row.source_key===sourceKey);
  return <Card title="Reference provenance"><p>Reference catalogue information and simulated career results are kept separate. Unavailable terms are not estimated.</p><dl className="profile-facts"><Detail label="Reference checked" value={verifiedOn?date(verifiedOn):null}/><Detail label="Source record" value={sourceKey}/><Detail label="Publisher" value={source?.publisher}/></dl>{source&&sourceLink(source.url)&&<a className="profile-source-link" href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>}</Card>;
}

function TeamPalmaresBanner({teamSlug}:{teamSlug?:string}){
  const {catalogue}=useProfiles();
  const achievement=catalogue.teamAchievements?.find(t=>t.team_slug===teamSlug||(teamSlug==="red-bull"&&t.team_slug==="red-bull-racing"));
  if(!achievement)return null;
  return <div className="profile-wide"><Card title="Formula One Palmarès & Achievements">
    <dl className="profile-stat-grid">
      <Detail label="Constructors' Titles" value={achievement.constructors_championships} />
      <Detail label="Drivers' Titles" value={achievement.drivers_championships} />
      <Detail label="All-time Wins" value={achievement.race_wins} />
      <Detail label="Podiums" value={achievement.podiums} />
      <Detail label="Pole Positions" value={achievement.pole_positions} />
      <Detail label="Fastest Laps" value={achievement.fastest_laps} />
    </dl>
    {achievement.notable_achievements&&<p className="profile-muted" style={{marginTop:"0.5rem"}}>{achievement.notable_achievements}</p>}
  </Card></div>;
}

function DriverHistoricalStints({driverSlug}:{driverSlug?:string}){
  const {catalogue}=useProfiles();
  const stints=(catalogue.driverHistory??[]).filter(s=>s.driver_slug===driverSlug).sort((a,b)=>b.season-a.season);
  if(!stints.length)return null;
  return <Card title="Official F1 Career Stints & Records">
    <div className="profile-record-list">
      {stints.map((stint,idx)=>(
        <article key={`${stint.season}-${stint.team_name}-${idx}`}>
          <div className="profile-record-heading">
            <small>{stint.season} SEASON · {stint.team_slug?<TeamLink id={stint.team_slug} name={stint.team_name}/>:stint.team_name}</small>
            {stint.titles_won>0&&<span className="profile-status confirmed">🏆 World Champion</span>}
          </div>
          <p>
            <strong>{stint.starts} starts</strong> · {stint.wins} wins · {stint.podiums} podiums · {stint.poles} poles · {stint.points} points
            {stint.championship_position!=null?(" (P" + stint.championship_position + " in WDC)"):""}
          </p>
        </article>
      ))}
    </div>
  </Card>;
}
