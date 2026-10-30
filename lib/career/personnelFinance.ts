import {checkNewFinanceCommitments} from './financeOperations';
import type {CareerState,SessionOutput,CalendarRound,WeekendSnapshot,DriverStanding} from './types';
import type {FinanceObligation,FinanceBook} from './financeTypes';
import type {ContractRole} from './contracts';
import {salaryBetween,validContractDate} from './negotiation';

export type PersonnelPayFrequency='monthly'|'quarterly'|'annual';
export type StaffEmployment={id:string;personId:string;name:string;role:string;from:string;to:string;annualCents:number;frequency:PersonnelPayFrequency;annualIncreasePercent:number;relevantPercent:number;classificationReason:string;recordedOn:string;terminatedOn?:string;terminationCents?:number};
export type StaffEarnedBonus={id:string;employmentId:string;description:string;earnedOn:string;dueDate:string;amountCents:number;conditionReference:string};
export type DriverPaymentTerms={contractId:string;effectiveOn:string;frequency:PersonnelPayFrequency;signingDate:'signature'|'start'|string;loyaltyDate:'year_end'|string;bonusDelayDays:number;bonusAnnualCapCents:number|null;stacking:'contract'|'highest'|'stack';agreementReference:string;recordedOn:string};
export type DriverReleaseAgreement={id:string;personId:string;fromTeamId:string;toTeamId:string;role:ContractRole;startsOn:string;amountCents:number;agreedOn:string;agreementReference:string;replacementDriverId?:string;voidedOn?:string};
export type PersonnelBonusAward={id:string;contractId:string;personId:string;name:string;sessionId:string|null;year:number;kind:'race'|'appearance'|'championship';earnedOn:string;amountCents:number;revision:number;sourceFingerprint:string};
export type PersonnelFinanceState={version:1;staff:StaffEmployment[];staffBonuses:StaffEarnedBonus[];driverPaymentTerms:DriverPaymentTerms[];releaseAgreements:DriverReleaseAgreement[];awards:PersonnelBonusAward[];resultReceipts:{sessionId:string;resultId:string;fingerprint:string;processedOn:string}[]};

