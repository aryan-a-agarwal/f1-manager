import type {AgreementBonusAward} from './financeAgreementBonuses';
import type {ChampionshipFinanceState} from './championshipFinance';
import type {FinanceAccount,FinanceClassification,FinanceJournalLine,FinanceOperations} from './financeOperationsTypes';
import type {ManufacturingFinanceState} from './manufacturingFinance';
import type {PersonnelFinanceState} from './personnelFinance';
export type FinanceCategory = 'owner_funding' | 'sponsorship' | 'prize_receipts' | 'commercial_income' | 'driver_pay' | 'driver_bonus' | 'contract_exit' | 'staff_pay' | 'facilities' | 'travel' | 'development' | 'production' | 'capital' | 'depreciation' | 'other';
export type FinanceRuleSet = {
  version: string; year: number; currency: 'USD'; baseCapCents: number; indexationPercent: number;
  raceCount: number; sprintCount: number; extraRaceCents: number; sprintAdjustmentCents: number;
  carryForwardCents: number; integrationAdjustmentCents: number; sourceUrl: string; assumptions: string[];
};
export type FinanceEntry = {
  id: string; sourceId: string; date: string; description: string; category: FinanceCategory;
  cashCents: number; relevantCents: number; excludedCents: number;
  obligationId?:string; accountLines?:FinanceJournalLine[];
  kind: 'recognition' | 'payment' | 'adjustment'; basis: 'game_assumption' | 'career_contract' | 'career_action' | 'legacy';
};
export type FinanceObligation = {
  id: string; description: string; counterparty: string; category: FinanceCategory;
  recognitionDate: string; dueDate: string; amountCents: number; relevantCents: number;
  basis: FinanceEntry['basis']; sourceId: string;
  recognitionCents?:number; autoSettle?:boolean; account?:FinanceAccount; invoiceId?:string; classification?:FinanceClassification;
};
export type FinanceAsset = {id: string; name: string; acquiredOn: string; costCents: number; lifeMonths: number; relevant: boolean; residualCents?:number; openingAccumulatedCents?:number; regulatoryAccumulatedCents?:number; depreciationStartOn?:string; disposedOn?:string; disposalProceedsCents?:number};
export type FinanceBook = {
  version: 1 | 2; activatedOn: string; processedThrough: string; baselineVersion: string;
  cashKnown?: boolean; debtKnown?: boolean;
  openingCashCents: number; openingDebtCents: number; openingRelevantCents: number; openingExcludedCents: number;
  annual: Record<string, number>; fundedSeasons: number[]; owners: string[]; rules: FinanceRuleSet[];
  agreementBonusAwards?:AgreementBonusAward[]; championshipFinance?:ChampionshipFinanceState; operations?:FinanceOperations; manufacturing?:ManufacturingFinanceState; personnel?:PersonnelFinanceState;
  entries: FinanceEntry[]; obligations: FinanceObligation[]; assets: FinanceAsset[];
};
