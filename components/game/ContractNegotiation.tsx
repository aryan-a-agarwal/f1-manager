"use client";
import {useState} from 'react';
import {saveCareer,loadCareer} from '@/lib/career';
import {contractSalary,ensureContractSalaries,saveContractDraft,type ContractRole} from '@/lib/career/contracts';
import {negotiationCosts,OFFER_CLAUSES,type OfferClause,type NegotiationTerms} from '@/lib/career/negotiation';
import {contractStartOptions,contractStartDateLabel,outgoingContractStartOption} from '@/lib/career/contractStartOptions';
import {respondToOffer,acceptCounter,cancelNegotiation,reopenNegotiation,canonicalOffer,patienceLabel,type Offer,type OfferNegotiation} from '@/lib/career/offerNegotiation';
import {negotiationContext} from '@/lib/career/negotiationContext';
import {appointmentBlockers,signAgreedContract} from '@/lib/career/contractAppointments';
import {matchingDriverRecords} from '@/lib/driverProfileData';
import {calculateDriverRatings} from '@/lib/driverRatings';
import {teams} from '@/lib/data/grid';
import {DriverLink,resolveDriver,resolveTeam,useProfiles} from './Profiles';

const usd=(cents:number|null)=>cents===null?'Unresolved':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents/100);
export function ContractNegotiation({id}:{id:string}){
  const {career,catalogue,loading}=useProfiles();
  const driver=resolveDriver(career,catalogue,id);
  const name=driver.reference?.display_name??driver.person?.name??driver.grid?.name??(driver.legacy?String(driver.legacy['driver-name']??[driver.legacy.first_name,driver.legacy.last_name].filter(Boolean).join(' ')):null);
  const personId=driver.reference?.slug??career.contractDesk?.baseline.people.find(p=>p.careerDriverId===driver.person?.id)?.id??id;
  if(!name)return <p>{loading?'Loading driver…':'Driver not found.'}</p>;
  if(!career.contractDesk)return <p>The saved contract baseline is unavailable. Open Team → Contracts to initialise it.</p>;
  return <NegotiationForm key={personId} personId={personId} profileId={id} name={name} careerDriverId={driver.person?.id??null}/>;
}
function NegotiationForm({personId,profileId,name,careerDriverId}:{personId:string;profileId:string;name:string;careerDriverId:string|null}){
  const {career,updateCareer,catalogue}=useProfiles();
  const working=ensureContractSalaries(career),desk=working.contractDesk!;
  const existing=desk.drafts.filter(d=>d.personId===personId&&d.teamId===career.player.teamId&&d.status==='draft'&&d.negotiation).at(-1);
  const agreed=existing?.offerState?.acceptedOffer;
  const displayed=agreed??(existing?.offerState?.status==='open'?existing.offerState.rounds.at(-1)?.counter:undefined);
  const fact=desk.baseline.facts.find(f=>f.personId===personId);
  const referenceSalaryInfo=fact?contractSalary(desk,fact):null;
  const referenceSalary=referenceSalaryInfo?.annualCents??null;
  const birthDate=catalogue.people.find(p=>p.slug===personId)?.date_of_birth??null;
  const attributes=matchingDriverRecords(catalogue.driverRecords,{name,dob:birthDate})[0]??{};
  const ability=calculateDriverRatings(attributes,birthDate,career.clock.date).overall;
  const achievements=catalogue.teamAchievements.filter(a=>Number.isFinite(a.race_wins)&&Number.isFinite(a.constructors_championships)).sort((a,b)=>b.race_wins-a.race_wins||b.constructors_championships-a.constructors_championships);
  const teamReputation=Object.fromEntries(achievements.flatMap((entry,index)=>{const team=resolveTeam(catalogue,entry.team_slug).game;return team?[[team.id,1-index/Math.max(1,achievements.length-1)]]:[];}));
  const context=negotiationContext(working,personId,{dateOfBirth:birthDate,ability,loyalty:typeof attributes.loyalty==='number'?attributes.loyalty:null,teamReputation});
  const [draftId,setDraftId]=useState(existing?.id??'');
  const [offerState,setOfferState]=useState<OfferNegotiation|undefined>(existing?.offerState);
  const [role,setRole]=useState<ContractRole>(displayed?.role??existing?.role??'race_driver');
  const [seat,setSeat]=useState<1|2>(displayed?.seat??existing?.seat??1);
  const [salary,setSalary]=useState(displayed?String(displayed.salaryCents/100):existing?String(existing.salaryCents/100):referenceSalary===null?'':String(referenceSalary/100));
  const [terms,setTerms]=useState<NegotiationTerms>(displayed?.terms??existing?.negotiation??{startDate:`${career.season.year+1}-01-01`,endDate:`${career.season.year+1}-12-31`,clauses:[]});
  const [financialTab,setFinancialTab]=useState<"summary"|"release"|"schedule"|"conditional">("summary");
  const [issueIndex,setIssueIndex]=useState(0);
  const [contractSeasons,setContractSeasons]=useState(()=>{const t=displayed?.terms??existing?.negotiation;return t?Math.max(1,Math.min(5,Number(t.endDate.slice(0,4))-Number(t.startDate.slice(0,4))+1)):1;});
  const [startChoice,setStartChoice]=useState<string>('');
  const [addKind,setAddKind]=useState<OfferClause['kind']>('signing');
  const [message,setMessage]=useState(''),[error,setError]=useState('');
  const cents=/^\d+(\.\d{1,2})?$/.test(salary)?Math.round(Number(salary)*100):0;
  let costs:ReturnType<typeof negotiationCosts>|undefined,validation='';
  try{costs=negotiationCosts(working,personId,role,seat,cents,terms);}catch(e){validation=e instanceof Error?e.message:'Invalid offer.';}
  function editTerms(next:NegotiationTerms){setTerms(next);setMessage('');}
  function save(nextState:OfferNegotiation,nextOffer?:Offer){
    try{
      const current=nextOffer??{role,seat,salaryCents:cents,terms};
      negotiationCosts(working,personId,current.role,current.seat,current.salaryCents,current.terms);
      const latest=loadCareer();
      if(latest&&latest.metadata.revision!==career.metadata.revision)throw new Error('The career changed in another tab. Reload before continuing so no negotiation progress is lost.');
      const nextId=draftId||crypto.randomUUID();
      const baseline=desk.baseline.people.some(p=>p.id===personId)?desk.baseline:{...desk.baseline,people:[...desk.baseline.people,{id:personId,name,careerDriverId}]};
      const saved=saveCareer(saveContractDraft({...working,contractDesk:{...desk,baseline}},{id:nextId,personId,role:current.role,seat:current.seat,startSeason:Number(current.terms.startDate.slice(0,4)),seasons:Number(current.terms.endDate.slice(0,4))-Number(current.terms.startDate.slice(0,4))+1,salaryCents:current.salaryCents,negotiation:current.terms,offerState:nextState}));
      updateCareer(saved);setDraftId(nextId);setOfferState(nextState);setError('');setMessage('Negotiation saved.');
      if(nextOffer){setRole(nextOffer.role);setSeat(nextOffer.seat);setSalary(String(nextOffer.salaryCents/100));setTerms(nextOffer.terms);setContractSeasons(Number(nextOffer.terms.endDate.slice(0,4))-Number(nextOffer.terms.startDate.slice(0,4))+1);setStartChoice('');}
    }catch(e){setError(e instanceof Error?e.message:'Could not save proposal.');}
  }
  function submitOffer(){try{const matchingFact=desk.baseline.facts.find(f=>f.personId===personId&&f.role===role&&contractSalary(desk,f).annualCents!==null);const reference=matchingFact?contractSalary(desk,matchingFact).annualCents:null;const next=respondToOffer(offerState,{role,seat,salaryCents:cents,terms},reference,context);save(next,next.rounds.at(-1)?.counter);}catch(e){setError(e instanceof Error?e.message:'Unable to submit offer.');}}
  function acceptOffer(){try{if(!offerState)throw new Error('No counteroffer is available.');const accepted=acceptCounter(offerState,context);save(accepted,accepted.acceptedOffer);}catch(e){setError(e instanceof Error?e.message:'Unable to accept counteroffer.');}}
  function sign(){try{
    const latest=loadCareer();if(latest&&latest.metadata.revision!==career.metadata.revision)throw new Error('The career changed in another tab. Reload before signing.');
    const saved=saveCareer(signAgreedContract(working,draftId));updateCareer(saved);setError('');setMessage('Contract signed.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to sign the contract.');}}
  function reopen(){try{
    if(!offerState)throw new Error('No negotiation is available.');
    const roleRefused=offerState.rounds.at(-1)?.assessment?.issues.some(i=>i.key==='role')&&role==='reserve_driver';
    const nextRole:ContractRole=roleRefused?'race_driver':role;
    const startDate=terms.startDate<career.clock.date?career.clock.date:terms.startDate;
    const updatedTerms={...terms,startDate,endDate:`${Number(startDate.slice(0,4))+contractSeasons-1}-12-31`,clauses:terms.clauses.filter(c=>!(nextRole==='race_driver'?['appearance','practice','promotion']:['win','podium','points','champion','parity']).includes(c.kind))};
    save(reopenNegotiation(offerState,context,roleRefused?nextRole:undefined),{role:nextRole,seat,salaryCents:cents,terms:updatedTerms});
  }catch(e){setError(e instanceof Error?e.message:'Unable to reopen negotiations.');}}
  const available=OFFER_CLAUSES.filter(c=>!terms.clauses.some(t=>t.kind===c.kind)&&!(role==='race_driver'?['appearance','practice','promotion']:['win','podium','points','champion','parity']).includes(c.kind));
  const startOptions=contractStartOptions(working,role,seat);
  const selectedStart=startOptions.find(option=>option.id===startChoice&&option.date===terms.startDate)?.id??startOptions.find(option=>option.date===terms.startDate)?.id??'existing';
  const outgoingName=desk.baseline.people.find(p=>p.id===costs?.occupant)?.name;
  const issue=costs?.issues[Math.min(issueIndex,Math.max(0,costs.issues.length-1))];
  const lastRound=offerState?.rounds.at(-1);
  const appointment=existing?.appointment;
  const signingIssues=existing&&offerState?.status==='accepted'&&!appointment?appointmentBlockers(working,existing):[];
  const matchesCounter=!!lastRound?.counter&&canonicalOffer({role,seat,salaryCents:cents,terms})===canonicalOffer(lastRound.counter);
  const responseKind=offerState?.status==='accepted'?'accepted':offerState?.status==='withdrawn'?'rejected':lastRound?.response;
  const responseTitle=offerState?.status==='withdrawn'?(offerState.endedBy==='player'?'Negotiation cancelled':'Driver ended negotiations'):appointment?.status==='active'?'Contract active':appointment?.status==='scheduled'?'Contract signed':appointment?.status==='blocked'?'Appointment needs attention':appointment?.status==='expired'?'Contract expired':responseKind==='accepted'?'Offer accepted':responseKind==='counter'?'Counteroffer':responseKind==='rejected'?'Offer rejected · talks remain open':'Proposed contract';
  const responseText=appointment?.status==='active'?'The driver has joined the line-up.':appointment?.status==='scheduled'?`Starts ${contractStartDateLabel(terms.startDate)}.`:appointment?.status==='blocked'?appointment.blockReason:appointment?.status==='expired'?'The agreed contract has ended.':offerState?.status==='accepted'?(signingIssues[0]??'Driver terms agreed. Confirm the signing to complete the appointment.'):offerState?.status==='withdrawn'?(offerState.endedReason??lastRound?.reason):lastRound?.reason;
  function changeSeat(nextRole:ContractRole,nextSeat:1|2){
    setRole(nextRole);setSeat(nextSeat);setMessage('');
    if(startChoice==='outgoing_contract_end'){
      const option=outgoingContractStartOption(working,nextRole,nextSeat);
      if(option.date)editTerms({...terms,startDate:option.date,endDate:`${Number(option.date.slice(0,4))+contractSeasons-1}-12-31`});
      else setStartChoice('');
    }
  }
  return <div className="negotiation-page">
    <div className="negotiation-board">
      <aside className="negotiation-context">
        <section className="negotiation-box negotiation-driver"><div className="negotiation-avatar">{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><h2><DriverLink id={profileId} name={name}/></h2><span className="negotiation-eyebrow">PROSPECTIVE DRIVER</span><dl><dt>{referenceSalaryInfo?.basis==='game_estimate'?'Game-estimated annual salary':'Recorded annual salary'}</dt><dd>{usd(referenceSalary)}</dd><dt>Recorded term</dt><dd>{fact?.scenarioTerms?.endSeason??fact?.exactEnd??'Unrecorded'}</dd></dl>{offerState?<details><summary>Negotiation history ({offerState.rounds.length})</summary>{offerState.rounds.map((r,i)=><p key={i}>Round {i+1}: {usd(r.offer.salaryCents)} / year · {r.response} · {r.reason}{r.changes?.length?` · Requested: ${r.changes.join(', ')}`:''}</p>)}</details>:<p>Submit an offer to begin negotiations.</p>}</section>
        <section className="negotiation-box"><span className="negotiation-eyebrow">REPLACING</span><h2>{outgoingName??'Vacant / unrecorded'}</h2><dl><dt>Contract ends</dt><dd>{costs?.outgoingEnd??'Unresolved'}</dd><dt>Replacement date</dt><dd>{terms.startDate||'Choose a date'}</dd></dl></section>
        <section className={`negotiation-box negotiation-review ${issue?'has-issues':''}`}><span className="negotiation-eyebrow">AGREEMENT REVIEW</span>{issue?<><p role="status">{issue}</p>{costs!.issues.length>1&&<div className="negotiation-review-nav"><button aria-label="Previous review issue" disabled={issueIndex<=0} onClick={()=>setIssueIndex(i=>Math.max(0,i-1))}>←</button><span>{Math.min(issueIndex+1,costs!.issues.length)} / {costs!.issues.length}</span><button aria-label="Next review issue" disabled={issueIndex>=costs!.issues.length-1} onClick={()=>setIssueIndex(i=>i+1)}>→</button></div>}</>:<p>{costs?(offerState?.status==='accepted'?'No recorded contract conflicts.':'No recorded contract conflicts. Driver acceptance is still required.'):'Complete the terms to review this proposal.'}</p>}</section>
      </aside>
      <section className="negotiation-editor negotiation-box">
        <div className={`negotiation-editor-heading${responseKind?` response-${responseKind}`:''}`} role="status" aria-live="polite"><div><h2>{responseTitle}</h2>{responseText&&<p>{responseText}</p>}</div>{offerState?.status==='open'&&<span className="negotiation-patience">{patienceLabel(offerState)}</span>}</div>
        <fieldset className="negotiation-offer-fields" disabled={offerState?.status==='accepted'||offerState?.status==='withdrawn'}>
        <div className="negotiation-core">
          <label>Role<select value={role} onChange={e=>changeSeat(e.target.value as ContractRole,seat)}><option value="race_driver">Race driver</option><option value="reserve_driver">Reserve driver</option></select></label>
          <label>Replace seat<select value={seat} onChange={e=>changeSeat(role,Number(e.target.value) as 1|2)}>{([1,2] as const).map(n=>{const slot=desk.baseline.slots.find(s=>s.teamId===career.player.teamId&&s.role===role&&s.number===n);return <option key={n} value={n}>Seat {n} · {desk.baseline.people.find(p=>p.id===slot?.personId)?.name??'Vacant'}</option>;})}</select></label>
          <label>Start date<select aria-label="Start date" value={selectedStart} onChange={e=>{const option=startOptions.find(item=>item.id===e.target.value);if(option?.date){setStartChoice(option.id);editTerms({...terms,startDate:option.date,endDate:`${Number(option.date.slice(0,4))+contractSeasons-1}-12-31`});}}}>{selectedStart==='existing'&&<option value="existing">Existing proposal · {contractStartDateLabel(terms.startDate)}</option>}{startOptions.map(option=><option key={option.id} value={option.id} disabled={!option.date}>{option.label} · {option.date?contractStartDateLabel(option.date):option.reason}</option>)}</select></label>
          <label title="The starting season counts as season one; contracts end on 31 December.">Contract length<select aria-label="Contract length" value={contractSeasons} disabled={!terms.startDate} onChange={e=>{setContractSeasons(Number(e.target.value));editTerms({...terms,endDate:`${Number(terms.startDate.slice(0,4))+Number(e.target.value)-1}-12-31`});}}>{[1,2,3,4,5].map(seasons=><option key={seasons} value={seasons}>{seasons} season{seasons===1?'':'s'} · ends {seasons===contractSeasons&&terms.endDate!==`${terms.endDate.slice(0,4)}-12-31`?contractStartDateLabel(terms.endDate):`31/12/${Number(terms.startDate.slice(0,4))+seasons-1}`}</option>)}</select></label>
          <label className="negotiation-salary">Annual base salary <span>USD / year</span><input aria-label="Annual base salary · USD" inputMode="decimal" value={salary} onChange={e=>{setSalary(e.target.value);setMessage('');}}/></label>
        </div>
        <div className="negotiation-clause-toolbar"><h3>Bonuses & clauses <span>{terms.clauses.length}</span></h3><div><select aria-label="Clause" value={available.some(c=>c.kind===addKind)?addKind:available[0]?.kind??''} onChange={e=>setAddKind(e.target.value as OfferClause['kind'])}>{available.map(c=><option key={c.kind} value={c.kind}>{c.label}</option>)}</select><button disabled={!available.length} onClick={()=>{const kind=available.some(c=>c.kind===addKind)?addKind:available[0]?.kind;if(kind)editTerms({...terms,clauses:[...terms.clauses,{kind,value:kind==='protection'?50:kind==='parity'||kind==='promotion'?1:0}]});}}>+ Add</button></div></div>
        <div className="negotiation-clause-list" aria-label="Proposed clauses" tabIndex={0}>
          {!terms.clauses.length&&<div className="negotiation-empty"><strong>Shape the agreement</strong><p>Add bonuses, commitments or exceptions using the selector above.</p><span>Standard terms stay implicit.</span></div>}
          {terms.clauses.map(c=>{const spec=OFFER_CLAUSES.find(s=>s.kind===c.kind)!;return <div className={`negotiation-term-row ${c.kind==='protection'?'is-exception':''}`} key={c.kind}><label htmlFor={`offer-${c.kind}`}>{c.kind==='protection'&&<small>EXCEPTION</small>}{spec.label}{lastRound?.response==='counter'&&lastRound.changes?.includes(spec.label)&&<small className="negotiation-driver-change">{lastRound.offer.terms.clauses.some(item=>item.kind===c.kind)?'Changed by driver':'Added by driver'}</small>}</label><div>{spec.unit!=='promise'?<><input id={`offer-${c.kind}`} aria-label={spec.label} type="number" min={0} max={spec.max} step={spec.unit==='USD'?0.01:1} value={c.value} onChange={e=>editTerms({...terms,clauses:terms.clauses.map(x=>x.kind===c.kind?{...x,value:e.target.value===''?0:Number(e.target.value)}:x)})}/><span>{spec.unit}</span></>:<span>Included</span>}<button aria-label={`Remove ${spec.label}`} onClick={()=>editTerms({...terms,clauses:terms.clauses.filter(x=>x.kind!==c.kind)})}>×</button></div></div>;})}
        </div>
        </fieldset>
        <footer className="negotiation-actions"><div>{validation||error?<span role="alert">{error||validation}</span>:message?<span role="status">{message}</span>:<span>{offerState?.status==='accepted'?'Driver terms agreed · appointment pending':offerState?.status==='withdrawn'?'Negotiation ended':'Responses are immediate.'}</span>}</div>{offerState?.status==='accepted'&&!appointment&&<button className="negotiation-save" onClick={sign} disabled={signingIssues.length>0} title={signingIssues.join(' ')}>Confirm signing</button>}{offerState?.status==='withdrawn'&&<button onClick={reopen}>{offerState.rounds.at(-1)?.assessment?.issues.some(i=>i.key==='role')?'Approach for race role':'Reopen talks'}</button>}{offerState?.status!=='accepted'&&offerState?.status!=='withdrawn'&&<><button disabled={!matchesCounter} title={!matchesCounter?'Restore the counteroffer or submit your revised terms':undefined} onClick={acceptOffer}>Accept counteroffer</button><button disabled={!offerState} onClick={()=>offerState&&save(cancelNegotiation(offerState))}>Withdraw</button><button className="negotiation-save" disabled={!costs} onClick={submitOffer}>Submit offer</button></>}</footer>
      </section>
      <aside className="negotiation-finances negotiation-box">
        <div className="negotiation-total"><div><span>OVERALL FINANCIAL IMPACT</span><strong>{costs?usd(costs.knownTotal):'—'}</strong><small>{costs?.hasUnresolvedCosts?'Known costs · unresolved amounts excluded':'Estimated proposed costs'} · USD</small></div><div><span>FIRST SEASON IMPACT · {terms.startDate.slice(0,4)}</span><strong>{costs?usd(costs.firstSeasonImpact):'—'}</strong><small>{costs?.hasUnresolvedCosts?'Known costs · unresolved amounts excluded':'Estimated proposed costs'} · USD</small></div></div>
        <nav className="negotiation-finance-tabs" aria-label="Financial views">{(['summary','release','schedule','conditional'] as const).map(tab=><button key={tab} aria-pressed={financialTab===tab} onClick={()=>setFinancialTab(tab)}>{tab==='summary'?'Breakdown':tab==='release'?'Release':tab==='schedule'?'By season':'Conditional'}</button>)}</nav>
        {costs?<div className="negotiation-finance-body">
          {financialTab==='summary'&&<><h3>Incoming driver</h3><dl className="negotiation-totals"><dt>Base salary</dt><dd>{usd(costs.salary)}</dd><dt>Loyalty payments</dt><dd>{usd(costs.loyalty)}</dd><dt>Signing payment</dt><dd>{usd(costs.signing)}</dd><dt>Release to current team</dt><dd>{usd(costs.incomingRelease.total)}</dd><dt className="negotiation-subtotal">Incoming total</dt><dd className="negotiation-subtotal">{usd(costs.incomingCommitted)}</dd></dl><h3>Outgoing driver</h3><dl className="negotiation-totals"><dt>Termination compensation</dt><dd>{usd(costs.severance)}</dd><dt>Protected loyalty</dt><dd>{usd(costs.outgoingLoyalty)}</dd></dl><p>Recorded releasing-team agreements determine agreed fees; open Release for estimates or agreement details. Normal outgoing pay before replacement is excluded.</p></>}
          {financialTab==='release'&&<><h3>Incoming release cost</h3>{costs.incomingRelease.contracts.length?costs.incomingRelease.contracts.map((c,index)=><div className="negotiation-release-record" key={`${c.teamId}:${c.role}:${index}`}><strong>{teams.find(t=>t.id===c.teamId)?.shortName??c.teamId} · {c.role.replace('_',' ')}</strong><dl className="negotiation-totals">{c.basis==='estimated_termination'&&<><dt>Remaining salary</dt><dd>{usd(c.remainingSalary)}</dd><dt>Guaranteed</dt><dd>{c.guaranteePercent}%</dd><dt>Protected loyalty</dt><dd>{usd(c.protectedLoyalty)}</dd></>}<dt className="negotiation-subtotal">{c.basis==='agreed_release'?'Agreed releasing-team fee':c.basis==='fixed_fee'?'Recorded release fee':c.basis==='unresolved'?'Release cost':'Estimated fee'}</dt><dd className="negotiation-subtotal">{usd(c.amount)}</dd></dl></div>):<p>{costs.incomingRelease.total===null?'No current agreement is recorded. Availability and any release cost are unresolved.':'No conflicting race-seat contract requires a release fee. Concurrent reserve arrangements still require agreement.'}</p>}<p>For an overlapping race-seat contract, the default estimate is remaining salary × the guaranteed percentage, plus protected departure-season loyalty. An agreed releasing-team fee takes precedence over a recorded fixed fee or estimate. Signing an occupied race seat also requires a recorded available replacement at that team.</p></>}
          {financialTab==='schedule'&&<><h3>Incoming payment schedule</h3><table className="negotiation-schedule"><thead><tr><th>Season</th><th>Salary</th><th>Loyalty</th></tr></thead><tbody>{costs.yearly.map(y=><tr key={y.year}><td>{y.year}</td><td>{usd(y.salary)}</td><td>{usd(y.loyalty)}</td></tr>)}</tbody></table><p>Signing payment: {usd(costs.signing)} on {terms.startDate}. Salaries include daily proration and any annual increase.</p></>}
          {financialTab==='conditional'&&<><h3>Excluded from committed costs</h3>{terms.clauses.filter(c=>['win','podium','points','champion','appearance'].includes(c.kind)).map(c=><div className="negotiation-conditional" key={c.kind}><span>{OFFER_CLAUSES.find(s=>s.kind===c.kind)!.label}</span><strong>{usd(Math.round(c.value*100))}</strong></div>)}<p>Bonuses are payable per trigger. Only the highest race-result tier pays; sprints are excluded. Release fees represent potential future income, not hiring costs.</p></>}
        </div>:<p>Enter valid terms to calculate costs.</p>}
        <div className="negotiation-finance-note">Offer estimates · signing creates payment obligations in Finances</div>
      </aside>
    </div>
  </div>;
}
