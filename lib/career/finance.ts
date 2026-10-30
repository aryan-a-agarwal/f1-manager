import { saveCareer, type CareerStorage } from "./storage";
import type {
  CareerState,
  FinanceState,
  FinancialCategory,
  FinancialTransaction,
} from "./types";

import {initializeFinance,refreshFinance} from './financeEngine';
export const DEFAULT_COST_CAP_LIMIT = 215_000_000;

function persistCareer(career: CareerState, storage?: CareerStorage): CareerState {
  if (storage || (typeof window !== "undefined" && window.localStorage)) {
    return saveCareer(career, storage);
  }
  return career;
}

export function createInitialFinance(teamId: string, year: number): FinanceState {
  const initialCashMap: Record<string, number> = {
    ferrari: 54_000_000,
    mercedes: 52_000_000,
    mclaren: 48_000_000,
    red_bull: 50_000_000,
    aston_martin: 42_000_000,
    alpine: 38_000_000,
    williams: 32_000_000,
    haas: 28_000_000,
    sauber: 30_000_000,
    rb: 34_000_000,
    audi: 36_000_000,
  };

  const cashBalance = initialCashMap[teamId] ?? 40_000_000;

  const initialTransactions: FinancialTransaction[] = [];

  let costCapSpent = 0;
  let costCapExemptSpent = 0;

  for (const tx of initialTransactions) {
    if (tx.amount < 0) {
      if (tx.isCostCapExempt) {
        costCapExemptSpent += Math.abs(tx.amount);
      } else {
        costCapSpent += Math.abs(tx.amount);
      }
    }
  }

  return {
    cashBalance,
    costCapLimit: DEFAULT_COST_CAP_LIMIT,
    costCapSpent,
    costCapExemptSpent,
    transactions: initialTransactions,
    monthlyProjections: {
      income: 0,
      expenses: 0,
      net: 0,
    },
  };
}

export function syncFinanceState(career: CareerState): CareerState {
  return initializeFinance(career);
}

export function recordFinancialTransaction(
  career: CareerState,
  amount: number,
  category: FinancialCategory,
  description: string,
  isCostCapExempt: boolean,
  storage?: CareerStorage,
): CareerState {
  if(!Number.isFinite(amount)||!Number.isSafeInteger(Math.round(amount*100)))throw new Error('Invalid transaction amount.');
  const synced = syncFinanceState(career);
  const fin = synced.finance!;

  const newTx: FinancialTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: synced.clock.date,
    amount,
    category,
    description,
    isCostCapExempt,
  };

  let newCostCapSpent = fin.costCapSpent;
  let newExemptSpent = fin.costCapExemptSpent;

  if (amount < 0) {
    if (isCostCapExempt) {
      newExemptSpent += Math.abs(amount);
    } else {
      newCostCapSpent += Math.abs(amount);
    }
  }

  const updatedFinance: FinanceState = {
    ...fin,
    cashBalance: fin.cashBalance + amount,
    costCapSpent: newCostCapSpent,
    costCapExemptSpent: newExemptSpent,
    transactions: [newTx, ...fin.transactions],
    ...(fin.book?{book:{...fin.book,entries:[...fin.book.entries,{id:newTx.id,sourceId:newTx.id,date:newTx.date,description,category:'other' as const,cashCents:Math.round(amount*100),relevantCents:amount<0&&!isCostCapExempt?Math.round(-amount*100):0,excludedCents:amount<0&&isCostCapExempt?Math.round(-amount*100):0,kind:'adjustment' as const,basis:'career_action' as const}]}}:{}),
  };

  return persistCareer(
    refreshFinance({
      ...synced,
      finance: updatedFinance,
    }),
    storage,
  );
}

export type CostCapStatus = {
  costCapLimit: number;
  costCapSpent: number;
  headroom: number;
  pctSpent: number;
  status: "compliant" | "monitored" | "warning" | "breached";
  sanctionsRisk: string;
};

export function calculateCostCapStatus(career: CareerState): CostCapStatus {
  const fin = career.finance ?? createInitialFinance(career.player.teamId, career.season.year);
  const headroom = fin.costCapLimit - fin.costCapSpent;
  const pctSpent = (fin.costCapSpent / fin.costCapLimit) * 100;

  let status: CostCapStatus["status"] = "compliant";
  let sanctionsRisk = "No sanctions risk. Audit healthy.";

  if (pctSpent > 100) {
    status = "breached";
    sanctionsRisk = "Cost-cap overspend. Regulatory review is required; sanctions are not automatic.";
  } else if (pctSpent >= 95) {
    status = "warning";
    sanctionsRisk = "HIGH ALERT: Within 5% of cap. Factory R&D throttling recommended.";
  } else if (pctSpent >= 85) {
    status = "monitored";
    sanctionsRisk = "SUPERVISED: Approaching spending guardrail.";
  }

  return {
    costCapLimit: fin.costCapLimit,
    costCapSpent: fin.costCapSpent,
    headroom,
    pctSpent,
    status,
    sanctionsRisk,
  };
}
