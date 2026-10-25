import type { CareerState } from "./types";

const emailIds = new Set(["email-floor-delay", "email-sponsor-apex", "email-driver-feedback", "email-fia-homologation", "email-board-expectations"]);
const projectIds = new Set(["proj-fw-spec-b", "proj-floor-tunnel"]);
const sponsorIds = new Set(["sp-title-1", "sp-major-1", "sp-major-2", "sp-tech-1", "sp-tech-2", "sp-supp-1", "sp-supp-2", "offer-crypto-1", "offer-aerospace-1", "offer-beverage-1"]);
const transactionIds = new Set(["tx-init-sponsors", "tx-init-driver-pay", "tx-init-chassis-r&d", "tx-init-facilities"]);

/** One-time migration: identify authored demo records, never clear whole gameplay collections. */
export function removeDemoContent(career: CareerState): CareerState {
  const isDemoEvent = (id: string) => emailIds.has(id)
    || /^evt-\d{4}-(tech-meeting|sponsor-proposal|driver-briefing|fia-homologation|board-review)$/.test(id)
    || [...projectIds].some(projectId => id === projectId || id.startsWith(`${projectId}-`));
  const removedBlocker = !!career.clock.blockingEventId && isDemoEvent(career.clock.blockingEventId);
  const finance = career.finance;
  const removedTransactions = finance?.transactions.filter(tx => transactionIds.has(tx.id)) ?? [];
  const removedSpend = (exempt: boolean) => removedTransactions.filter(tx => tx.amount < 0 && tx.isCostCapExempt === exempt).reduce((sum,tx) => sum - tx.amount, 0);
  return {
    ...career,
    events: career.events?.filter(event => !isDemoEvent(event.id)),
    projects: career.projects?.filter(project => !projectIds.has(project.id)),
    clock: removedBlocker ? {...career.clock, status:"paused", blockingEventId:null} : career.clock,
    scheduler: {...career.scheduler,
      pendingEvent: career.scheduler.pendingEvent && isDemoEvent(career.scheduler.pendingEvent.id) ? null : career.scheduler.pendingEvent,
      processedEventIds: career.scheduler.processedEventIds.filter(id => !isDemoEvent(id)),
      acknowledgedEventIds: career.scheduler.acknowledgedEventIds.filter(id => !isDemoEvent(id)),
    },
    comms: career.comms ? {...career.comms,
      emails:career.comms.emails.filter(email => !emailIds.has(email.id)),
      news:career.comms.news.filter(item => !/^news-[1-4]$/.test(item.id)),
      socialFeed:career.comms.socialFeed.filter(item => !/^social-[1-5]$/.test(item.id)),
      driverBriefings:Object.fromEntries(Object.entries(career.comms.driverBriefings).filter(([,briefing]) => !["Lead Driver","Second Driver"].includes(briefing.driverName))),
      boardConfidence:{...career.comms.boardConfidence,overall:0,financial:0,performance:0,longTerm:0,
        mandates:career.comms.boardConfidence.mandates.filter(item => !["mandate-champ","mandate-cap","mandate-points"].includes(item.id))},
    } : undefined,
    commercial:career.commercial ? {...career.commercial,
      activeContracts:career.commercial.activeContracts.filter(item => !sponsorIds.has(item.id)),
      availableOffers:career.commercial.availableOffers.filter(item => !sponsorIds.has(item.id)),
      merchandiseRevenueYtd:Math.max(0,career.commercial.merchandiseRevenueYtd - 3_400_000),
      driverMarketability:Object.fromEntries(Object.entries(career.commercial.driverMarketability).filter(([id]) => !["driver_1","driver_2"].includes(id))),
    } : undefined,
    finance:finance ? {...finance,transactions:finance.transactions.filter(tx => !transactionIds.has(tx.id)),
      costCapSpent:Math.max(0,finance.costCapSpent-removedSpend(false)),
      costCapExemptSpent:Math.max(0,finance.costCapExemptSpent-removedSpend(true)),
      monthlyProjections:{income:0,expenses:0,net:0},
    } : undefined,
    carDev:career.carDev ? {...career.carDev,inventory:career.carDev.inventory.filter(part =>
      ![...projectIds].some(id => part.id === `part-${id}`) || part.fittedCar1 || part.fittedCar2),
    } : undefined,
  };
}
