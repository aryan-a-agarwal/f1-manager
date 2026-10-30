export const OPERATIONAL_RULES='fia-2027-f-01';
export const OPERATIONAL_SOURCE='https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_f_operational_-_iss_01_-_2026-10-19.pdf';
export const dayAfter=(date:string,days=1)=>new Date(Date.parse(date+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
export type TestingResources={runs:number;windOn:number;occupancy:number;geometries:number;compute:number};
export const noTesting=():TestingResources=>({runs:0,windOn:0,occupancy:0,geometries:0,compute:0});
export const addTesting=(a:TestingResources,b:TestingResources)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k as keyof TestingResources]+b[k as keyof TestingResources]])) as TestingResources;
export const scaleTesting=(a:TestingResources,f:number)=>Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v*f])) as TestingResources;
export function testingPeriods(year:number){
  const jan4=new Date(Date.UTC(year,0,4));const monday=dayAfter(jan4.toISOString().slice(0,10),-((jan4.getUTCDay()+6)%7));
  const ends=[9,17,25,35,43].map(w=>dayAfter(monday,w*7-1));
  const dates=[`${year}-01-01`,...ends.map(d=>dayAfter(d))];
  return dates.map((start,i)=>({id:`${year}-${i+1}`,number:i+1,start,end:ends[i]??`${year}-12-31`}));
}
export function testingPeriod(date:string){return testingPeriods(Number(date.slice(0,4))).find(p=>date>=p.start&&date<=p.end)!;}
export function testingAllowance(position:number):TestingResources{
  const c=(70+(Math.min(10,Math.max(1,position))-1)*5)/100;
  return {runs:Math.ceil(320*c),windOn:80*c,occupancy:400*c,geometries:Math.ceil(2000*c),compute:6*c};
}
export function testingFits(used:TestingResources,limit:TestingResources){return (Object.keys(used) as (keyof TestingResources)[]).every(k=>used[k]<=limit[k]+1e-7);}
export function inShutdown(date:string,summerStart:string,summerDays=14){
  return (date>=summerStart&&date<dayAfter(summerStart,summerDays))||date.slice(5)>='12-24'||date.slice(5)<='01-01';
}
export function workingDates(from:string,count:number,summerStart:string){
  const dates:string[]=[];let d=from;for(let n=0;dates.length<count&&n<1500;n++){d=dayAfter(d);const summer=`${d.slice(0,4)}${summerStart.slice(4)}`;if(!inShutdown(d,summer))dates.push(d);}return dates;
}
export const COMPONENTS={
  front_wing:{name:'Front wing',aero:true,work:180,daysPerUnit:3,designCents:30_000_000,unitCents:12_000_000,effects:['low','medium']},
  rear_wing:{name:'Rear wing',aero:true,work:180,daysPerUnit:3,designCents:30_000_000,unitCents:10_000_000,effects:['high','drag']},
  floor:{name:'Floor',aero:true,work:300,daysPerUnit:5,designCents:60_000_000,unitCents:30_000_000,effects:['low','medium','high']},
  bodywork:{name:'Bodywork & cooling',aero:true,work:200,daysPerUnit:4,designCents:35_000_000,unitCents:15_000_000,effects:['cooling','drag']},
  suspension:{name:'Suspension',aero:false,work:240,daysPerUnit:4,designCents:40_000_000,unitCents:18_000_000,effects:['mechanical']},
  brake_cooling:{name:'Brake cooling',aero:true,work:120,daysPerUnit:2,designCents:18_000_000,unitCents:6_000_000,effects:['cooling','mechanical']},
} as const;
export type ComponentKind=keyof typeof COMPONENTS;
export type Performance={low:number;medium:number;high:number;drag:number;mechanical:number;cooling:number;durability:number;mass:number};
export type DevelopmentFocus='balanced'|'performance'|'efficiency'|'durability';
export const PERFORMANCE_LABELS:Record<keyof Performance,string>={low:'Low-speed aero',medium:'Medium-speed aero',high:'High-speed aero',drag:'Drag / active-aero efficiency',mechanical:'Mechanical performance',cooling:'Cooling',durability:'Durability',mass:'Component mass change · kg'};
export const zeroPerformance=():Performance=>({low:0,medium:0,high:0,drag:0,mechanical:0,cooling:0,durability:0,mass:0});
