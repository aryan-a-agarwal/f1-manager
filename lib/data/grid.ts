import startingGrid from "@/supabase/seed-data/2027-starting-grid.json";
export type Driver = { id: string; name: string; abbreviation: string; number: number; nationality: string };
export type Team = { id: string; name: string; shortName: string; base: string; principal: string; powerUnit: string; primary: string; secondary: string; drivers: readonly [Driver, Driver] };

// 2027: the versioned database scenario has 19 confirmed seats and 3 explicit continuations.
const teamTemplates: readonly Omit<Team,"drivers">[] = [
  { id: "mclaren", name: "McLaren Mastercard F1 Team", shortName: "McLaren", base: "Woking, United Kingdom", principal: "Andrea Stella", powerUnit: "Mercedes", primary: "#ff8000", secondary: "#101820" },
  { id: "mercedes", name: "Mercedes-AMG Petronas F1 Team", shortName: "Mercedes", base: "Brackley, United Kingdom", principal: "Toto Wolff", powerUnit: "Mercedes", primary: "#00a19c", secondary: "#d4d9dc" },
  { id: "red-bull", name: "Oracle Red Bull Racing", shortName: "Red Bull Racing", base: "Milton Keynes, United Kingdom", principal: "Laurent Mekies", powerUnit: "Red Bull Ford", primary: "#3155a6", secondary: "#f9d71c" },
  { id: "ferrari", name: "Scuderia Ferrari HP", shortName: "Ferrari", base: "Maranello, Italy", principal: "Frédéric Vasseur", powerUnit: "Ferrari", primary: "#e8002d", secondary: "#ffd21e" },
  { id: "williams", name: "Atlassian Williams F1 Team", shortName: "Williams", base: "Grove, United Kingdom", principal: "James Vowles", powerUnit: "Mercedes", primary: "#0067b9", secondary: "#00a0de" },
  { id: "racing-bulls", name: "Visa Cash App Racing Bulls F1 Team", shortName: "Racing Bulls", base: "Faenza, Italy", principal: "Alan Permane", powerUnit: "Red Bull Ford", primary: "#4e7cff", secondary: "#f6f7fb" },
  { id: "aston-martin", name: "Aston Martin Aramco F1 Team", shortName: "Aston Martin", base: "Silverstone, United Kingdom", principal: "Adrian Newey", powerUnit: "Honda", primary: "#006f62", secondary: "#cedc00" },
  { id: "haas", name: "TGR Haas F1 Team", shortName: "Haas", base: "Kannapolis, United States", principal: "Ayao Komatsu", powerUnit: "Ferrari", primary: "#d8dce1", secondary: "#e6002d" },
  { id: "audi", name: "Audi Revolut F1 Team", shortName: "Audi", base: "Hinwil, Switzerland", principal: "Jonathan Wheatley", powerUnit: "Audi", primary: "#f50537", secondary: "#b8ff36" },
  { id: "alpine", name: "BWT Alpine F1 Team", shortName: "Alpine", base: "Enstone, United Kingdom", principal: "Flavio Briatore", powerUnit: "Mercedes", primary: "#168bc3", secondary: "#f184bd" },
  { id: "cadillac", name: "Cadillac Formula 1 Team", shortName: "Cadillac", base: "Fishers, United States", principal: "Graeme Lowdon", powerUnit: "Ferrari", primary: "#d5b06f", secondary: "#17191c" }
] as const;

export const teams:readonly Team[]=teamTemplates.map(template=>{
  const seats=startingGrid.contracts.filter(row=>row.team_id===template.id&&row.role==="race_driver").sort((a,b)=>a.slot_number-b.slot_number);
  if(seats.length!==2)throw new Error(`Invalid starting grid for ${template.id}`);
  const drivers=seats.map(row=>({id:row.driver_id,name:row.driver_name,abbreviation:row.abbreviation,number:row.number!,nationality:row.nationality}));
  return {...template,drivers:[drivers[0],drivers[1]]};
});

export const findTeam = (id: string | null) => teams.find((team) => team.id === id);
