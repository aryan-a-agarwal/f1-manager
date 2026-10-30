import {salaryBetween,OFFER_CLAUSES,type OfferClause} from './negotiation';
import {clamp,clauseValue,NEGOTIATION_CONFIG,type Offer,type DemandProfile,type OfferAssessment,type OfferIssue} from './negotiationModel';

export function eligibleClause(role:Offer['role'],kind:OfferClause['kind']){return !(role==='race_driver'?['appearance','practice','promotion']:['win','podium','points','champion','parity']).includes(kind);}
export function assessOffer(o:Offer,d:DemandProfile):OfferAssessment{
  const p=d.profile,c=(kind:OfferClause['kind'])=>clauseValue(o,kind);
  const start=+o.terms.startDate.slice(0,4),end=+o.terms.endDate.slice(0,4);
  const issues:OfferIssue[]=[];
  const add=(key:string,message:string,severity:OfferIssue['severity'],gap:number)=>issues.push({key,message,severity,gap});
  if(!d.willing)add('role',d.refusal!,'hard',100);
  for(const row of o.terms.clauses)if(!eligibleClause(o.role,row.kind))add(row.kind,`${OFFER_CLAUSES.find(s=>s.kind===row.kind)?.label} does not apply to this role.`,'hard',100);
  const yearly:OfferAssessment['guaranteedByYear']=[];
  let cash=c('signing')*100,reference=0,service=0,guaranteed=cash,conditional=0;
  const strength=d.context.competitiveness??.25;
  // Conservative game forecast; these are not fabricated results or future simulation outputs.
  const win=.002+strength**3*.18,podiumOnly=.01+strength**2*.28,pointsOnly=.18+strength*.28;
  for(let year=start;year<=end;year++){
    const from=o.terms.startDate>`${year}-01-01`?o.terms.startDate:`${year}-01-01`,to=o.terms.endDate<`${year}-12-31`?o.terms.endDate:`${year}-12-31`;
    const fraction=salaryBetween(1_000_000,from,to,year)/1_000_000,discount=(1+NEGOTIATION_CONFIG.discount)**(year-start);
    const salary=salaryBetween(o.salaryCents,from,to,start,c('increase'));
    const loyalty=to===`${year}-12-31`?c('loyalty')*100:0;
    const yearsalary=salary+(c('signing')*100)*fraction/(Math.max(1,end-start+1));
    yearly.push({year,cents:salary+loyalty,fraction});service+=fraction;guaranteed+=salary+loyalty;
    cash+=(salary+loyalty*.9)/discount;reference+=d.annualCents*fraction/discount;
    // Each year's recurring salary has its own floor. Signing/late escalation cannot hide token initial pay.
    if(salary<d.annualCents*d.recurringFloor*fraction)add('salary','I need a credible recurring salary in every contracted season.','hard',100*(1-salary/(d.annualCents*fraction)));
    void yearsalary;
    const dates=d.context.raceDates?.filter(date=>date.slice(0,4)===String(year));
    const races=dates?.length?dates.filter(date=>date>=from&&date<=to).length:24*fraction;
    const payWin=c('win')||c('podium')||c('points'),payPodium=c('podium')||c('points');
    const annualBonus=o.role==='race_driver'?races*(win*payWin+podiumOnly*payPodium+pointsOnly*c('points'))+strength**4*.12*c('champion')*fraction:races*.025*c('appearance');
    conditional+=annualBonus*100/discount;
  }
  const guaranteeRatio=guaranteed/Math.max(1,d.minimumAnnualCents*service);
  if(guaranteeRatio<1)add('guarantee','The guaranteed package needs to improve; speculative bonuses cannot replace that security.','hard',100*(1-guaranteeRatio));
  const protection=c('protection');
  if(p.security>.65&&protection<50)add('protection','I require at least 50% remaining-salary protection.','hard',50-protection);
  const securityModifier=1-(1-protection/100)*(.08+p.security*.15);
  const bonusCredit=Math.min(reference*p.bonusCap,conditional*p.riskFactor);
  let soft=0;
  const count=end-start+1,termMismatch=Math.abs(count-p.preferredSeasons);
  soft-=termMismatch*(p.development>p.security?2.5:1.5);
  soft+=Math.min(5,c('increase')/2)*p.development;
  soft+=(NEGOTIATION_CONFIG.defaultCommercial-c('commercial'))*.35*p.autonomy;
  soft+=(NEGOTIATION_CONFIG.defaultSimulator[o.role]-c('simulator'))*.2*p.autonomy;
  soft-=Math.min(12,c('release')*100/Math.max(1,d.annualCents)*2)*p.autonomy;
  if(o.role==='race_driver')soft+=c('parity')*4*p.performance;
  else {soft+=Math.min(6,c('practice'))*p.development+c('promotion')*3*p.development;
    const dates=d.context.raceDates?.filter(date=>date.slice(0,4)===String(start));
    const max=dates?.length?dates.filter(date=>date>=o.terms.startDate).length*2:Math.floor(48*(yearly[0]?.fraction??1));
    if(c('practice')>max)add('practice',`Only ${max} practice opportunities fit the first season.`,'hard',c('practice')-max);
  }
  const utility=100*((cash*securityModifier+bonusCredit)/Math.max(1,reference))+clamp(soft,-20,20);
  if(c('commercial')>25)add('commercial','Reduce the commercial workload or compensate me for the additional days.','important',(c('commercial')-25)/2);
  if(c('simulator')>50)add('simulator','The simulator commitment is too demanding for this package.','important',(c('simulator')-50)/2);
  if(count>p.preferredSeasons+1)add('duration','A shorter commitment would preserve my options.','tradeable',termMismatch);
  if(utility<d.threshold){
    const key=o.role==='reserve_driver'&&p.development>.55&&!c('practice')?'practice':p.performance>.5&&strength>.35&&o.role==='race_driver'?'podium':'package';
    add(key,key==='practice'?'I would like meaningful practice opportunities in this reserve role.':key==='podium'?'A stronger podium bonus could bridge the remaining gap.':'Improve the overall package: guaranteed pay, useful bonuses or protections.', 'important',d.threshold-utility);
  }
  return {utility,threshold:d.threshold,guaranteedRatio:guaranteeRatio,acceptable:issues.every(i=>i.severity!=='hard')&&utility>=d.threshold,issues:issues.sort((a,b)=>(a.severity==='hard'?-1:0)-(b.severity==='hard'?-1:0)||b.gap-a.gap),guaranteedCents:Math.round(guaranteed),conditionalCents:Math.round(conditional),bonusCreditCents:Math.round(bonusCredit),serviceYears:service,guaranteedByYear:yearly,forecast:`Game estimate: ${d.context.competitiveness==null?'unknown competitiveness; conservative forecast':'career results / recorded team tier'}, ${Math.round(p.riskFactor*100)}% bonus credit before a ${Math.round(p.bonusCap*100)}% package cap; future calendars assume 24 GPs.`};
}
