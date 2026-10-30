import type {FinanceRuleSet} from './financeTypes';
export const FINANCE_RULE_SOURCE = 'https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_-_f1_teams_-_iss_08_-_2026-10-01.pdf';
export function createFinanceRules(year: number, races: number, sprints: number): FinanceRuleSet {
  return {version:'fia-finance-2026-issue08-game-v2',year,currency:'USD',baseCapCents:21_500_000_000,indexationPercent:0,raceCount:races,sprintCount:sprints,
    extraRaceCents:Math.max(0,races-24)*180_000_000,sprintAdjustmentCents:Math.max(0,sprints-6)*30_000_000,
    carryForwardCents:0,integrationAdjustmentCents:0,sourceUrl:FINANCE_RULE_SOURCE,
    assumptions:['Indexation is held at 0% until a verified season rate is available.', 'No team-specific PU integration allocation is recorded; no relief is applied.', 'No opening audited carry-forward or location-based payroll relief is assumed.', 'Staff and supplier classifications require recorded terms and supporting reasons.', 'Future seasons retain this rules framework until a new season ruleset is supplied.']};
}
export function financeCap(rules: FinanceRuleSet) {return Math.round((rules.baseCapCents+rules.extraRaceCents)*(1+rules.indexationPercent/100));}
export function financeAdjustments(rules: FinanceRuleSet) {return rules.sprintAdjustmentCents+rules.carryForwardCents+rules.integrationAdjustmentCents;}
