import {databaseFieldLabel,type DatabaseRow} from "./driverProfileData";
import {normalizedName} from "./profileNavigation";

// The team schema seeds these attributes with placeholders. No team-rating
// allocation is present in the identity, driver-rating or achievements imports.
export function isTeamRatingField(key:string){return key.endsWith("_rating")||key.startsWith("ai_")||["staff_morale","driver_morale","board_confidence","financial_risk_tolerance"].includes(key);}
export function teamAttributeDisplay(key:string,value:unknown){
  return isTeamRatingField(key)?"Unrated":value===null||value===undefined?"Not recorded":String(value);
}
export function matchingTeamRecord(rows:DatabaseRow[],slug?:string,name?:string){
  const aliases=new Set([slug,slug==="red-bull"?"red-bull-racing":undefined].filter(Boolean));
  return rows.find(row=>aliases.has(String(row.slug)))??rows.find(row=>!!name&&normalizedName(String(row.short_name??""))===normalizedName(name));
}
const GROUPS:[string,RegExp][]=[
  ["Identity & reputation",/^(prestige|reputation|championship_expectation|fanbase|global_popularity|home_market_popularity|media_interest|heritage|innovation_reputation|employer_attractiveness)_/],
  ["People & culture",/^(staff_morale|driver_morale|board_confidence|team_cohesion|leadership|communication|recruitment|staff_development|driver_development|retention|workplace_quality|political_stability|internal_pressure|blame_culture|innovation_culture|risk_management)/],
  ["Commercial & finance",/^(commercial|sponsor|merchandise|hospitality|digital|media_management|crisis_management|sustainability|financial|cost_efficiency)/],
  ["Facilities & development",/^(facility|research|design_capacity|manufacturing|quality|prototype|upgrade|development|regulation|knowledge|technical_data|correlation|intellectual)/],
  ["Car & power unit",/^(power_unit|front_wing|rear_wing|floor|sidepod|chassis|suspension|brake|cooling|gearbox|ers|electronics|weight|drag|drs|low_speed|medium_speed|high_speed|dirty_air|tyre_preservation|fuel_efficiency|component_reliability)/],
  ["Race operations",/^(race_strategy|qualifying_strategy|tyre_strategy|weather|safety_car|pit_stop|garage|setup|telemetry|race_engineering|incident|repair|logistics|operational|protest)/],
  ["Season & governance",/^(season_progress|board_patience|job_security|recent_form|momentum|cost_cap_compliance|technical_compliance|sporting_compliance|grid_penalty_risk)/],
  ["AI preferences",/^ai_/],
];
export function teamRatingGroups(row:DatabaseRow){
  const groups=new Map<string,{key:string;label:string;text:string}[]>();
  for(const key of Object.keys(row).filter(isTeamRatingField)){
    const title=GROUPS.find(([,pattern])=>pattern.test(key))?.[0]??"Other team attributes";
    groups.set(title,[...groups.get(title)??[],{key,label:databaseFieldLabel(key),text:teamAttributeDisplay(key,row[key])}]);
  }
  return [...groups].map(([title,fields])=>({title,fields}));
}
