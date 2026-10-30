import {test} from 'node:test';
import assert from 'node:assert/strict';
import {respondToOffer,acceptCounter,cancelNegotiation,reopenNegotiation,isOfferNegotiation,canonicalOffer,type Offer,type OfferContext} from '../lib/career/offerNegotiation';
import {makeDemands,makePreferences} from '../lib/career/negotiationPreferences';
import {assessOffer} from '../lib/career/negotiationEvaluation';
import {createCareer,saveCareer,loadCareer,type CareerStorage} from '../lib/career';
import {saveContractDraft} from '../lib/career/contracts';
import {negotiationContext} from '../lib/career/negotiationContext';

const offer:Offer={role:'race_driver',seat:1,salaryCents:75_000_000,terms:{startDate:'2028-01-01',endDate:'2029-12-31',clauses:[]}};
const context:OfferContext={personId:'driver',teamId:'mclaren',date:'2027-01-04',roleSalaryCents:{race_driver:100_000_000,reserve_driver:25_000_000},raceDates:['2027-03-14'],fingerprint:'a',ability:70,age:23};
const draft=(c:ReturnType<typeof createCareer>,state:ReturnType<typeof respondToOffer>)=>saveContractDraft(c,{id:'d1',personId:'max-verstappen',role:offer.role,seat:offer.seat,startSeason:2028,seasons:2,salaryCents:offer.salaryCents,negotiation:offer.terms,offerState:state});

