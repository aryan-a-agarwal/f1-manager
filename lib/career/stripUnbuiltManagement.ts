import type {CareerState} from "./types";

/** Keep the implemented season core; management systems will be introduced separately. */
export function stripUnbuiltManagement(career:CareerState):CareerState {
  const sessionIds=new Set(career.season.calendar.rounds.flatMap(round=>round.sessions.map(session=>session.id)));
  const keepBlocker=career.clock.blockingEventId!==null&&sessionIds.has(career.clock.blockingEventId);
  const {comms,commercial,finance,carDev,facilities,market,weekendSim,...core}=career;
  return {...core,events:[],projects:[],
    clock:keepBlocker?career.clock:{...career.clock,status:"paused",blockingEventId:null},
    scheduler:{...career.scheduler,
      pendingEvent:keepBlocker?career.scheduler.pendingEvent:null,
      processedEventIds:career.scheduler.processedEventIds.filter(id=>id.startsWith("round-")),
      acknowledgedEventIds:career.scheduler.acknowledgedEventIds.filter(id=>id.startsWith("round-")),
    },
  };
}
