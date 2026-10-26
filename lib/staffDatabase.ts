import type {DatabaseRow} from "./driverProfileData";
import {normalizedName} from "./profileNavigation";

export const STAFF_GROUPS=[
 {id:"appointment",label:"Appointments",fields:["team","role","season"]},
 {id:"biography",label:"Biography",fields:["age","nationality","birthDate","birthplace"]},
 {id:"aerodynamics",label:"Aerodynamics & chassis",fields:["front_wing_expertise","rear_wing_expertise","floor_expertise","sidepod_expertise","chassis_expertise","suspension_expertise","brake_expertise"]},
 {id:"power",label:"Power & electronics",fields:["power_unit_expertise","gearbox_expertise","ers_expertise","cooling_expertise","electronics_expertise"]},
 {id:"engineering",label:"Engineering",fields:["primary_specialism","diagnostics_rating","repair_speed_rating","setup_optimisation_rating"]},
] as const;
export type StaffRow={id:string;name:string;values:Record<string,string|number|null>};
export function buildStaffRows(people:DatabaseRow[],appointments:DatabaseRow[],teams:DatabaseRow[],today:string):StaffRow[]{
 return people.filter(p=>String(p.person_type??"").includes("staff")||appointments.some(a=>a.person_id===p.id)).map(person=>{
  const roles=appointments.filter(a=>a.person_id===person.id).sort((a,b)=>Number(b.season)-Number(a.season));
  const latest=roles[0]?.season, active=roles.filter(a=>a.season===latest);
  const dob=typeof person.date_of_birth==="string"?person.date_of_birth:null;
  const values:StaffRow["values"]={team:[...new Set(active.map(a=>teams.find(t=>t.id===a.team_id)?.short_name).filter(Boolean))].join("; ")||null,role:[...new Set(active.map(a=>a.role_title).filter(Boolean))].join("; ")||null,season:typeof latest==="number"?latest:null,age:dob?Number(today.slice(0,4))-Number(dob.slice(0,4))-(today.slice(5)<dob.slice(5)?1:0):null,nationality:typeof person.racing_nationality==="string"?person.racing_nationality:null,birthDate:dob,birthplace:typeof person.place_of_birth==="string"?person.place_of_birth:null};
  // Staff ratings have no identity link or allocation provenance; schema defaults are not ratings.
  for(const group of STAFF_GROUPS.slice(2))for(const key of group.fields)values[key]=null;
  return {id:`person:${person.id}`,name:String(person.display_name??"Name not recorded"),values};
 });
}
export function compareStaffRows(a:StaffRow,b:StaffRow,key:string,direction:"asc"|"desc"){
 const x=key==="name"?a.name:a.values[key],y=key==="name"?b.name:b.values[key];
 const missing=(v:unknown)=>v===null||v===undefined||v==="";
 if(missing(x)!==missing(y))return missing(x)?1:-1;
 const result=missing(x)?0:typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),"en",{numeric:true,sensitivity:"base"});
 return result?(direction==="asc"?result:-result):a.name.localeCompare(b.name,"en",{sensitivity:"base"})||a.id.localeCompare(b.id);
}
export function staffMatches(row:StaffRow,search:string){return normalizedName([row.name,row.values.team,row.values.role,row.values.nationality].join(" ")).includes(normalizedName(search));}
export function staffFieldLabel(key:string){return ({team:"Team",role:"Role",season:"Recorded season",age:"Age",birthDate:"Date of birth",birthplace:"Place of birth",nationality:"Nationality",primary_specialism:"Specialism"} as Record<string,string>)[key]??key.replaceAll("_"," ").replace(/^./,x=>x.toUpperCase());}