test('the driver counters a credible opening and accepts exactly their counter',()=>{
  const state=respondToOffer(undefined,offer,100_000_000,context);
  assert.equal(state.status,'open');assert.equal(state.rounds[0].response,'counter');
  const counter=state.rounds[0].counter!;assert.ok(counter);assert.equal(respondToOffer(state,counter,100_000_000,context).status,'accepted');
  assert.deepEqual(acceptCounter(state,context).acceptedOffer,counter);assert.ok(isOfferNegotiation(state));
});
test('an insultingly low package ends talks immediately, but signing money is considered',()=>{
  const tiny={...offer,salaryCents:100_000};assert.equal(respondToOffer(undefined,tiny,100_000_000,context).status,'withdrawn');
  const signed={...offer,salaryCents:50_000_000,terms:{...offer.terms,clauses:[{kind:'signing' as const,value:2_000_000}]}};
  assert.equal(respondToOffer(undefined,signed,100_000_000,context).status,'accepted');
});
test('huge improbable bonuses cannot substitute for a token guarantee',()=>{
  const tiny={...offer,salaryCents:100_000,terms:{...offer.terms,clauses:[{kind:'champion' as const,value:1_000_000_000}]}};
  assert.equal(respondToOffer(undefined,tiny,100_000_000,context).status,'withdrawn');
});
test('repeating unchanged offers causes warning then withdrawal without six-round rule',()=>{
  let state=respondToOffer(undefined,offer,100_000_000,context),sawWarning=false;
  while(state.status==='open'&&state.rounds.length<20){state=respondToOffer(state,offer,100_000_000,context);sawWarning ||= !!state.warning&&state.status==='open';}
  assert.equal(state.status,'withdrawn');assert.ok(sawWarning);assert.equal(state.endedBy,'driver');
});
test('tiny changes and reordered clauses do not reset patience indefinitely',()=>{
  let state=respondToOffer(undefined,offer,100_000_000,context);
  for(let i=0;i<12&&state.status==='open';i++)state=respondToOffer(state,{...offer,salaryCents:offer.salaryCents+i},100_000_000,context);
  assert.equal(state.status,'withdrawn');
  const a={...offer,terms:{...offer.terms,clauses:[{kind:'points' as const,value:500},{kind:'signing' as const,value:100}]}};
  assert.equal(canonicalOffer(a),canonicalOffer({...a,terms:{...a.terms,clauses:[...a.terms.clauses].reverse()}}));
});
test('role-specific references differ and future expiry permits a reserve approach',()=>{
  const reserve={...offer,role:'reserve_driver' as const,salaryCents:20_000_000};
  const race=respondToOffer(undefined,offer,100_000_000,context),res=respondToOffer(undefined,reserve,null,context);
  assert.equal(race.expectedSalaryCents,100_000_000);assert.equal(res.expectedSalaryCents,25_000_000);
  const elite={...context,currentRaceTeam:'ferrari',ability:96,raceEndDate:'2029-12-31'};
  assert.equal(respondToOffer(undefined,reserve,null,elite).rounds[0].response,'rejected');
  assert.notEqual(respondToOffer(undefined,{...reserve,terms:{...reserve.terms,startDate:'2030-01-01',endDate:'2030-12-31'}},null,elite).rounds[0].response,'rejected');
});
test('complete offer assessment values protection, bonuses and duties in the expected direction',()=>{
  const d=makeDemands(offer,100_000_000,context,makePreferences(context));
  const base=assessOffer(offer,d);
  assert.ok(assessOffer({...offer,terms:{...offer.terms,clauses:[{kind:'podium',value:100_000}]}},d).utility>base.utility);
  assert.ok(assessOffer({...offer,terms:{...offer.terms,clauses:[{kind:'protection',value:30}]}},d).utility<base.utility);
  assert.ok(assessOffer({...offer,terms:{...offer.terms,clauses:[{kind:'commercial',value:60}]}},d).utility<base.utility);
});
test('fixed reference and preferences remain independent of opening bid',()=>{
  const first=respondToOffer(undefined,offer,null,{personId:'unknown',teamId:'mclaren'});
  const next=respondToOffer(undefined,{...offer,salaryCents:offer.salaryCents+1},null,{personId:'unknown',teamId:'mclaren'});
  assert.equal(first.expectedSalaryCents,next.expectedSalaryCents);
});
test('context change invalidates the counter, and cancellation preserves relationship history',()=>{
  const state=respondToOffer(undefined,offer,100_000_000,context);
  assert.throws(()=>acceptCounter(state,{...context,fingerprint:'changed'}),/changed/);
  assert.throws(()=>acceptCounter(state,{...context,date:'2031-01-01'}),/passed/);
  const cancelled=cancelNegotiation(state);const reopened=reopenNegotiation(cancelled,context);
  assert.equal(reopened.rounds.length,state.rounds.length);assert.ok(reopened.patience!<state.patience!);
});
test('old saves keep their outstanding counter; v2 sessions survive save/load',()=>{
  const legacy={status:'open' as const,expectedSalaryCents:100_000_000,frustration:10,rounds:[{offer,response:'counter' as const,reason:'old terms',counter:{...offer,salaryCents:100_000_000}}]};
  assert.equal(acceptCounter(legacy).acceptedOffer?.salaryCents,100_000_000);
  const state=respondToOffer(undefined,offer,100_000_000,context);
  const c=draft(createCareer('mclaren'),state);
  const data=new Map<string,string>();const storage:CareerStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);},removeItem:k=>{data.delete(k);}};
  saveCareer(c,storage);assert.equal(loadCareer(storage)?.contractDesk?.drafts.at(-1)?.offerState?.patience,state.patience);
});
test('saved career context includes live appointments and role references',()=>{
  const c=createCareer('mclaren');const ctx=negotiationContext(c,'max-verstappen',{ability:96});
  assert.equal(ctx.currentRaceTeam,'red-bull');assert.ok(ctx.roleSalaryCents?.race_driver);assert.ok(ctx.fingerprint);assert.ok(ctx.raceDates?.length);
});

test('multiple meaningful improvements keep talks alive for more than six rounds',()=>{
 let state=respondToOffer(undefined,{...offer,salaryCents:50_000_000},100_000_000,context);
 for(let i=1;i<=8;i++){
   assert.equal(state.status,'open');
   state=respondToOffer(state,{...offer,salaryCents:50_000_000+i*3_000_000},100_000_000,context);
 }
 assert.ok(state.rounds.length>6);assert.equal(state.status,'open');
});
test('drivers can add and improve bonus clauses, and generated terms are acceptable',()=>{
 let added=0,changed=0;
 for(let i=0;i<40;i++){
  const ctx={...context,personId:`profile-${i}`,competitiveness:.8};
  const a=respondToOffer(undefined,offer,100_000_000,ctx),counter=a.rounds[0].counter;
  if(counter?.terms.clauses.some(c=>c.kind==='podium'))added++;
  if(counter)assert.equal(respondToOffer(a,counter,100_000_000,ctx).status,'accepted');
  const b=respondToOffer(undefined,{...offer,terms:{...offer.terms,clauses:[{kind:'podium',value:1000}]}},100_000_000,ctx);
  if((b.rounds[0].counter?.terms.clauses.find(c=>c.kind==='podium')?.value??0)>1000)changed++;
 }
 assert.ok(added>0);assert.ok(changed>0);
});
