import {DRIVER_ATTRIBUTE_GROUPS,driverAttributeDisplay,matchingDriverRecords,type DatabaseRow} from "./driverProfileData";
import {calculateDriverRatings} from "./driverRatings";
export type DriverDatabaseRow={id:string;name:string;values:Record<string,string|number|null>};
export type DriverDatabaseColumn={key:string;label:string;numeric?:boolean;rating?:boolean};
export const DRIVER_DATABASE_GROUPS:{id:string;label:string;columns:DriverDatabaseColumn[]}[]=[...DRIVER_ATTRIBUTE_GROUPS.map((group,index)=>({id:`attributes-${index}`,label:index===1?"Race attributes":group.title,columns:group.fields.map(key=>({key,label:key==="current_overall_rating"?"Overall rating":key==="potential_rating"?"Estimated potential":key.replaceAll("_"," ").replace(/^./,s=>s.toUpperCase()),numeric:key!=="driver_status"&&key!=="injury_status",rating:true}))})),
 {id:"biography",label:"Biography",columns:[{key:"birthDate",label:"Date of birth"},{key:"birthplace",label:"Birthplace"},{key:"debut",label:"F1 debut",numeric:true}]},
 {id:"career",label:"Imported career totals",columns:[{key:"statsSeason",label:"Snapshot season",numeric:true},{key:"starts",label:"Starts",numeric:true},{key:"wins",label:"Wins",numeric:true},{key:"titles",label:"World titles",numeric:true}]},
];
export const DRIVER_DATABASE_BASE_COLUMNS:DriverDatabaseColumn[]=[{key:"name",label:"Driver"},{key:"age",label:"Age",numeric:true},{key:"nationality",label:"Nationality"},{key:"team",label:"2027 team(s)"},{key:"role",label:"2027 role(s)"},{key:"series",label:"Recorded series"}];
export function buildDriverDatabaseRows(input:{people:DatabaseRow[];drivers:DatabaseRow[];entries:DatabaseRow[];contracts:DatabaseRow[];stats:DatabaseRow[];today:string}):DriverDatabaseRow[]{
 const latestDataset=input.contracts.map(row=>String(row.dataset_id)).sort().at(-1);
 const matched=new Set<unknown>();
 const build=(person:DatabaseRow,driver?:DatabaseRow):DriverDatabaseRow=>{
  if(driver)matched.add(driver.id);
  const name=String(person.display_name??driver?.["driver-name"]??[driver?.first_name,driver?.last_name].filter(Boolean).join(" "));
  const appointments=input.contracts.filter(row=>row.person_id===person.id&&row.dataset_id===latestDataset);
  const dob=typeof person.date_of_birth==="string"?person.date_of_birth:typeof driver?.date_of_birth==="string"?driver.date_of_birth:null;
  const age=dob?Number(input.today.slice(0,4))-Number(dob.slice(0,4))-(input.today.slice(5)<dob.slice(5)?1:0):null;
  const stats=driver?input.stats.filter(row=>row.driver_id===driver.id).sort((a,b)=>Number(b.season??-1)-Number(a.season??-1))[0]:undefined;
  const values:DriverDatabaseRow["values"]={name,age,nationality:typeof person.racing_nationality==="string"?person.racing_nationality:typeof driver?.nationality==="string"?driver.nationality:null,
   team:[...new Set(appointments.map(row=>typeof row.team_name==="string"?row.team_name:null).filter(Boolean))].join("; ")||null,
   role:[...new Set(appointments.map(row=>String(row.role).replaceAll("_"," ")))].join("; ")||null,
   series:[...new Set(input.entries.filter(row=>person.id!==undefined&&row.person_id===person.id).map(row=>String(row.series)))].sort().join("; ")||null,
   birthDate:dob,birthplace:typeof person.place_of_birth==="string"?person.place_of_birth:null,debut:typeof person.f1_debut_season==="number"?person.f1_debut_season:typeof driver?.f1_debut_season==="number"?driver.f1_debut_season:null,
   statsSeason:typeof stats?.season==="number"?stats.season:null,starts:typeof stats?.starts==="number"?stats.starts:null,wins:typeof stats?.wins==="number"?stats.wins:null,titles:typeof stats?.world_championships==="number"?stats.world_championships:null};
  for(const group of DRIVER_ATTRIBUTE_GROUPS)for(const key of group.fields){const display=driverAttributeDisplay(key,driver?.[key]);values[key]=display.unrated||!driver||["driver_status","injury_status"].includes(key)?null:typeof driver[key]==="number"?driver[key]:display.text;}
  const calculated=calculateDriverRatings(driver??{},dob,input.today);values.current_overall_rating=calculated.overall;values.potential_rating=calculated.potential;
  return {id:person.id!==undefined?`person:${person.id}`:`legacy:${driver?.id}`,name,values};
 };
 const rows=input.people.filter(p=>String(p.person_type).includes("driver")).map(person=>build(person,matchingDriverRecords(input.drivers,{name:String(person.display_name),dob:person.date_of_birth as string|null})[0]));
 // Include a legacy-only driver if the source identity catalogue has not caught up.
 for(const driver of input.drivers.filter(row=>!matched.has(row.id)))rows.push(build({},driver));
 return rows;
}
export function compareDriverDatabaseRows(a:DriverDatabaseRow,b:DriverDatabaseRow,key:string,direction:"asc"|"desc"){
 const x=a.values[key],y=b.values[key],missing=(v:unknown)=>v===null||v===undefined||v==="";
 if(missing(x)!==missing(y))return missing(x)?1:-1; // Unrated / unknown always last, in both directions.
 const result=missing(x)?0:typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),"en",{numeric:true,sensitivity:"base"});
 return result===0?a.name.localeCompare(b.name,"en",{sensitivity:"base"})||a.id.localeCompare(b.id):direction==="asc"?result:-result;
}
