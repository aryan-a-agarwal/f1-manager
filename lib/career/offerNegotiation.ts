import {validNegotiation} from './negotiation';
import {assessOffer,eligibleClause} from './negotiationEvaluation';
import {makeDemands,makePreferences} from './negotiationPreferences';
import {createCounter,offerChanges} from './negotiationCounters';
import {evaluateConduct} from './negotiationPatience';
import {canonicalOffer,NEGOTIATION_CONFIG,type Offer,type OfferContext,type OfferNegotiation} from './negotiationModel';
export type {Offer,OfferContext,OfferNegotiation,OfferRound} from './negotiationModel';
export {patienceLabel,canonicalOffer} from './negotiationModel';
export function isOffer(value:unknown):value is Offer{
  if(!value||typeof value!=='object')return false;const o=value as Offer;
  return (o.role==='race_driver'||o.role==='reserve_driver')&&(o.seat===1||o.seat===2)&&Number.isSafeInteger(o.salaryCents)&&o.salaryCents>0&&o.salaryCents<=1e11&&validNegotiation(o.terms);
}
export function isOfferNegotiation(value:unknown):value is OfferNegotiation{
  if(!value||typeof value!=='object')return false;const n=value as OfferNegotiation;
  if(!['open','accepted','withdrawn'].includes(n.status)||!Number.isSafeInteger(n.expectedSalaryCents)||n.expectedSalaryCents<=0||!Number.isInteger(n.frustration)||n.frustration<0||n.frustration>100||!Array.isArray(n.rounds))return false;
  if(!n.rounds.every(r=>!!r&&isOffer(r.offer)&&['accepted','counter','rejected','withdrawn'].includes(r.response)&&typeof r.reason==='string'&&(r.counter===undefined||isOffer(r.counter))))return false;
  if(n.status==='accepted'&&!isOffer(n.acceptedOffer))return false;
  if(n.version===undefined)return true;
  if(n.version!==2||!n.profile||!n.context||!n.demands||!Number.isInteger(n.revision)||n.revision!<0)return false;
  if(![n.patience,n.trust,n.stagnation,n.bestUtility,n.improvements,n.recoveryUsed,n.profile.seed,n.profile.security,n.profile.bonusCap,n.demands.annualCents,n.demands.threshold].every(x=>typeof x==='number'&&Number.isFinite(x)))return false;
  return n.patience!>=0&&n.patience!<=100&&n.trust!>=0&&n.trust!<=100&&(n.legacyCounter===undefined||isOffer(n.legacyCounter));
}
export function migrateNegotiation(previous:OfferNegotiation,offer:Offer,reference:number|null,context:OfferContext):OfferNegotiation{
  if(previous.version===2)return previous;
  const profile=makePreferences(context),demands=makeDemands(offer,reference,context,profile);
  return {...previous,version:2,engineVersion:NEGOTIATION_CONFIG.version,profile,seed:profile.seed,context,demands,patience:Math.max(1,profile.patience-previous.frustration),trust:60,stagnation:0,bestUtility:0,bestRole:offer.role,improvements:0,recoveryUsed:0,revision:previous.rounds.length,warning:previous.frustration>50,legacyCounter:previous.status==='open'?previous.rounds.at(-1)?.counter:undefined};
}
export function respondToOffer(previous:OfferNegotiation|undefined,offer:Offer,referenceSalaryCents:number|null,context:OfferContext={},requestId?:string):OfferNegotiation{
  if(!isOffer(offer)||offer.terms.clauses.some(c=>!eligibleClause(offer.role,c.kind)))throw new Error('Choose valid amounts, dates and clauses for this role.');
  if(context.date&&offer.terms.startDate<context.date)throw new Error('The proposed start date has passed. Choose today or later.');
  if(previous&&previous.status!=='open')throw new Error('This negotiation has ended.');
  if(previous?.reopenedForRole&&offer.role!==previous.reopenedForRole)throw new Error('This discussion was reopened for the other role. Change the proposed role before submitting.');
  if(requestId&&previous?.requestId===requestId)return previous;
  const material=previous?.context?.fingerprint&&context.fingerprint&&previous.context.fingerprint!==context.fingerprint;
  const frozen=previous?.version===2&&!material?{...previous.context,date:context.date}:context;
  const profile=previous?.profile??makePreferences(frozen);
  const demands=makeDemands(offer,referenceSalaryCents,frozen,profile);
  let state:OfferNegotiation=previous?migrateNegotiation(previous,offer,referenceSalaryCents,frozen):{version:2,engineVersion:NEGOTIATION_CONFIG.version,status:'open',expectedSalaryCents:demands.annualCents,frustration:0,rounds:[],profile,seed:profile.seed,context:frozen,demands,patience:profile.patience,trust:60,stagnation:0,bestUtility:0,bestRole:offer.role,improvements:0,recoveryUsed:0,revision:0,warning:false};
  const a=assessOffer(offer,demands),conduct=evaluateConduct(state,offer,a,demands);
  const legacy=state.legacyCounter&&canonicalOffer(state.legacyCounter)===canonicalOffer(offer)&&!material;
  const accepted=a.acceptable||!!(legacy&&a.issues.every(i=>!['role','practice'].includes(i.key)));
  state={...state,...conduct,context:frozen,demands,expectedSalaryCents:demands.annualCents,frustration:100-conduct.patience,revision:(state.revision??0)+1,requestId,legacyCounter:undefined,reopenedForRole:undefined};
  let response:'accepted'|'withdrawn'|'counter'|'rejected',reason:string,counter:Offer|undefined;
  if(accepted){response='accepted';reason='We have agreed the complete package.';state={...state,status:'accepted',acceptedOffer:structuredClone(offer),acceptedAt:context.date};}
  else if(conduct.ended){response='withdrawn';reason=conduct.insult?'This package is far below a serious offer for this role. I am ending negotiations.':'We are still not resolving the terms I raised. I am ending negotiations.';state={...state,status:'withdrawn',endedBy:'driver',endedReason:reason};}
  else {
    counter=createCounter(offer,demands);response=counter?'counter':'rejected';reason=a.issues[0]?.message??'The package still needs improvement.';
    if(conduct.conduct.includes('Repeated'))reason=`We are still discussing the same shortfall. ${reason}`;
    if(conduct.warning)reason=`Final attempt. ${reason}`;
    if(material)reason=`Circumstances changed; I have reassessed the terms. ${reason}`;
  }
  return {...state,rounds:[...state.rounds,{offer:structuredClone(offer),assessment:a,response,reason,counter,changes:counter?offerChanges(offer,counter):[],conduct:conduct.conduct,patience:state.patience}]};
}
export function acceptCounter(state:OfferNegotiation,context?:OfferContext):OfferNegotiation{
  const round=state.rounds.at(-1);if(state.status!=='open'||round?.response!=='counter'||!round.counter)throw new Error('There is no counteroffer to accept.');
  if(context?.date&&round.counter.terms.startDate<context.date)throw new Error('The start date has passed. Revise and submit the offer again.');
  if(context?.fingerprint&&state.context?.fingerprint&&context.fingerprint!==state.context.fingerprint)throw new Error('Appointments have changed. Submit the terms again to refresh the counteroffer.');
  return {...state,status:'accepted',acceptedOffer:structuredClone(round.counter),acceptedAt:context?.date,revision:(state.revision??0)+1};
}
export function cancelNegotiation(state:OfferNegotiation):OfferNegotiation{
  if(state.status!=='open')throw new Error('This negotiation has already ended.');
  return {...state,status:'withdrawn',endedBy:'player',endedReason:'You cancelled negotiations.',revision:(state.revision??0)+1};
}
/** A player may resume a cancelled discussion; driver walkouts require a real change of circumstances. */
export function reopenNegotiation(state:OfferNegotiation,context:OfferContext,newRole?:Offer['role']):OfferNegotiation{
  if(state.status!=='withdrawn')throw new Error('Only an ended negotiation can be reopened.');
  const byDriver=state.endedBy==='driver'||(state.endedBy===undefined&&state.rounds.at(-1)?.response==='withdrawn');
  const refusedRole=state.rounds.at(-1)?.assessment?.issues.some(i=>i.key==='role')&&state.rounds.at(-1)?.offer.role!==newRole&&newRole==='race_driver';
  if(byDriver&&!refusedRole&&(!state.context?.fingerprint||state.context.fingerprint===context.fingerprint))throw new Error('The driver ended talks. Their circumstances must change before you can approach them again.');
  return {...state,status:'open',endedBy:undefined,endedReason:undefined,context,patience:Math.max(1,Math.min(45,(state.patience??100-state.frustration)+(byDriver?15:-5))),trust:Math.max(0,(state.trust??60)-5),warning:false,revision:(state.revision??0)+1,reopenedFromRevision:state.revision??0,reopenedForRole:refusedRole?newRole:undefined};
}
