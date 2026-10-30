import {assessOffer} from './negotiationEvaluation';
import {canonicalOffer,clauseValue,editClause,type Offer,type DemandProfile} from './negotiationModel';
import {OFFER_CLAUSES,validNegotiation} from './negotiation';
export function offerChanges(before:Offer,after:Offer):string[]{
  const changes:string[]=[];
  if(before.salaryCents!==after.salaryCents)changes.push('Annual base salary');
  if(before.terms.startDate!==after.terms.startDate)changes.push('Start date');
  if(before.terms.endDate!==after.terms.endDate)changes.push('Contract length');
  for(const c of OFFER_CLAUSES)if(clauseValue(before,c.kind)!==clauseValue(after,c.kind))changes.push(c.label);
  return changes;
}
export function createCounter(offer:Offer,d:DemandProfile):Offer|undefined{
  if(!d.willing)return undefined;
  let base=structuredClone(offer);
  if(d.profile.security>.65&&clauseValue(base,'protection')<50)base=editClause(base,'protection',100);
  if(assessOffer(base,d).issues.some(i=>i.key==='practice'&&i.severity==='hard'))base=editClause(base,'practice',0);
  const candidates:Offer[]=[base];
  if(clauseValue(base,'protection')<100)candidates.push(editClause(base,'protection',100));
  if(clauseValue(base,'commercial')>10)candidates.push(editClause(base,'commercial',10));
  if(clauseValue(base,'simulator')>30)candidates.push(editClause(base,'simulator',20));
  if(clauseValue(base,'release')>d.annualCents/100)candidates.push(editClause(base,'release',Math.round(d.annualCents/100)));
  const expectedUsd=d.annualCents/100;
  if(base.role==='reserve_driver'&&d.profile.development>.45){
    let development=editClause(base,'promotion',1);
    const remaining=d.context.raceDates?.filter(date=>date>=base.terms.startDate&&date<=`${base.terms.startDate.slice(0,4)}-12-31`).length;
    if(remaining===undefined||remaining>0)development=editClause(development,'practice',Math.max(2,clauseValue(base,'practice')));
    candidates.push(development);
    candidates.push(editClause(base,'appearance',Math.min(1e9,Math.max(clauseValue(base,'appearance'),Math.round(expectedUsd*.1)))));
  }
  if(base.role==='race_driver'){
    const bonus=(d.context.competitiveness??.25)>.35?'podium':'points';
    const previousBonus=d.context.preferredClauses?.race_driver?.find(c=>c.kind===bonus)?.value??0;
    candidates.push(editClause(base,bonus,Math.min(1e9,Math.max(clauseValue(base,bonus)*1.5,Math.round(expectedUsd*.035),Math.round(previousBonus*.5)))));
    if(d.profile.performance>.5)candidates.push(editClause(base,'parity',1));
  }
  if(d.profile.development>.5)candidates.push(editClause(base,'increase',Math.max(5,clauseValue(base,'increase'))));
  if(d.profile.loyalty>.55)candidates.push(editClause(base,'loyalty',Math.min(1e9,Math.max(clauseValue(base,'loyalty'),Math.round(expectedUsd*.08)))));
  candidates.push(editClause(base,'signing',Math.min(1e9,Math.max(clauseValue(base,'signing'),Math.round(expectedUsd*.15)))));
  const term=structuredClone(base);term.terms.endDate=`${+term.terms.startDate.slice(0,4)+d.profile.preferredSeasons-1}-12-31`;candidates.push(term);
  const solved=candidates.flatMap(candidate=>{
    let lo=Math.max(candidate.salaryCents,Math.ceil(d.annualCents*d.recurringFloor)),hi=Math.min(1e11,Math.max(lo,Math.round(d.annualCents*3)));
    if(!assessOffer({...candidate,salaryCents:hi},d).acceptable)return [];
    for(let i=0;i<40&&hi-lo>10000;i++){const mid=Math.floor((lo+hi)/2);if(assessOffer({...candidate,salaryCents:mid},d).acceptable)hi=mid;else lo=mid+1;}
    const result={...candidate,salaryCents:Math.min(1e11,Math.ceil(hi/10000)*10000)};
    const assessment=assessOffer(result,d);
    if(!assessment.acceptable||!validNegotiation(result.terms))return [];
    const bonusRequested=offer.terms.clauses.some(c=>['win','podium','points','appearance'].includes(c.kind));
    const bonusChanged=offerChanges(offer,result).some(s=>s.includes('bonus')||s.includes('race-start'));
    const developmentChanged=result.role==='reserve_driver'&&clauseValue(result,'practice')>clauseValue(offer,'practice');
    const affinity=(bonusChanged?(bonusRequested ? .07 : d.profile.performance>.5 ? d.profile.performance*.12 : 0):0)+(developmentChanged?d.profile.development*.06:0);
    const score=(assessment.guaranteedCents+assessment.conditionalCents*.65)/Math.max(.01,assessment.serviceYears)+offerChanges(offer,result).length*d.annualCents*.005-affinity*d.annualCents;
    return [{offer:result,score}];
  }).sort((a,b)=>a.score-b.score||canonicalOffer(a.offer).localeCompare(canonicalOffer(b.offer)));
  return solved[0]?.offer;
}