const DAY=86400000;
const shift=(s:string,n:number)=>new Date(Date.parse(s+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
const monthEnd=(y:number,m:number)=>new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
const money=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
const positive=(n:unknown)=>money(n)&&Number(n)>0;
const text=(s:unknown):s is string=>typeof s==='string'&&s.trim().length>0;
const frequency=(s:unknown):s is PersonnelPayFrequency=>['monthly','quarterly','annual'].includes(String(s));
const latest=(a:string,b:string)=>a>b?a:b,earliest=(a:string,b:string)=>a<b?a:b;
const empty=():PersonnelFinanceState=>({version:1,staff:[],staffBonuses:[],driverPaymentTerms:[],releaseAgreements:[],awards:[],resultReceipts:[]});
export function personnelFinanceState(career:CareerState):PersonnelFinanceState{return (career.finance?.book as FinanceBook&{personnel?:PersonnelFinanceState}|undefined)?.personnel??empty();}
function withState(career:CareerState,state:PersonnelFinanceState):CareerState{
  if(!career.finance?.book)throw new Error('Initialise the finance book before recording personnel terms.');
  return {...career,finance:{...career.finance,book:{...career.finance.book,personnel:state} as FinanceBook}};
}
function ensureFuture(career:CareerState,date:string){if(!validContractDate(date)||date<career.clock.date)throw new Error('Choose today or a future effective date.');}

export function recordStaffEmployment(career:CareerState,input:Omit<StaffEmployment,'recordedOn'|'terminatedOn'|'terminationCents'>):CareerState{
  const state=personnelFinanceState(career);ensureFuture(career,input.from);
  if(!text(input.id)||!text(input.personId)||!text(input.name)||!text(input.role)||!validContractDate(input.to)||input.to<input.from||!positive(input.annualCents)||!frequency(input.frequency)||!Number.isFinite(input.annualIncreasePercent)||input.annualIncreasePercent<0||input.annualIncreasePercent>100||!Number.isFinite(input.relevantPercent)||input.relevantPercent<0||input.relevantPercent>100||!text(input.classificationReason))throw new Error('Record the named employee, valid term, positive salary, payment frequency and cost classification.');
  const existing=state.staff.find(s=>s.id===input.id);
  if(existing){if(JSON.stringify({...existing,recordedOn:undefined})===JSON.stringify({...input,recordedOn:undefined}))return career;throw new Error('An employment record already has this ID. End it and record an amendment as a new dated employment record.');}
  if(state.staff.some(s=>s.personId===input.personId&&s.from<=input.to&&(s.terminatedOn?earliest(s.to,shift(s.terminatedOn,-1)):s.to)>=input.from))throw new Error('This employee already has overlapping recorded employment. End the earlier agreement first.');
  const next=withState(career,{...state,staff:[...state.staff,{...input,recordedOn:career.clock.date}]});checkNewFinanceCommitments(next);return next;
}

export function terminateStaffEmployment(career:CareerState,id:string,on:string,compensationCents:number):CareerState{
  ensureFuture(career,on);if(!money(compensationCents))throw new Error('Record non-negative agreed termination compensation.');
  const state=personnelFinanceState(career),staff=state.staff.find(s=>s.id===id);if(!staff)throw new Error('Staff agreement not found.');
  if(on<staff.from||on>staff.to)throw new Error('Termination must fall within the employment term.');
  if(staff.terminatedOn){if(staff.terminatedOn===on&&staff.terminationCents===compensationCents)return career;throw new Error('This termination is already recorded.');}
  return withState(career,{...state,staff:state.staff.map(s=>s.id===id?{...s,terminatedOn:on,terminationCents:compensationCents}:s)});
}

export function recordStaffEarnedBonus(career:CareerState,bonus:StaffEarnedBonus):CareerState{
  const state=personnelFinanceState(career),staff=state.staff.find(s=>s.id===bonus.employmentId);
  if(!staff||!text(bonus.id)||!text(bonus.description)||!text(bonus.conditionReference)||!validContractDate(bonus.earnedOn)||bonus.earnedOn<staff.from||bonus.earnedOn>staff.to||(staff.terminatedOn!==undefined&&bonus.earnedOn>=staff.terminatedOn)||bonus.earnedOn>career.clock.date||!validContractDate(bonus.dueDate)||bonus.dueDate<career.clock.date||!positive(bonus.amountCents))throw new Error('Record a bonus earned by this employee, its agreed condition and a valid payment date.');
  if(state.staffBonuses.some(b=>b.id===bonus.id))throw new Error('A bonus already has this ID.');
  return withState(career,{...state,staffBonuses:[...state.staffBonuses,bonus]});
}

export function configureDriverPaymentTerms(career:CareerState,input:Omit<DriverPaymentTerms,'recordedOn'>):CareerState{
  const state=personnelFinanceState(career);ensureFuture(career,input.effectiveOn);
  const fact=career.contractDesk?.baseline.facts.find(f=>f.id===input.contractId&&f.teamId===career.player.teamId);
  const draft=career.contractDesk?.drafts.find(d=>d.id===input.contractId&&d.teamId===career.player.teamId&&d.appointment);
  if(!fact&&!draft)throw new Error('Choose an existing team driver contract.');
  if(!frequency(input.frequency)||!(['signature','start'].includes(input.signingDate)||validContractDate(input.signingDate))||!(input.loyaltyDate==='year_end'||validContractDate(input.loyaltyDate))||!Number.isInteger(input.bonusDelayDays)||input.bonusDelayDays<0||input.bonusDelayDays>365||(input.bonusAnnualCapCents!==null&&!money(input.bonusAnnualCapCents))||!['contract','highest','stack'].includes(input.stacking)||!text(input.agreementReference))throw new Error('Record valid payment timing and the agreed amendment reference.');
  if(validContractDate(input.signingDate)&&input.signingDate<career.clock.date)throw new Error('A payment amendment cannot move a signing payment into the past.');
  if(validContractDate(input.loyaltyDate)&&input.loyaltyDate<career.clock.date)throw new Error('A payment amendment cannot move loyalty into the past.');
  const last=state.driverPaymentTerms.filter(t=>t.contractId===input.contractId&&t.effectiveOn===input.effectiveOn).at(-1);
  if(last&&last.frequency===input.frequency&&last.signingDate===input.signingDate&&last.loyaltyDate===input.loyaltyDate&&last.bonusDelayDays===input.bonusDelayDays&&last.bonusAnnualCapCents===input.bonusAnnualCapCents&&last.stacking===input.stacking&&last.agreementReference===input.agreementReference)return career;
  return withState(career,{...state,driverPaymentTerms:[...state.driverPaymentTerms,{...input,recordedOn:career.clock.date}]});
}

export function recordDriverReleaseAgreement(career:CareerState,input:DriverReleaseAgreement):CareerState{
  const state=personnelFinanceState(career);
  if(!text(input.id)||!text(input.personId)||!text(input.fromTeamId)||input.toTeamId!==career.player.teamId||input.fromTeamId===input.toTeamId||!['race_driver','reserve_driver'].includes(input.role)||!validContractDate(input.startsOn)||input.startsOn<career.clock.date||!validContractDate(input.agreedOn)||input.agreedOn>career.clock.date||input.agreedOn>input.startsOn||!money(input.amountCents)||!text(input.agreementReference)||input.voidedOn)throw new Error('Record the releasing team, receiving team, agreed date, effective date, fee and agreement reference.');
  const fact=career.contractDesk?.baseline.facts.find(f=>f.personId===input.personId&&f.teamId===input.fromTeamId&&f.role===input.role);
  if(!fact)throw new Error('The releasing team does not have a matching recorded driver contract.');
  if(input.replacementDriverId&&!driverReleaseReplacementCandidates(career,input.fromTeamId,input.startsOn).some(p=>p.id===input.replacementDriverId))throw new Error('The recorded replacement must be an available team reserve or free career driver, without another race seat.');
  const existing=state.releaseAgreements.find(a=>a.id===input.id);if(existing){if(JSON.stringify(existing)===JSON.stringify(input))return career;throw new Error('A release agreement already has this ID.');}
  if(state.releaseAgreements.some(a=>a.personId===input.personId&&a.fromTeamId===input.fromTeamId&&a.toTeamId===input.toTeamId&&a.role===input.role&&a.startsOn===input.startsOn&&!a.voidedOn))throw new Error('A matching release agreement is already recorded.');
  return withState(career,{...state,releaseAgreements:[...state.releaseAgreements,input]});
}
/** Candidates come from actual career people; no substitute driver or salary is generated. */
export function driverReleaseReplacementCandidates(career:CareerState,teamId:string,on:string){
  if(!validContractDate(on))return [];
  const year=Number(on.slice(0,4)),seasons=career.workforce.lineups.map(l=>l.season).filter(y=>y<=year),source=career.workforce.lineups.some(l=>l.season===year)?year:Math.max(...seasons);
  const lineups=career.workforce.lineups.filter(l=>l.season===source),raceDrivers=new Set(lineups.flatMap(l=>l.driverIds)),ownReserves=new Set(lineups.find(l=>l.teamId===teamId)?.reserveDriverIds?.filter(Boolean)??[]);
  const employed=(id:string)=>career.workforce.agreements.some(a=>a.personId===id&&(a.startDate??`${a.startSeason}-01-01`)<=on&&(a.endDate??`${a.endSeason??9999}-12-31`)>=on&&(!a.terminatedOn||a.terminatedOn>on));
  return career.workforce.people.filter(p=>p.kind==='driver'&&!raceDrivers.has(p.id)&&(ownReserves.has(p.id)||!employed(p.id)));
}
export function matchingDriverReleaseAgreement(career:CareerState,personId:string,fromTeamId:string,startsOn:string,role:ContractRole='race_driver'){
  return personnelFinanceState(career).releaseAgreements.find(a=>a.personId===personId&&a.fromTeamId===fromTeamId&&a.toTeamId===career.player.teamId&&a.startsOn===startsOn&&a.role===role&&a.agreedOn<=career.clock.date&&!a.voidedOn);
}
export function driverReleaseAgreedTotal(career:CareerState,personId:string,startsOn:string,role:ContractRole='race_driver'):number|null{
  if(role==='reserve_driver')return 0;
  const facts=career.contractDesk?.baseline.facts.filter(f=>f.personId===personId&&f.teamId!==career.player.teamId&&f.role==='race_driver'&&(!(f.scenarioTerms?.endSeason??f.exactEnd)||startsOn<=`${f.scenarioTerms?.endSeason??f.exactEnd}-12-31`))??[];
  let total=0;for(const fact of facts){const agreement=matchingDriverReleaseAgreement(career,personId,fact.teamId,startsOn,fact.role);if(!agreement)return null;total+=agreement.amountCents;}return total;
}

function paymentTerms(career:CareerState,id:string,date:string){return personnelFinanceState(career).driverPaymentTerms.filter(t=>t.contractId===id&&t.effectiveOn<=date).sort((a,b)=>a.effectiveOn.localeCompare(b.effectiveOn)).at(-1);}
function periodicDue(date:string,f:PersonnelPayFrequency){const y=Number(date.slice(0,4)),m=Number(date.slice(5,7));return f==='annual'?`${y}-12-31`:f==='quarterly'?monthEnd(y,Math.ceil(m/3)*3):date;}
/** Monthly accrual IDs remain unchanged when quarterly/annual payment timing is agreed. */
export function applyPersonnelPaymentTerms(career:CareerState,obligations:FinanceObligation[]):FinanceObligation[]{
  const settled=new Set(career.finance?.book?.entries.filter(e=>e.kind==='payment').map(e=>e.id)??[]);
  return obligations.map(o=>{
    if(!o.sourceId.startsWith('contract:')||settled.has(o.id+':payment'))return o;
    const id=o.sourceId.slice('contract:'.length),t=paymentTerms(career,id,o.recognitionDate);if(!t)return o;
    let dueDate=o.dueDate;
    if(o.category==='driver_pay')dueDate=periodicDue(o.dueDate,t.frequency);
    if(o.id.startsWith('signing:')){const draft=career.contractDesk?.drafts.find(d=>d.id===id);dueDate=t.signingDate==='signature'?(draft?.appointment?.signedOn??dueDate):t.signingDate==='start'?(draft?.negotiation?.startDate??dueDate):t.signingDate;}
    if(o.id.startsWith('loyalty:')&&t.loyaltyDate!=='year_end'&&t.loyaltyDate.slice(0,4)===o.recognitionDate.slice(0,4))dueDate=t.loyaltyDate;
    return dueDate>=t.recordedOn?{...o,dueDate}:o;
  });
}

export function personnelFinanceObligations(career:CareerState,throughYear=Number(career.clock.date.slice(0,4))):FinanceObligation[]{
  const state=personnelFinanceState(career),book=career.finance?.book;if(!book)return [];
  const out:FinanceObligation[]=[];
  for(const staff of state.staff){
    const end=staff.terminatedOn?earliest(staff.to,shift(staff.terminatedOn,-1)):staff.to;
    for(let y=Number(latest(staff.from,book.activatedOn).slice(0,4));y<=Math.min(throughYear,Number(end.slice(0,4)));y++)for(let m=1;m<=12;m++){
      const first=`${y}-${String(m).padStart(2,'0')}-01`,last=monthEnd(y,m),a=latest(latest(first,staff.from),book.activatedOn),b=earliest(last,end);if(a>b)continue;
      const amount=salaryBetween(staff.annualCents,a,b,Number(staff.from.slice(0,4)),staff.annualIncreasePercent);
      out.push({id:`staff-salary:${staff.id}:${last}`,sourceId:`staff:${staff.id}`,description:`${staff.name} · ${staff.role} salary`,counterparty:staff.name,category:'staff_pay',recognitionDate:last,dueDate:periodicDue(last,staff.frequency),amountCents:-amount,relevantCents:Math.round(amount*staff.relevantPercent/100),basis:'career_contract'});
    }
    if(staff.terminatedOn&&(staff.terminationCents??0)>0)out.push({id:`staff-exit:${staff.id}`,sourceId:`staff:${staff.id}`,description:`${staff.name} · agreed termination compensation`,counterparty:staff.name,category:'staff_pay',recognitionDate:staff.terminatedOn,dueDate:staff.terminatedOn,amountCents:-staff.terminationCents!,relevantCents:Math.round(staff.terminationCents!*staff.relevantPercent/100),basis:'career_contract'});
  }
  for(const bonus of state.staffBonuses){const staff=state.staff.find(s=>s.id===bonus.employmentId)!;out.push({id:`staff-bonus:${bonus.id}`,sourceId:`staff:${staff.id}`,description:`${staff.name} · ${bonus.description}`,counterparty:staff.name,category:'staff_pay',recognitionDate:bonus.earnedOn,dueDate:bonus.dueDate,amountCents:-bonus.amountCents,relevantCents:Math.round(bonus.amountCents*staff.relevantPercent/100),basis:'career_contract'});}
  return out;
}

type BonusContract={id:string;personId:string;driverId:string|null;name:string;from:string;to:string;role:ContractRole;seat:number;win:number;podium:number;points:number;appearance:number;champion:number;maximumPosition:number;annualCap:number|null;stack:boolean;sprints:boolean};
function bonusContracts(career:CareerState):BonusContract[]{
  const desk=career.contractDesk;if(!desk)return [];
  const signed=desk.drafts.filter(d=>d.teamId===career.player.teamId&&d.appointment&&d.negotiation&&['scheduled','active','expired'].includes(d.appointment.status));
  const contracts:BonusContract[]=[];
  for(const f of desk.baseline.facts.filter(f=>f.teamId===career.player.teamId)){
    const slot=desk.baseline.slots.find(s=>s.teamId===f.teamId&&s.role===f.role&&s.personId===f.personId),end=f.scenarioTerms?.endSeason??f.exactEnd;if(!slot||end===null)continue;
    const person=desk.baseline.people.find(p=>p.id===f.personId),race=f.clausePackage?.clauses.find(c=>c.kind==='race_bonus')?.parameters??{},champ=f.clausePackage?.clauses.find(c=>c.kind==='championship_bonus')?.parameters??{},appearance=f.clausePackage?.clauses.find(c=>c.kind==='substitution_fee')?.parameters??{};
    contracts.push({id:f.id,personId:f.personId,driverId:person?.careerDriverId??null,name:person?.name??f.personId,from:`${f.clausePackage?.startSeason??desk.baseline.season}-01-01`,to:`${end}-12-31`,role:f.role,seat:slot.number,win:Number(race.winCents??0),podium:Number(race.podiumCents??0),points:Number(race.pointsFinishCents??0),appearance:Number(appearance.perGrandPrixStartCents??0),champion:Number(champ.amountCents??0),maximumPosition:Number(champ.maximumPosition??1),annualCap:typeof race.annualCapCents==='number'?race.annualCapCents:null,stack:race.stacking==='stack',sprints:race.sprints===true});
  }
  for(const d of signed){const t=d.negotiation!,person=desk.baseline.people.find(p=>p.id===d.personId),amount=(kind:string)=>Math.round((t.clauses.find(c=>c.kind===kind)?.value??0)*100);contracts.push({id:d.id,personId:d.personId,driverId:person?.careerDriverId??null,name:person?.name??d.personId,from:t.startDate,to:t.endDate,role:d.role,seat:d.seat,win:amount('win'),podium:amount('podium'),points:amount('points'),appearance:amount('appearance'),champion:amount('champion'),maximumPosition:1,annualCap:null,stack:false,sprints:false});}
  return contracts.map(c=>{const replacement=signed.filter(d=>d.id!==c.id&&d.role===c.role&&d.seat===c.seat&&d.negotiation!.startDate>=c.from).sort((a,b)=>a.negotiation!.startDate.localeCompare(b.negotiation!.startDate))[0];return replacement?{...c,to:earliest(c.to,shift(replacement.negotiation!.startDate,-1))}:c;});
}
function fingerprint(value:unknown){const s=JSON.stringify(value);let hash=2166136261;for(let i=0;i<s.length;i++){hash^=s.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
type ResultContext={round:CalendarRound;output:SessionOutput|undefined;snapshot:WeekendSnapshot|undefined;session:CalendarRound['sessions'][number]};
function resultContexts(career:CareerState):ResultContext[]{
  const current=career.season.calendar.rounds.flatMap(round=>round.sessions.filter(session=>session.kind==='race'||session.kind==='sprint').map(session=>({round,session,output:career.weekendOperations.outputs.filter(o=>o.sessionId===session.id).at(-1),snapshot:career.weekendOperations.snapshots.find(s=>s.roundId===round.id)})));
  // Historical awards have already been receipted before archival. Reopening a prior
  // classification requires an explicit current-period correction, not backfill.
  return current.filter(r=>r.session.date>=career.finance!.book!.activatedOn);
}
const compareStandings=(a:DriverStanding,b:DriverStanding)=>b.points-a.points||b.wins-a.wins||Array.from({length:22},(_,i)=>(b.finishes[i+1]??0)-(a.finishes[i+1]??0)).find(n=>n!==0)||a.driverName.localeCompare(b.driverName);

/** Finance consumes final result records independently of scoring's outbox status. */
export function processPersonnelFinance(career:CareerState,date=career.clock.date):CareerState{
  if(!career.finance?.book)return career;
  const state=personnelFinanceState(career),contracts=bonusContracts(career),desired=new Map<string,Omit<PersonnelBonusAward,'revision'>>(),receipts=[...state.resultReceipts];
  const capUsed=new Map<string,number>();
  for(const context of resultContexts(career).sort((a,b)=>a.session.date.localeCompare(b.session.date)||a.session.id.localeCompare(b.session.id))){
    const {session,output,snapshot}=context;if(session.date>date)continue;
    const completed=session.status==='completed'&&output?.completionMode==='simulated'&&snapshot!==undefined;
    if(!completed&&session.status!=='cancelled'&&!state.awards.some(a=>a.sessionId===session.id))continue;
    const stamp=fingerprint({result:output?.id,mode:output?.completionMode,classification:output?.classification,distance:output?.distancePercent,status:session.status,participants:snapshot?.participants.map(p=>[p.teamId,p.driverId]),contracts:contracts.map(c=>[c.id,c.from,c.to]),terms:state.driverPaymentTerms});
    if(!receipts.some(r=>r.sessionId===session.id&&r.fingerprint===stamp))receipts.push({sessionId:session.id,resultId:output?.id??'cancelled',fingerprint:stamp,processedOn:date});
    for(const c of contracts.filter(c=>c.from<=session.date&&c.to>=session.date)){
      const participant=snapshot?.participants.find(p=>p.teamId===career.player.teamId&&(p.driverId===c.driverId||p.driverId===c.personId||p.driverId===`contract:${c.personId}`));
      const classification=participant?output?.classification.find(r=>r.driverId===participant.driverId):undefined;
      const eligible=completed&&participant&&classification&&classification.status!=='not_started';
      const t=paymentTerms(career,c.id,session.date),year=Number(session.date.slice(0,4)),capKey=`${c.id}:${year}`;
      let resultBonus=0,appearance=0;
      if(eligible&&(session.kind==='race'||c.sprints)&&classification.status==='classified'){
        const distance=output.distancePercent??0,leaderLaps=output.classification.find(r=>r.position===1)?.laps??0;
        const pointsPlaces=leaderLaps<2?0:session.kind==='sprint'?(distance>=50?8:0):distance>=50?10:distance>=25?9:distance>0?5:0;
        const tiers=[classification.position===1?c.win:0,classification.position<=3?c.podium:0,classification.position<=pointsPlaces?c.points:0];
        const stack=t?.stacking==='stack'||(t?.stacking!=='highest'&&c.stack);resultBonus=stack?tiers.reduce((sum,n)=>sum+n,0):Math.max(...tiers);
        const cap=t?.bonusAnnualCapCents??c.annualCap;if(cap!==null)resultBonus=Math.min(resultBonus,Math.max(0,cap-(capUsed.get(capKey)??0)));capUsed.set(capKey,(capUsed.get(capKey)??0)+resultBonus);
      }
      if(eligible&&session.kind==='race'&&c.role==='reserve_driver')appearance=c.appearance;
      for(const [kind,amount] of [['race',resultBonus],['appearance',appearance]] as const){const id=`${kind}:${c.id}:${session.id}`;if(amount||state.awards.some(a=>a.id===id))desired.set(id,{id,contractId:c.id,personId:c.personId,name:c.name,sessionId:session.id,year,kind,earnedOn:session.date,amountCents:amount,sourceFingerprint:stamp});}
    }
  }
  const final=career.season.phase==='offseason'&&career.season.calendar.rounds.every(r=>r.status==='archived')&&career.championship.drivers.some(d=>d.points>0);
  if(final){const standings=[...career.championship.drivers].sort(compareStandings),year=career.season.year,earnedOn=`${year}-12-31`>date?date:`${year}-12-31`,stamp=fingerprint(standings.map(s=>[s.driverId,s.points,s.wins,s.finishes]));
    const finalRaceDate=career.season.calendar.rounds.flatMap(r=>r.sessions.filter(s=>s.kind==='race').map(s=>s.date)).sort().at(-1)??`${year}-12-31`;
    for(const c of contracts.filter(c=>c.champion>0&&c.from<=finalRaceDate&&c.to>=finalRaceDate)){const position=standings.findIndex(s=>s.driverId===c.driverId||s.driverId===c.personId||s.driverId===`contract:${c.personId}`)+1,amount=position>0&&position<=c.maximumPosition?c.champion:0,id=`championship:${c.id}:${year}`;if(amount||state.awards.some(a=>a.id===id))desired.set(id,{id,contractId:c.id,personId:c.personId,name:c.name,sessionId:null,year,kind:'championship',earnedOn,amountCents:amount,sourceFingerprint:stamp});}
  }
  let awards=[...state.awards],obligations=[...career.finance.book.obligations],changed=false;
  for(const [id,wanted] of desired){const old=awards.find(a=>a.id===id),delta=wanted.amountCents-(old?.amountCents??0);if(!delta&&old?.sourceFingerprint===wanted.sourceFingerprint)continue;
    const revision=(old?.revision??0)+1;awards=awards.filter(a=>a.id!==id).concat({...wanted,revision});changed=true;
    if(delta){const t=paymentTerms(career,wanted.contractId,wanted.earnedOn),recognitionDate=old?date:wanted.earnedOn,dueDate=latest(shift(recognitionDate,t?.bonusDelayDays??0),date);
      obligations.push({id:`personnel-bonus:${id}:r${revision}`,sourceId:`contract:${wanted.contractId}`,description:`${wanted.name} · ${wanted.kind==='appearance'?'reserve race-start':wanted.kind==='championship'?'championship':'Grand Prix result'} bonus${old?' correction':''}`,counterparty:wanted.name,category:'driver_bonus',recognitionDate,dueDate,amountCents:-delta,relevantCents:0,basis:'career_contract'});
    }
  }
  const outbox=career.weekendOperations.outbox.map(event=>event.type==='SessionCompleted'&&event.resultId&&receipts.some(r=>r.resultId===event.resultId)&&!event.receipts?.includes('finance-personnel')?{...event,receipts:[...(event.receipts??[]),'finance-personnel']}:event);
  const receiptsChanged=outbox.some((event,i)=>event!==career.weekendOperations.outbox[i]);
  if(!changed&&receipts.length===state.resultReceipts.length&&!receiptsChanged)return career;
  const next=withState(career,{...state,awards,resultReceipts:receipts});
  return {...next,weekendOperations:{...next.weekendOperations,outbox},finance:{...next.finance!,book:{...next.finance!.book!,obligations}}};
}

export function validPersonnelFinance(value:unknown):boolean{
  if(value===undefined)return true;if(!value||typeof value!=='object')return false;
  const s=value as PersonnelFinanceState;
  const unique=(values:string[])=>new Set(values).size===values.length;
  try{return s.version===1&&Array.isArray(s.staff)&&unique(s.staff.map(a=>a.id))&&s.staff.every(a=>text(a.id)&&text(a.personId)&&text(a.name)&&text(a.role)&&validContractDate(a.from)&&validContractDate(a.to)&&a.to>=a.from&&positive(a.annualCents)&&frequency(a.frequency)&&Number.isFinite(a.annualIncreasePercent)&&a.annualIncreasePercent>=0&&a.annualIncreasePercent<=100&&Number.isFinite(a.relevantPercent)&&a.relevantPercent>=0&&a.relevantPercent<=100&&text(a.classificationReason)&&validContractDate(a.recordedOn)&&(a.terminatedOn===undefined||(validContractDate(a.terminatedOn)&&a.terminatedOn>=a.from&&a.terminatedOn<=a.to&&money(a.terminationCents))))
    &&Array.isArray(s.staffBonuses)&&unique(s.staffBonuses.map(a=>a.id))&&s.staffBonuses.every(a=>text(a.id)&&s.staff.some(t=>t.id===a.employmentId)&&text(a.description)&&text(a.conditionReference)&&validContractDate(a.earnedOn)&&validContractDate(a.dueDate)&&a.dueDate>=a.earnedOn&&positive(a.amountCents))
    &&Array.isArray(s.driverPaymentTerms)&&s.driverPaymentTerms.every(t=>text(t.contractId)&&validContractDate(t.effectiveOn)&&frequency(t.frequency)&&(['signature','start'].includes(t.signingDate)||validContractDate(t.signingDate))&&(t.loyaltyDate==='year_end'||validContractDate(t.loyaltyDate))&&Number.isInteger(t.bonusDelayDays)&&t.bonusDelayDays>=0&&t.bonusDelayDays<=365&&(t.bonusAnnualCapCents===null||money(t.bonusAnnualCapCents))&&['contract','highest','stack'].includes(t.stacking)&&text(t.agreementReference)&&validContractDate(t.recordedOn))
    &&Array.isArray(s.releaseAgreements)&&unique(s.releaseAgreements.map(a=>a.id))&&s.releaseAgreements.every(a=>text(a.id)&&text(a.personId)&&text(a.fromTeamId)&&text(a.toTeamId)&&a.fromTeamId!==a.toTeamId&&['race_driver','reserve_driver'].includes(a.role)&&validContractDate(a.startsOn)&&validContractDate(a.agreedOn)&&a.agreedOn<=a.startsOn&&money(a.amountCents)&&text(a.agreementReference)&&(a.replacementDriverId===undefined||text(a.replacementDriverId))&&(a.voidedOn===undefined||validContractDate(a.voidedOn)))
    &&Array.isArray(s.awards)&&unique(s.awards.map(a=>a.id))&&s.awards.every(a=>text(a.id)&&text(a.contractId)&&text(a.personId)&&text(a.name)&&(a.sessionId===null||text(a.sessionId))&&Number.isInteger(a.year)&&a.year>=1950&&['race','appearance','championship'].includes(a.kind)&&validContractDate(a.earnedOn)&&money(a.amountCents)&&Number.isInteger(a.revision)&&a.revision>0&&text(a.sourceFingerprint))
    &&Array.isArray(s.resultReceipts)&&s.resultReceipts.every(r=>text(r.sessionId)&&text(r.resultId)&&text(r.fingerprint)&&validContractDate(r.processedOn));}catch{return false;}
}
