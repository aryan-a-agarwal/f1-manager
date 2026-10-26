import {normalizedName} from "./profileNavigation";

export type DatabaseRow=Record<string,unknown>;
export const DRIVER_PROFILE_TABLES={
  driverRecords:"drivers",driverContracts:"driver_contracts",driverStats:"driver_career_stats",driverRatings:"driver_rating_history",
  startingContracts:"f1_starting_driver_contracts",startingSlots:"f1_starting_team_slots",startingDatasets:"f1_starting_grid_datasets",
  legacyTeams:"teams",
} as const;

export const DRIVER_ATTRIBUTE_GROUPS=[
  {title:"Ability & potential",fields:["current_overall_rating","potential_rating","experience_rating","experience_level_code"]},
  {title:"Race performance",fields:["pace","qualifying","overtaking","defending","racecraft","wet_weather_ability","consistency","aggression"]},
  {title:"Car & tyre management",fields:["battery_management","team_orders_understanding","reliability","tyre_management","pit_stop_precision","tyre_warm_up_ability","temperature_control"]},
  {title:"Technique & development",fields:["adaptability","reactions","braking","cornering","smoothness","incident_proneness","development_rate"]},
  {title:"Condition & commercial",fields:["driver_status","morale","fitness","form","injury_status","marketability","reputation","personal_sponsorship_backing","management_support_strength"]},
] as const;

// These columns came from schema defaults, not the imported driver-rating allocation.
// Remove a field here only when deliberate ratings have been supplied for that field.
// Now that all 91 drivers have calibrated ratings for technique, development, commercial & mental attributes,
// this set is empty so all deliberate ratings display properly in driver profiles.
export const UNALLOCATED_DRIVER_RATINGS=new Set<string>([]);
const RATING_FIELDS=new Set<string>(DRIVER_ATTRIBUTE_GROUPS.flatMap(group=>[...group.fields]).filter(key=>key!=="driver_status"&&key!=="injury_status"));
export function driverAttributeDisplay(key:string,value:unknown){
  const unrated=RATING_FIELDS.has(key)&&(UNALLOCATED_DRIVER_RATINGS.has(key)||typeof value!=="number");
  return {text:unrated?"Unrated":databaseValueText(key,value),unrated,rating:!unrated&&RATING_FIELDS.has(key)&&key!=="experience_level_code"&&typeof value==="number"?value:null};
}

/** Database ID spaces differ. Match the legacy driver by identity, never by coincident numeric IDs. */
export function matchingDriverRecords(rows:DatabaseRow[],identity:{name:string;firstName?:string;lastName?:string;dob?:string|null}){
  const key=normalizedName(identity.name);
  return rows.filter(row=>{
    const names=[row["driver-name"],row.driver_name,row.display_name,[row.first_name,row.last_name].filter(Boolean).join(" ")];
    return names.some(name=>typeof name==="string"&&normalizedName(name)===key)
      && !(identity.dob&&row.date_of_birth&&row.date_of_birth!==identity.dob);
  });
}
export function linkedDriverRows(rows:DatabaseRow[],drivers:DatabaseRow[]){
  const ids=new Set(drivers.map(d=>d.id));return rows.filter(row=>ids.has(row.driver_id));
}
export function databaseFieldLabel(key:string){
  const overrides:Record<string,string>={id:"Record ID",person_id:"Person record",driver_id:"Driver record",team_id:"Team record",driver_slug:"Driver identifier",slug:"Identifier",annual_salary_usd_cents:"Annual salary · USD",base_salary_usd_millions:"Imported base salary · USD millions",f1_debut_season:"F1 debut season",source_url:"Contract source",seat_source_url:"Seat source",date_of_birth:"Date of birth",overall_rating:"Overall rating",current_overall_rating:"Overall rating",reference_quality:"Reference quality"};
  return overrides[key]??key.replaceAll("_"," ").replaceAll("-"," ").replace(/^./,c=>c.toUpperCase());
}
export function databaseValueText(key:string,value:unknown):string{
  if(value===null||value===undefined||value==="")return "Not recorded";
  if(typeof value==="boolean")return value?"Yes":"No";
  if(key==="annual_salary_usd_cents"&&typeof value==="number")return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value/100);
  if(typeof value==="object")return JSON.stringify(value,null,2);
  return String(value);
}

/** Retains every field, including zero values and unknown/new columns, for the record disclosure. */
export function databaseFields(row:DatabaseRow,driverAttributes=false){return Object.entries(row).map(([key,value])=>({key,label:databaseFieldLabel(key),value:driverAttributes?driverAttributeDisplay(key,value).text:databaseValueText(key,value)}));}
