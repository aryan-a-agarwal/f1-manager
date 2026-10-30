import type {ContractClausePackage} from './contractClauses';
import type {OfferClause} from './negotiation';

/** Map only equivalent seeded terms; top-three championship bonuses and outside-racing rights have no exact editor equivalent. */
export function startingClausePreferences(pack:ContractClausePackage|undefined):OfferClause[]{
  if(!pack)return [];
  const clauses:OfferClause[]=[];
  const put=(kind:OfferClause['kind'],value:unknown,divisor=1)=>{if(typeof value==='number'&&Number.isFinite(value)&&value>=0)clauses.push({kind,value:value/divisor});};
  for(const item of pack.clauses){const p=item.parameters;
    switch(item.kind){
      case 'race_bonus':put('win',p.winCents,100);put('podium',p.podiumCents,100);put('points',p.pointsFinishCents,100);break;
      case 'championship_bonus':if(p.maximumPosition===1)put('champion',p.amountCents,100);break;
      case 'equipment_parity':put('parity',1);break;
      case 'commercial_duties':put('commercial',p.daysPerSeason);break;
      case 'loyalty_bonus':put('loyalty',p.annualCents,100);break;
      case 'termination_protection':put('protection',p.remainingBaseSalaryPercent);break;
      case 'salary_escalator':put('increase',p.annualPercent);break;
      case 'substitution_fee':put('appearance',p.perGrandPrixStartCents,100);break;
      case 'simulator_duties':put('simulator',p.daysPerSeason);break;
      case 'practice_opportunity':put('practice',p.sessionsPerSeason);break;
      case 'promotion_review':put('promotion',1);break;
    }
  }
  return clauses;
}
