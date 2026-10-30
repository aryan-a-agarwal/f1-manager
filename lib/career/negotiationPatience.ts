import {canonicalOffer,clamp,NEGOTIATION_CONFIG,type Offer,type OfferAssessment,type OfferNegotiation,type DemandProfile} from './negotiationModel';
export function evaluateConduct(state:OfferNegotiation,offer:Offer,a:OfferAssessment,d:DemandProfile){
  const previous=state.rounds.at(-1),sameRole=state.bestRole===offer.role;
  const best=sameRole?(state.bestUtility??0):0;
  const prevIssues=previous?.assessment?.issues??[];
  const closesIssue=prevIssues.some(i=>i.gap>0&&i.severity!=='tradeable'&&((a.issues.find(j=>j.key===i.key)?.gap??0)<=i.gap*.8))&&a.utility>=best-.5;
  const improved=!!previous&&(a.utility>=best+NEGOTIATION_CONFIG.meaningful||closesIssue);
  const repeated=state.rounds.some(r=>canonicalOffer(r.offer)===canonicalOffer(offer));
  const near=a.utility/d.threshold>=.9;
  const stagnation=improved?0:(state.stagnation??0)+1;let penalty=0,conduct='Opening offer';
  const insult=a.guaranteedRatio<NEGOTIATION_CONFIG.insultGuarantee&&a.utility/d.threshold<NEGOTIATION_CONFIG.insultUtility;
  if(insult){penalty=100;conduct='Insultingly low package';}
  else if(a.issues.some(i=>i.key==='role')){penalty=previous?18:5;conduct='Role refused';}
  else if(repeated){penalty=Math.min(26,8+Math.max(0,stagnation-2)*6);conduct='Repeated inadequate package';}
  else if(sameRole&&a.utility<best-3){penalty=12;conduct='Package worsened';}
  else if(a.guaranteedRatio<.5&&a.utility<d.threshold*.65){penalty=20;conduct='Very low package';}
  else if(improved){penalty=1;conduct='Meaningful progress';}
  else if(previous){penalty=Math.min(16,4*stagnation);conduct=near?'Repeated near miss':'No meaningful progress';}
  else penalty=2;
  const ignored=prevIssues.some(i=>i.severity==='hard'&&(a.issues.find(j=>j.key===i.key)?.gap??0)>i.gap+2);
  if(ignored&&!insult){penalty+=6;conduct+='; important demand worsened';}
  const improvements=improved?(state.improvements??0)+1:0;
  const recovered=improvements>=2?Math.min(3,NEGOTIATION_CONFIG.maxRecovery-(state.recoveryUsed??0)):0;
  const before=state.patience??d.profile.patience;
  let patience=clamp(Math.round(before-penalty*d.profile.sensitivity+recovered),0,100);
  if(!insult&&patience===0&&!state.warning)patience=1;
  const warning=patience<=NEGOTIATION_CONFIG.warning;
  return {patience,stagnation,improvements,recoveryUsed:(state.recoveryUsed??0)+recovered,warning,trust:clamp((state.trust??60)-Math.round(penalty/3)+recovered,0,100),conduct,insult,ended:insult||patience===0,bestUtility:Math.max(best,a.utility),bestRole:offer.role};
}
