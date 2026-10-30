import type {CareerState} from './types';
import type {ContractRole} from './contracts';
import {effectiveContractSeat} from './contractEffective';

export type ContractStartOption={id:'today'|'next_race'|'summer_break'|'season_end'|'next_season_end'|'outgoing_contract_end';label:string;date:string|null;reason?:string};
const nextDay=(date:string)=>new Date(Date.parse(`${date}T00:00:00Z`)+86400000).toISOString().slice(0,10);

export function outgoingContractStartOption(career:CareerState,role:ContractRole,seat:1|2):ContractStartOption{
  const label='End of outgoing driver contract';
  const baseline=career.contractDesk?.baseline;
  const effective=effectiveContractSeat(career,career.player.teamId,role,seat,career.clock.date);
  const slot=effective.slot;
  if(!slot?.personId)return {id:'outgoing_contract_end',label,date:null,reason:'No driver in this seat'};
  const fact=effective.fact;
  const year=fact?.scenarioTerms?.endSeason??fact?.exactEnd;
  if(!year)return {id:'outgoing_contract_end',label,date:null,reason:'Contract end is unrecorded'};
  const date=`${Number(year)+1}-01-01`;
  if(date<career.clock.date)return {id:'outgoing_contract_end',label,date:null,reason:'Contract has already ended'};
  if(Number(year)+1>career.season.year+5)return {id:'outgoing_contract_end',label,date:null,reason:'Beyond the available start window'};
  return {id:'outgoing_contract_end',label,date};
}

/** Dates are effective at the beginning of a UTC game day. Season-end starts follow 31 December. */
export function contractStartOptions(career:CareerState,role?:ContractRole,seat?:1|2):ContractStartOption[]{
  const {calendar,year}=career.season;
  const today=career.clock.date;
  const races=calendar.rounds.flatMap(round=>round.sessions
    .filter(session=>session.kind==='race'&&session.status!=='completed'&&session.status!=='cancelled'&&session.status!=='postponed'&&session.date>=today)
    .map(session=>({date:session.date,name:round.grandPrixName})))
    .sort((a,b)=>a.date.localeCompare(b.date));
  const race=races[0];
  // Generated calendars currently record championship breaks, rather than a named summer break.
  // Choose the longest break overlapping July/August; do not invent a date if none exists.
  const breaks=(calendar.periods??[]).filter(period=>period.kind==='break'&&period.startDate<=`${year}-08-31`&&period.endDate>=`${year}-07-01`)
    .sort((a,b)=>Number(/summer/i.test(b.label))-Number(/summer/i.test(a.label)) ||
      (Date.parse(b.endDate)-Date.parse(b.startDate))-(Date.parse(a.endDate)-Date.parse(a.startDate)) || a.startDate.localeCompare(b.startDate));
  const summer=breaks[0];
  const seasonEnd=`${year+1}-01-01`,nextSeasonEnd=`${year+2}-01-01`;
  return [
    {id:'today',label:'Today',date:today},
    {id:'next_race',label:'After next race',date:race?nextDay(race.date):null,reason:race?undefined:'No upcoming race in this season'},
    {id:'summer_break',label:'Summer break',date:summer&&summer.startDate>=today?summer.startDate:null,reason:!summer?'No summer break in the saved calendar':summer.startDate<today?'Summer break has started or passed':undefined},
    {id:'season_end',label:'End of this season',date:seasonEnd>=today?seasonEnd:null,reason:seasonEnd<today?'Date has passed':undefined},
    {id:'next_season_end',label:'End of next season',date:nextSeasonEnd>=today?nextSeasonEnd:null,reason:nextSeasonEnd<today?'Date has passed':undefined},
    ...(role&&seat?[outgoingContractStartOption(career,role,seat)]:[]),
  ];
}

export function contractStartDateLabel(date:string){
  const [year,month,day]=date.split('-');
  return `${day}/${month}/${year}`;
}
