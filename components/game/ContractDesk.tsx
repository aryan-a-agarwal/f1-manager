"use client";

import {ContractClauses} from "./ContractClauses";
import {ensureCareerReserves} from "@/lib/career/reserves";
import {useEffect,useRef,useState} from "react";
import {saveCareer,type CareerState} from "@/lib/career";
import {ensureContractSalaries,contractSalary,contractDraftIssues,initializeContractDesk,parseContractSalary,saveContractDraft,withdrawContractDraft,type ContractBaseline,type ContractDraft,type ContractRole} from "@/lib/career/contracts";
import {normalizedName} from "@/lib/profileNavigation";
import {teams} from "@/lib/data/grid";
import {DriverLink,TeamLink,resolveTeam,useProfiles} from "./Profiles";

const usd=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(cents/100);
const roleName=(role:ContractRole)=>role==="race_driver"?"Race driver":"Reserve driver";
type DraftForm={id:string;personId:string;role:ContractRole;seat:1|2;startSeason:number;seasons:number;salary:string};

export default function ContractDesk({career,updateCareer}:{career:CareerState;updateCareer:(career:CareerState)=>void}){
  const {catalogue,loading,open}=useProfiles();
  const [error,setError]=useState<string|null>(null),[message,setMessage]=useState("");
  const [scope,setScope]=useState("own"),[query,setQuery]=useState("");
  const initial=():DraftForm=>({id:"",personId:"",role:"race_driver",seat:1,startSeason:career.season.year+1,seasons:1,salary:""});
  const [form,setForm]=useState<DraftForm>(initial);
  const attempted=useRef(false);
  function initialize(){
    try{
      const dataset=catalogue.datasets.filter(d=>d.season===2027).sort((a,b)=>b.as_of_date.localeCompare(a.as_of_date))[0];
      if(!dataset)throw new Error("The 2027 contract dataset is unavailable. Your career is unchanged.");
      const people=catalogue.people.filter(p=>p.person_type.includes("driver"));
      const identity=new Map(people.map(p=>[p.id,p.slug]));
      const teamId=(id:number)=>{
        const resolved=resolveTeam(catalogue,`ref:${id}`).game?.id;
        if(!resolved)throw new Error("A reference team could not be mapped. Setup was not saved.");
        return resolved;
      };
      const baseline:ContractBaseline={datasetId:dataset.id,season:dataset.season,asOfDate:dataset.as_of_date,capturedOn:career.clock.date,
        people:people.map(p=>({id:p.slug,name:p.display_name,careerDriverId:career.workforce.people.find(w=>w.kind==="driver"&&normalizedName(w.name)===normalizedName(p.display_name))?.id??null})),
        facts:catalogue.contracts.filter(f=>f.dataset_id===dataset.id).map(f=>({id:f.id,personId:identity.get(f.person_id)??"",teamId:teamId(f.team_id),role:f.role as ContractRole,status:f.confirmation_status as "confirmed"|"reported"|"unconfirmed",minimumEnd:f.confirmed_through_season,exactEnd:f.exact_end_year,salaryCents:f.annual_salary_usd_cents,sourceUrl:f.source_url,checkedOn:f.verified_on,notes:f.notes})),
        slots:catalogue.slots.filter(s=>s.dataset_id===dataset.id).map(s=>({teamId:teamId(s.team_id),role:s.role as ContractRole,number:s.slot_number as 1|2,personId:s.person_id===null?null:identity.get(s.person_id)??"",status:s.assignment_status})),
      };
      const saved=saveCareer(initializeContractDesk(career,baseline));
      updateCareer(saved);setError(null);
    }catch(e){setError(e instanceof Error?e.message:"Contract setup failed.");}
  }
  useEffect(()=>{
    if(career.contractDesk){
      try{const updated=ensureContractSalaries(ensureCareerReserves(career));if(updated!==career)updateCareer(saveCareer(updated));}catch(e){setError(e instanceof Error?e.message:"Salary values could not be saved.");}
      return;
    }
    if(loading||attempted.current)return;
    attempted.current=true;initialize();
    // Import once, after reference loading. Subsequent database refreshes cannot alter this baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loading,career.contractDesk]);

  const desk=career.contractDesk;
  if(!desk)return <section className="contract-panel"><h2>Contract desk</h2><p>{loading?"Loading contract references…":"Preparing this career's contract baseline."}</p>{error&&<><p role="alert">{error}</p><button onClick={initialize}>Retry contract setup</button></>}</section>;
  const baseline=desk.baseline;
  const candidates=[...baseline.people,...catalogue.people.filter(p=>p.person_type.includes("driver")&&!baseline.people.some(b=>b.id===p.slug)).map(p=>({id:p.slug,name:p.display_name,careerDriverId:career.workforce.people.find(w=>normalizedName(w.name)===normalizedName(p.display_name))?.id??null}))];
  const person=(id:string)=>candidates.find(p=>p.id===id);
  const facts=baseline.facts.filter(f=>(scope==="all"||f.teamId===career.player.teamId)&&normalizedName(`${person(f.personId)?.name} ${teams.find(t=>t.id===f.teamId)?.name}`).includes(normalizedName(query)));
  const slots=baseline.slots.filter(s=>s.teamId===career.player.teamId).sort((a,b)=>a.role.localeCompare(b.role)||a.number-b.number);
  const lineup=career.workforce.lineups.find(l=>l.teamId===career.player.teamId&&l.season===career.season.year);
  const ownDrafts=desk.drafts.filter(d=>d.teamId===career.player.teamId);
  function submit(){
    try{
      const id=form.id||crypto.randomUUID();
      const selected=candidates.find(p=>p.id===form.personId);
      const draftCareer=selected&&!baseline.people.some(p=>p.id===selected.id)?{...career,contractDesk:{...desk!,baseline:{...baseline,people:[...baseline.people,selected]}}}:career;
      const saved=saveCareer(saveContractDraft(draftCareer,{id,personId:form.personId,role:form.role,seat:form.seat,startSeason:form.startSeason,seasons:form.seasons,salaryCents:parseContractSalary(form.salary)}));
      updateCareer(saved);setForm({...form,id});setError(null);setMessage("Draft saved. No offer has been sent and no seat or money has been committed.");
    }catch(e){setError(e instanceof Error?e.message:"Draft could not be saved.");setMessage("");}
  }
  function withdraw(id:string){try{updateCareer(saveCareer(withdrawContractDraft(career,id)));setError(null);setMessage("Draft withdrawn. Its history has been retained.");if(form.id===id)setForm(initial());}catch(e){setError(e instanceof Error?e.message:"Withdrawal failed.");}}
  return <div className="contract-desk">
    <header className="contract-heading"><div><small>TEAM MANAGEMENT</small><h1>Driver contracts</h1><p>Reference commitments and career agreements</p></div><span className="contract-tag">Negotiations & appointments</span></header>
    <div className="contract-baseline"><strong>Saved reference · {baseline.season}</strong><span>{baseline.datasetId} · verified {baseline.asOfDate} · captured in-game {baseline.capturedOn}</span><p>The starting reference stays with your save. Agreed terms and signed career appointments are shown separately.</p></div>
    {!baseline.facts.some(f=>f.scenarioTerms)&&<p className="contract-message">This existing career keeps its original roster and references. New 2027 saves use the updated 19 confirmed seats and three assumed continuations, with Câmara replacing Ocon at Haas.</p>}
    {desk.reserveRosterVersion&&<p className="contract-message">Two reserve appointments per team · salaries cover F1 reserve duties only. Unconfirmed 2027 appointments are game assumptions. Shared assignments require event availability checks.</p>}
    {error&&<p className="contract-alert" role="alert">{error}</p>}{message&&<p className="contract-message" role="status">{message}</p>}
    <section className="contract-panel"><h2>Your team's seats</h2><div className="contract-seats">{slots.map(slot=>{
      const reference=slot.personId?person(slot.personId):undefined;
      const currentId=slot.role==="race_driver"?lineup?.driverIds[slot.number-1]:lineup?.reserveDriverIds?.[slot.number-1];
      const driver=career.workforce.people.find(p=>p.id===currentId);
      const different=driver&&reference&&driver.id!==reference.careerDriverId;
      return <article key={`${slot.role}-${slot.number}`}><small>{roleName(slot.role)} · Seat {slot.number}</small><strong>{reference?<DriverLink id={reference.id} name={reference.name}/>:"No confirmed reference assignment"}</strong><span>{slot.status.replaceAll("_"," ")}</span>{driver&&<p>Career line-up: <DriverLink id={driver.id} name={driver.name}/></p>}{different&&<p className="contract-warning">Career roster differs from the reference. Reconciliation is required before binding changes.</p>}{slot.role==="reserve_driver"&&<><p>{desk.reserveRosterVersion?"Reserve appointment · call-up depends on availability.":"Reference capacity; no career reserve appointment yet."}</p>{reference&&baseline.facts.filter(f=>f.teamId===slot.teamId&&f.role==="reserve_driver"&&f.personId===reference.id).map(f=>{const salary=contractSalary(desk,f);return <p key={f.id}>{salary.annualCents===null?"Salary not recorded":`${usd(salary.annualCents)} / year · game estimate`}</p>;})}</>}</article>;
    })}</div></section>
    <section className="contract-panel"><div className="contract-section-heading"><h2>{baseline.facts.some(f=>f.scenarioTerms)?"Starting contract baseline":"Published commitments"}</h2><div><label>Show <select value={scope} onChange={e=>setScope(e.target.value)}><option value="own">My team</option><option value="all">All teams</option></select></label><input aria-label="Search contract references" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search driver or team"/></div></div>
      <div className="contract-table-scroll"><table><thead><tr><th>Driver / team</th><th>Role / evidence</th><th>Coverage</th><th>Annual salary</th><th>Source</th></tr></thead><tbody>{facts.map(f=>{
        const p=person(f.personId),salary=contractSalary(desk,f);return <tr key={f.id}><td>{p&&<DriverLink id={p.id} name={p.name}/>}<small><TeamLink id={f.teamId} name={teams.find(t=>t.id===f.teamId)?.name}/></small></td><td>{roleName(f.role)}<small>{f.scenarioTerms?(f.scenarioTerms.seatBasis==="confirmed"?"Confirmed 2027 seat":"Retained · game assumption"):f.status}</small></td><td>{f.scenarioTerms&&<><strong>Game contract ends {f.scenarioTerms.endSeason}</strong><small>{f.scenarioTerms.endBasis==="published_exact"?"Published expiry":"Assumed game expiry"}</small></>}{f.exactEnd!==null?`Ends after ${f.exactEnd}`:f.minimumEnd!==null?`${f.status==="confirmed"?"Confirmed":"Reference coverage"} through at least ${f.minimumEnd}`:"Coverage requires review"}<small>{f.exactEnd===null?"Exact expiry not recorded":"Exact expiry recorded"}</small></td><td>{salary.annualCents===null?"Not recorded":usd(salary.annualCents)}<small>{salary.basis==="game_estimate"?"Game estimate":salary.basis==="reference"?"Reference salary":""}</small></td><td><a href={f.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a><small>Checked {f.checkedOn}</small></td></tr>;
      })}</tbody></table></div>{!facts.length&&<p>No matching contract references.</p>}<p className="contract-muted">Annual game estimates supply playable salary values where private pay is undisclosed. They are separate from the sourced contract facts and do not trigger payments. An unknown expiry does not establish free-agent status.</p>
    </section>
    <section className="contract-panel"><h2>Starting contract clauses</h2><p className="contract-muted">Assumed game terms for the appointments shown by the filters above. Existing salaries and expiry dates are unchanged.</p>{facts.filter(f=>f.clausePackage).map(f=><article key={f.id}><h3>{person(f.personId)?.name} · {teams.find(t=>t.id===f.teamId)?.name}</h3><ContractClauses package={f.clausePackage}/></article>)}{!facts.some(f=>f.clausePackage)&&<p>No clause packages recorded for these appointments.</p>}</section>
    <div className="contract-columns"><section className="contract-panel"><h2>{form.id?"Edit offer draft":"Plan an offer"}</h2><p className="contract-muted">Drafts start next season or later. They do not reserve seats or contact drivers.</p><form onSubmit={e=>{e.preventDefault();submit();}} className="contract-form">
      <label>Driver<select required value={form.personId} onChange={e=>setForm({...form,personId:e.target.value})}><option value="">Choose a driver</option>{candidates.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value as ContractRole})}><option value="race_driver">Race driver</option><option value="reserve_driver">Reserve driver</option></select></label>
      <label>Seat<select value={form.seat} onChange={e=>setForm({...form,seat:Number(e.target.value) as 1|2})}><option value="1">Seat 1</option><option value="2">Seat 2</option></select></label>
      <label>First season<input required type="number" min={career.season.year+1} max={career.season.year+5} value={form.startSeason} onChange={e=>setForm({...form,startSeason:Number(e.target.value)})}/></label>
      <label>Duration<select value={form.seasons} onChange={e=>setForm({...form,seasons:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} season{n>1?"s":""}</option>)}</select></label>
      <label>Proposed annual salary · USD<input required inputMode="decimal" placeholder="Enter your proposed amount" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})}/></label>
      <div className="contract-form-actions"><button type="submit">Save draft</button><button type="button" onClick={()=>{setForm(initial());setMessage("");setError(null);}}>New draft</button></div>
    </form></section>
    <section className="contract-panel"><h2>Saved offer drafts</h2>{!ownDrafts.length&&<p>No offers drafted yet.</p>}{ownDrafts.map(d=>{
      const p=person(d.personId);return <article className="contract-draft" key={d.id}><div className="contract-section-heading"><strong>{p&&<DriverLink id={p.id} name={p.name}/>}</strong><span className="contract-tag">{d.status}</span></div><p>{roleName(d.role)} · Seat {d.seat} · {d.negotiation?`${d.negotiation.startDate} → ${d.negotiation.endDate}`:`${d.startSeason}–${d.startSeason+d.seasons-1}`}</p><p>{usd(d.salaryCents)} / year · {d.negotiation?`${d.negotiation.clauses.length} proposed clauses · open proposal for prorated costs`: `${usd(d.salaryCents*d.seasons)} total proposed`}</p>{d.status==="draft"&&<><ul>{contractDraftIssues(career,d).map(issue=><li key={issue}>{issue}</li>)}</ul><div className="contract-form-actions"><button onClick={()=>{if(d.negotiation){open({kind:"negotiation",id:d.personId});return;}setForm({id:d.id,personId:d.personId,role:d.role,seat:d.seat,startSeason:d.startSeason,seasons:d.seasons,salary:(d.salaryCents/100).toFixed(2)});setMessage("");}}>{d.negotiation?"View negotiation":"Edit draft"}</button>{!d.offerState&&<button onClick={()=>withdraw(d.id)}>Withdraw draft</button>}</div></>}</article>;
    })}</section></div>
  </div>;
}
