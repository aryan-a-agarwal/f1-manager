/** Ownership is independent of a team: the same owner may invest in multiple teams. */
export type OwnerIdentity={id:string;name:string;kind:string};
export type OwnershipPeriod={teamId:string;ownerId:string;percentage:number|null;from:string;until:string|null;basis:'reference'|'game_assumption'|'career_generated'};
export type TeamOwnershipState={owners:OwnerIdentity[];periods:OwnershipPeriod[]};
const isDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(`${s}T00:00:00Z`))&&new Date(`${s}T00:00:00Z`).toISOString().slice(0,10)===s;
const previousDay=(s:string)=>new Date(Date.parse(`${s}T00:00:00Z`)-86400000).toISOString().slice(0,10);
const active=(p:OwnershipPeriod,teamId:string,ownerId:string,date:string)=>p.teamId===teamId&&p.ownerId===ownerId&&p.from<=date&&(!p.until||p.until>=date);

/** Preview a future share transfer in career-owned data; public reference records are untouched. */
export function transferTeamStake(state:TeamOwnershipState,input:{teamId:string;fromOwnerId:string;toOwnerId:string;date:string;percentage:number}):TeamOwnershipState{
  const {teamId,fromOwnerId,toOwnerId,date,percentage}=input;
  if(!isDate(date)||!Number.isFinite(percentage)||percentage<=0||percentage>100||Math.abs(percentage*10000-Math.round(percentage*10000))>1e-7)throw new Error('Choose a valid transfer date and percentage to four decimal places.');
  if(fromOwnerId===toOwnerId||!state.owners.some(o=>o.id===fromOwnerId)||!state.owners.some(o=>o.id===toOwnerId))throw new Error('Choose two different recorded owners.');
  const seller=state.periods.filter(p=>active(p,teamId,fromOwnerId,date));
  const buyer=state.periods.filter(p=>active(p,teamId,toOwnerId,date));
  if(seller.length!==1||buyer.length>1)throw new Error('Resolve overlapping ownership records first.');
  if(seller[0].percentage===null||buyer.some(p=>p.percentage===null))throw new Error('Record the existing stake before transferring shares.');
  if(percentage>seller[0].percentage)throw new Error('The seller does not hold that many shares.');
  if([...seller,...buyer].some(p=>p.until!==null)||state.periods.some(p=>p.teamId===teamId&&p.from>date))throw new Error('Resolve future ownership changes before transferring shares.');
  const knownTotal=state.periods.filter(p=>p.teamId===teamId&&p.from<=date&&(!p.until||p.until>=date)).reduce((sum,p)=>sum+(p.percentage??0),0);
  if(knownTotal>100)throw new Error('Recorded stakes exceed 100%.');
  const affected=new Set([...seller,...buyer]);
  const periods=state.periods.flatMap(p=>affected.has(p)?p.from<date?[{...p,until:previousDay(date)}]:[]:[p]);
  const remaining=Math.round((seller[0].percentage-percentage)*10000)/10000;
  if(remaining>0)periods.push({teamId,ownerId:fromOwnerId,percentage:remaining,from:date,until:null,basis:'career_generated'});
  periods.push({teamId,ownerId:toOwnerId,percentage:Math.round(((buyer[0]?.percentage??0)+percentage)*10000)/10000,from:date,until:null,basis:'career_generated'});
  return {...state,periods};
}
