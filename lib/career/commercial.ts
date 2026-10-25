import { saveCareer, type CareerStorage } from "./storage";
import type {
  CareerState,
  ChampionshipState,
  CommercialState,
  SponsorContract,
  SponsorSlot,
  WccPrizeProjection,
} from "./types";

export const CONCORDE_PRIZE_POOL: Record<number, number> = {
  1: 125_000_000,
  2: 114_000_000,
  3: 104_000_000,
  4: 94_000_000,
  5: 84_000_000,
  6: 74_000_000,
  7: 64_000_000,
  8: 54_000_000,
  9: 45_000_000,
  10: 38_000_000,
  11: 32_000_000,
};

function persistCareer(career: CareerState, storage?: CareerStorage): CareerState {
  if (storage || (typeof window !== "undefined" && window.localStorage)) {
    return saveCareer(career, storage);
  }
  return career;
}

export function calculateWccPrizeProjection(teamId: string, championship: ChampionshipState): WccPrizeProjection {
  const sortedTeams = [...championship.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.teamName.localeCompare(b.teamName);
  });

  const teamIdx = sortedTeams.findIndex((t) => t.teamId === teamId);
  const position = teamIdx >= 0 ? teamIdx + 1 : 6;
  const currentPayout = CONCORDE_PRIZE_POOL[position] ?? 50_000_000;

  let gapAheadPts: number | null = null;
  let payoutDeltaAhead: number | null = null;
  let targetConstructorAhead: string | null = null;

  if (teamIdx > 0) {
    const ahead = sortedTeams[teamIdx - 1];
    gapAheadPts = ahead.points - (sortedTeams[teamIdx]?.points ?? 0);
    const aheadPayout = CONCORDE_PRIZE_POOL[position - 1] ?? currentPayout;
    payoutDeltaAhead = aheadPayout - currentPayout;
    targetConstructorAhead = ahead.teamName;
  }

  let gapBehindPts: number | null = null;
  let payoutDeltaBehind: number | null = null;
  let threatConstructorBehind: string | null = null;

  if (teamIdx < sortedTeams.length - 1 && teamIdx >= 0) {
    const behind = sortedTeams[teamIdx + 1];
    gapBehindPts = (sortedTeams[teamIdx]?.points ?? 0) - behind.points;
    const behindPayout = CONCORDE_PRIZE_POOL[position + 1] ?? currentPayout;
    payoutDeltaBehind = currentPayout - behindPayout;
    threatConstructorBehind = behind.teamName;
  }

  return {
    currentPosition: position,
    projectedPayout: currentPayout,
    gapAheadPts,
    payoutDeltaAhead,
    targetConstructorAhead,
    gapBehindPts,
    payoutDeltaBehind,
    threatConstructorBehind,
  };
}

export function createInitialCommercial(teamId: string, year: number): CommercialState {
  const teamPrestigeMap: Record<string, number> = {
    ferrari: 95,
    mercedes: 90,
    mclaren: 92,
    red_bull: 94,
    aston_martin: 80,
    alpine: 72,
    williams: 74,
    haas: 60,
    sauber: 62,
    rb: 68,
    audi: 70,
  };

  const activeContracts: SponsorContract[] = [];
  const availableOffers: SponsorContract[] = [];

  return {
    activeContracts,
    availableOffers,
    teamPrestige: teamPrestigeMap[teamId] ?? 75,
    merchandiseRevenueYtd: 0,
    driverMarketability: {},
    wccPrizeProjection: {
      currentPosition: 0, projectedPayout: 0, gapAheadPts: null, payoutDeltaAhead: null,
      targetConstructorAhead: null, gapBehindPts: null, payoutDeltaBehind: null, threatConstructorBehind: null,
    },
  };
}

export function syncCommercialState(career: CareerState): CareerState {
  const currentComm = career.commercial ?? createInitialCommercial(career.player.teamId, career.season.year);
  const updatedProjection = calculateWccPrizeProjection(career.player.teamId, career.championship);

  return {
    ...career,
    commercial: {
      ...currentComm,
      wccPrizeProjection: updatedProjection,
    },
  };
}

export function executeDriverPrDay(
  career: CareerState,
  contractId: string,
  driverKey: "driver_1" | "driver_2",
  storage?: CareerStorage,
): CareerState {
  const synced = syncCommercialState(career);
  const contract = synced.commercial!.activeContracts.find((c) => c.id === contractId);
  if (!contract) throw new Error(`Sponsor contract ${contractId} not found.`);
  if (contract.prDaysCompleted >= contract.prDaysRequired) {
    throw new Error(`All ${contract.prDaysRequired} promotional commitments for ${contract.name} have already been fulfilled.`);
  }

  // 1. Update contract PR completion
  const updatedContracts = synced.commercial!.activeContracts.map((c) =>
    c.id === contractId ? { ...c, prDaysCompleted: c.prDaysCompleted + 1 } : c,
  );

  // 2. Award bonus cash & log transaction
  const cashBonus = contract.prBonusPerEvent;
  const currentCash = synced.finance?.cashBalance ?? 42_000_000;
  const currentTransactions = synced.finance?.transactions ?? [];

  const newTransaction = {
    id: `tx-pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: synced.clock.date,
    amount: cashBonus,
    category: "sponsor_bonus" as const,
    description: `Driver PR Event: ${contract.name} (${driverKey === "driver_1" ? "Driver 1" : "Driver 2"})`,
    isCostCapExempt: true,
  };

  // 3. Apply driver fatigue / sim prep trade-off
  let updatedBriefings = synced.comms?.driverBriefings;
  if (updatedBriefings && updatedBriefings[driverKey]) {
    updatedBriefings = {
      ...updatedBriefings,
      [driverKey]: {
        ...updatedBriefings[driverKey],
        morale: Math.max(20, updatedBriefings[driverKey].morale - 3),
        confidence: Math.max(20, updatedBriefings[driverKey].confidence - 4),
      },
    };
  }

  return persistCareer(
    {
      ...synced,
      commercial: {
        ...synced.commercial!,
        activeContracts: updatedContracts,
      },
      finance: synced.finance
        ? {
            ...synced.finance,
            cashBalance: currentCash + cashBonus,
            transactions: [newTransaction, ...currentTransactions],
          }
        : undefined,
      comms: synced.comms
        ? {
            ...synced.comms,
            driverBriefings: updatedBriefings ?? synced.comms.driverBriefings,
          }
        : undefined,
    },
    storage,
  );
}

export function signSponsorContract(
  career: CareerState,
  offerId: string,
  slot: SponsorSlot,
  storage?: CareerStorage,
): CareerState {
  const synced = syncCommercialState(career);
  const offer = synced.commercial!.availableOffers.find((o) => o.id === offerId);
  if (!offer) throw new Error(`Sponsor offer ${offerId} not found.`);

  // Replace existing contract in this slot
  const newContract: SponsorContract = {
    ...offer,
    slot,
  };

  const updatedActive = synced.commercial!.activeContracts.filter((c) => c.slot !== slot);
  updatedActive.push(newContract);

  const updatedOffers = synced.commercial!.availableOffers.filter((o) => o.id !== offerId);

  return persistCareer(
    {
      ...synced,
      commercial: {
        ...synced.commercial!,
        activeContracts: updatedActive,
        availableOffers: updatedOffers,
      },
    },
    storage,
  );
}
