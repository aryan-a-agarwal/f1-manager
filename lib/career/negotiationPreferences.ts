import {clamp,hashSeed,NEGOTIATION_CONFIG,type Offer,type OfferContext,type NegotiatingProfile,type DemandProfile} from './negotiationModel';

export function makePreferences(context:OfferContext):NegotiatingProfile{
  const seed=hashSeed(`${context.personId??'driver'}:${context.teamId??'team'}:negotiation-v2`);
  const variation=(shift:number)=>((seed>>>shift)%101)/100;
  const young=context.age!=null?clamp((29-context.age)/10):.4;
  const security=.35+variation(0)*.4;
  return {seed,security,development:clamp(.2+young*.6+variation(8)*.15),autonomy:.3+variation(12)*.5,performance:1-security,
    loyalty:context.loyalty!=null?clamp(context.loyalty/100):.5,patience:55+Math.round(variation(16)*30),sensitivity:.8+variation(20)*.4,
    preferredSeasons:security>.6?3:young>.5?2:2,bonusCap:security>.65?.1:security<.45?.3:.2,riskFactor:.4+(1-security)*.4};
}
export function makeDemands(offer:Offer,reference:number|null,context:OfferContext,profile=makePreferences(context)):DemandProfile{
  // Role-specific comparables are independent of what the player bids.
  const ability=context.ability!=null?clamp((context.ability-55)/45):.45;
  const fallback=offer.role==='reserve_driver'?Math.round(20_000_000+ability*60_000_000):Math.round(75_000_000+ability**3*2_000_000_000);
  const annual=context.roleSalaryCents?.[offer.role]??(reference!=null&&(!context.referenceRole||context.referenceRole===offer.role)?reference:fallback);
  const current=context.currentRaceTeam&&(!context.raceEndDate||offer.terms.startDate<=context.raceEndDate);
  const established=(context.currentCompetitiveness??context.currentEmployerReputation??0)>=.7||(context.ability??0)>=88||(context.age!=null&&context.age>=30);
  const unwilling=offer.role==='reserve_driver'&&!!current&&established;
  const refusal=unwilling?'I want to concentrate on my race seat during this contract. A reserve appointment conflicts with that commitment.':null;
  return {role:offer.role,annualCents:Math.max(10000,annual||NEGOTIATION_CONFIG.unknownRaceCents),minimumAnnualCents:Math.max(10000,Math.round(annual*(.55+profile.security*.2))),recurringFloor:.3+profile.security*.15,
    threshold:98+(profile.seed%5),willing:!unwilling,refusal,profile,context};
}
