import startingGrid from "@/supabase/seed-data/2027-starting-grid.json";
import {normalizedName} from "../profileNavigation";

/** Annual USD game-balance assumptions, not claims about private real-world salaries. */
export const DRIVER_SALARY_MODEL_VERSION="2027-game-salaries-v2";
const annualUsd:Record<string,number>={
  "Max Verstappen":55_000_000,"Lewis Hamilton":50_000_000,"Charles Leclerc":34_000_000,
  "Lando Norris":25_000_000,"Oscar Piastri":18_000_000,"George Russell":20_000_000,
  "Kimi Antonelli":5_000_000,"Fernando Alonso":20_000_000,"Lance Stroll":8_000_000,
  "Pierre Gasly":12_000_000,"Franco Colapinto":2_000_000,"Alexander Albon":10_000_000,
  "Carlos Sainz":13_000_000,"Esteban Ocon":7_000_000,"Oliver Bearman":3_000_000,
  "Isack Hadjar":4_000_000,"Liam Lawson":2_500_000,"Arvid Lindblad":1_500_000,
  "Nico Hülkenberg":7_000_000,"Gabriel Bortoleto":2_000_000,
  "Sergio Pérez":8_000_000,"Valtteri Bottas":8_000_000,"Rafael Câmara":1_250_000,
};
const raceSalaries=new Map(Object.entries(annualUsd).map(([name,amount])=>[normalizedName(name),amount*100]));
const reserveSalaries=new Map(startingGrid.contracts.filter(r=>r.role==="reserve_driver").flatMap(r=>[[normalizedName(r.person_slug),r.annual_salary_usd_cents],[normalizedName(r.driver_name),r.annual_salary_usd_cents]] as [string,number][]));
export function assumedDriverSalary(identity:string,role:string):number|null{
  return (role==="race_driver"?raceSalaries:role==="reserve_driver"?reserveSalaries:new Map<string,number>()).get(normalizedName(identity))??null;
}
