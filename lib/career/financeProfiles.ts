import type {CareerState} from './types';
import type {FinanceAgreementInput,FinanceBudget,FinanceCounterparty,FinanceOpeningInput} from './financeOperationsTypes';
import {recordOpeningPosition,saveFinanceCounterparty,createFinanceAgreement,saveFinanceBudget,checkNewFinanceCommitments} from './financeOperations';
import {recordOpeningFinanceAsset,processFinance} from './financeEngine';
import {recordStaffEmployment,type StaffEmployment} from './personnelFinance';
import type {FinanceAsset} from './financeTypes';
import {teams} from '../data/grid';
import baselines from '../../supabase/seed-data/2027-team-baselines.json';

export type FinanceProfile={id:string;version:string;teamId:string;effectiveOn:string;note:string;opening:FinanceOpeningInput;counterparties:FinanceCounterparty[];agreements:FinanceAgreementInput[];budgets:Omit<FinanceBudget,'approvedOn'>[];staff:Omit<StaffEmployment,'recordedOn'>[];assets:FinanceAsset[]};
/** Templates are previews only. Never applied by createCareer or ordinary save migration. */
export function financeProfileTemplate(teamId:string,date:string,estimates=false):FinanceProfile{
  const team=teams.find(t=>t.id===teamId);if(!team)throw new Error('Unknown team.');
  const year=Number(date.slice(0,4)),base=baselines.teams.find(t=>t.team_slug===teamId||t.team_slug==='red-bull-racing'&&teamId==='red-bull')!,f=base.financial_assumptions_usd_millions as Record<string,number>;
  const prefix=`profile-${teamId}-${year}`,note=estimates?'Explicit game scenario based on provisional team estimates, not private contract data. Supplier terms, assets and named personnel still require review.':'Recorded values only; unknown remains unknown.';
  const result:FinanceProfile={id:prefix,version:'1',teamId,effectiveOn:date,note,opening:{asOf:date,cashCents:estimates?Math.round(f.cash_balance_usd_millions*1e8):null,debtCents:estimates?Math.round(f.debt_usd_millions*1e8):null,restrictedCents:estimates?0:null,basis:estimates?'scenario':'recorded',note},counterparties:[],agreements:[],budgets:[],staff:[],assets:[]};
  if(!estimates)return result;
  const end=`${year}-12-31`,start=new Date(Date.UTC(year,Number(date.slice(5,7)),0)).toISOString().slice(0,10);
  const add=(key:string,title:string,direction:'income'|'expense',category:FinanceAgreementInput['category'],kind:FinanceAgreementInput['kind'],account:FinanceAgreementInput['account'])=>{
    const annual=f[key];if(!annual)return;const partyId=`${prefix}-${key}`;
    result.counterparties.push({id:partyId,name:`${team.shortName} scenario · ${title}`,kind:direction==='income'?'customer':'supplier'});
    result.agreements.push({id:partyId,partyId,title:`Scenario: ${title}`,direction,kind,category,account,amountCents:Math.round(annual*1e8/12),startDate:start,endDate:end,frequency:'monthly',classification:direction==='expense'?'relevant':'excluded',relevantPercent:direction==='expense'?100:0,autoSettle:true,guaranteed:true,basis:'scenario',note});
  };
  add('owner_funding_usd_millions','owner contributions','income','owner_funding','owner_equity','equity');
  add('prize_money_usd_millions','agreed prize instalments','income','prize_receipts','prize','revenue');
  add('sponsorship_income_usd_millions','sponsorship','income','sponsorship','sponsorship','revenue');
  for(const [key,title,kind] of [['merchandise_income_usd_millions','merchandise','merchandise'],['hospitality_income_usd_millions','hospitality','hospitality'],['licensing_income_usd_millions','licensing','licensing']] as const)add(key,title,'income','commercial_income',kind,'revenue');
  // Existing driver contracts already generate payroll. Design and production stay action-driven.
  add('staff_cost_usd_millions','aggregate workforce costs','expense','staff_pay','staff','expenses');
  add('facility_upkeep_usd_millions','facility operation','expense','facilities','lease','expenses');
  add('travel_cost_usd_millions','season travel programme','expense','travel','travel','expenses');
  for(const [key,department] of [['manufacturing_cost_usd_millions','production'],['research_cost_usd_millions','development']] as const)result.budgets.push({id:`${prefix}-${department}`,year,department,limitCents:Math.round(f[key]*1e8),note:'Scenario authorisation limit; this is not an expense or a purchase.'});
  return result;
}
export function applyFinanceProfile(career:CareerState,p:FinanceProfile):CareerState{
  if(!p||p.teamId!==career.player.teamId||p.effectiveOn!==career.clock.date||p.opening?.asOf!==career.clock.date||!p.id||!p.version||!p.note?.trim())throw new Error('The profile must name this team, today and its provenance.');
  const b=career.finance!.book!,o=b.operations!;
  if(o.appliedProfiles?.some(x=>x.id===p.id))throw new Error('This profile is already applied.');
  if(o.opening||o.agreements.length||o.invoices.length||b.personnel?.staff.length||b.assets.length)throw new Error('A starting profile cannot overwrite existing financial setup. Use the individual record forms to extend it.');
  let c=recordOpeningPosition(career,p.opening);
  for(const party of p.counterparties)c=saveFinanceCounterparty(c,party);
  for(const a of [...p.agreements].sort((a,b)=>Number(b.direction==='income')-Number(a.direction==='income')))c=createFinanceAgreement(c,a);
  for(const staff of p.staff)c=recordStaffEmployment(c,staff);
  for(const asset of p.assets)c=recordOpeningFinanceAsset(c,asset,asset.openingAccumulatedCents??0);
  for(const budget of p.budgets)c=saveFinanceBudget(c,{...budget,approvedOn:c.clock.date});
  checkNewFinanceCommitments(c);c=processFinance(c);
  const book=c.finance!.book!;return {...c,finance:{...c.finance!,book:{...book,operations:{...book.operations!,appliedProfiles:[...(book.operations!.appliedProfiles??[]),{id:p.id,version:p.version,appliedOn:c.clock.date,note:p.note}]}}}};
}
