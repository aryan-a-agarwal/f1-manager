const fs = require('fs');
const path = require('path');

const people = JSON.parse(fs.readFileSync(path.join(__dirname, '../supabase/seed-data/all-driver-people.json'), 'utf8'));
const currentDrivers = JSON.parse(fs.readFileSync(path.join(__dirname, '../supabase/seed-data/current-drivers-dump.json'), 'utf8'));
const activeRatings = JSON.parse(fs.readFileSync(path.join(__dirname, '../supabase/seed-data/driver-advanced-ratings.json'), 'utf8'));

// Map of active driver ratings by ID
const activeMap = new Map();
for (const r of activeRatings) {
  activeMap.set(r.id, r);
}

// Map of existing driver records in public.drivers by ID
const existingDriverMap = new Map();
for (const d of currentDrivers) {
  existingDriverMap.set(d.id, d);
}

// Specific benchmarks for prominent reserves and juniors
const specificProfiles = {
  // Yuki Tsunoda
  27: {
    overall: 80, pace: 82, overtaking: 83, defending: 82, racecraft: 81, wet: 79, qual: 83, consistency: 78,
    aggression: 84, exp_rating: 80, pot_rating: 84, exp_code: 3, battery: 80, team_orders: 78, rel: 82,
    tyre_mgmt: 78, pit_stop: 85, warm_up: 81, temp_ctrl: 80, sponsor: 82, mgmt: 80, morale: 72, fitness: 88,
    form: 75, marketability: 84, reputation: 80, dev_rate: 72, adaptability: 81, reactions: 87,
    braking: 83, cornering: 82, smoothness: 79, incident_proneness: 28
  },
  // Zhou Guanyu
  32: {
    overall: 76, pace: 77, overtaking: 75, defending: 77, racecraft: 76, wet: 76, qual: 76, consistency: 82,
    aggression: 70, exp_rating: 78, pot_rating: 80, exp_code: 3, battery: 78, team_orders: 85, rel: 85,
    tyre_mgmt: 82, pit_stop: 84, warm_up: 76, temp_ctrl: 78, sponsor: 90, mgmt: 80, morale: 70, fitness: 88,
    form: 72, marketability: 88, reputation: 76, dev_rate: 68, adaptability: 78, reactions: 82,
    braking: 77, cornering: 77, smoothness: 84, incident_proneness: 21
  },
  // Stoffel Vandoorne
  122: {
    overall: 78, pace: 78, overtaking: 77, defending: 79, racecraft: 79, wet: 80, qual: 79, consistency: 84,
    aggression: 72, exp_rating: 85, pot_rating: 80, exp_code: 3, battery: 85, team_orders: 88, rel: 88,
    tyre_mgmt: 84, pit_stop: 86, warm_up: 78, temp_ctrl: 82, sponsor: 75, mgmt: 78, morale: 74, fitness: 88,
    form: 75, marketability: 77, reputation: 80, dev_rate: 50, adaptability: 84, reactions: 83,
    braking: 80, cornering: 79, smoothness: 86, incident_proneness: 18
  },
  // Antonio Giovinazzi
  24: {
    overall: 77, pace: 78, overtaking: 76, defending: 78, racecraft: 77, wet: 78, qual: 80, consistency: 80,
    aggression: 74, exp_rating: 84, pot_rating: 79, exp_code: 3, battery: 82, team_orders: 86, rel: 84,
    tyre_mgmt: 80, pit_stop: 85, warm_up: 79, temp_ctrl: 80, sponsor: 74, mgmt: 78, morale: 72, fitness: 88,
    form: 74, marketability: 76, reputation: 78, dev_rate: 52, adaptability: 82, reactions: 84,
    braking: 80, cornering: 78, smoothness: 82, incident_proneness: 22
  },
  // Sébastien Buemi
  115: {
    overall: 78, pace: 77, overtaking: 78, defending: 80, racecraft: 81, wet: 82, qual: 78, consistency: 86,
    aggression: 76, exp_rating: 90, pot_rating: 79, exp_code: 3, battery: 90, team_orders: 90, rel: 88,
    tyre_mgmt: 86, pit_stop: 88, warm_up: 80, temp_ctrl: 84, sponsor: 72, mgmt: 80, morale: 75, fitness: 88,
    form: 75, marketability: 75, reputation: 82, dev_rate: 45, adaptability: 86, reactions: 82,
    braking: 80, cornering: 78, smoothness: 86, incident_proneness: 17
  },
  // Théo Pourchaire
  125: {
    overall: 76, pace: 79, overtaking: 80, defending: 77, racecraft: 78, wet: 78, qual: 80, consistency: 76,
    aggression: 79, exp_rating: 66, pot_rating: 86, exp_code: 2, battery: 77, team_orders: 80, rel: 80,
    tyre_mgmt: 77, pit_stop: 82, warm_up: 78, temp_ctrl: 77, sponsor: 76, mgmt: 80, morale: 72, fitness: 88,
    form: 75, marketability: 79, reputation: 78, dev_rate: 90, adaptability: 82, reactions: 85,
    braking: 80, cornering: 80, smoothness: 79, incident_proneness: 27
  },
  // Jack Doohan
  29: {
    overall: 75, pace: 79, overtaking: 78, defending: 76, racecraft: 77, wet: 77, qual: 80, consistency: 75,
    aggression: 78, exp_rating: 64, pot_rating: 85, exp_code: 2, battery: 76, team_orders: 80, rel: 80,
    tyre_mgmt: 76, pit_stop: 82, warm_up: 78, temp_ctrl: 76, sponsor: 75, mgmt: 80, morale: 72, fitness: 88,
    form: 74, marketability: 78, reputation: 76, dev_rate: 91, adaptability: 81, reactions: 84,
    braking: 79, cornering: 80, smoothness: 78, incident_proneness: 28
  },
  // Pato O'Ward
  26: {
    overall: 78, pace: 82, overtaking: 85, defending: 81, racecraft: 83, wet: 80, qual: 81, consistency: 78,
    aggression: 88, exp_rating: 74, pot_rating: 86, exp_code: 3, battery: 78, team_orders: 76, rel: 80,
    tyre_mgmt: 78, pit_stop: 85, warm_up: 82, temp_ctrl: 80, sponsor: 86, mgmt: 84, morale: 75, fitness: 90,
    form: 78, marketability: 87, reputation: 81, dev_rate: 80, adaptability: 87, reactions: 88,
    braking: 84, cornering: 83, smoothness: 78, incident_proneness: 29
  },
  // Colton Herta
  36: {
    overall: 77, pace: 82, overtaking: 84, defending: 79, racecraft: 81, wet: 79, qual: 82, consistency: 75,
    aggression: 87, exp_rating: 72, pot_rating: 85, exp_code: 3, battery: 76, team_orders: 75, rel: 78,
    tyre_mgmt: 76, pit_stop: 84, warm_up: 81, temp_ctrl: 78, sponsor: 84, mgmt: 82, morale: 75, fitness: 88,
    form: 76, marketability: 85, reputation: 79, dev_rate: 80, adaptability: 85, reactions: 87,
    braking: 83, cornering: 82, smoothness: 76, incident_proneness: 32
  },
  // Leonardo Fornaroli (2024 F3 Champion, McLaren Reserve)
  25: {
    overall: 73, pace: 76, overtaking: 75, defending: 76, racecraft: 77, wet: 76, qual: 77, consistency: 85,
    aggression: 70, exp_rating: 55, pot_rating: 86, exp_code: 1, battery: 74, team_orders: 84, rel: 85,
    tyre_mgmt: 82, pit_stop: 80, warm_up: 75, temp_ctrl: 76, sponsor: 72, mgmt: 78, morale: 75, fitness: 88,
    form: 78, marketability: 74, reputation: 74, dev_rate: 93, adaptability: 80, reactions: 82,
    braking: 77, cornering: 77, smoothness: 85, incident_proneness: 19
  },
  // Rafael Câmara (Ferrari Academy / 2024 FRECA Champion)
  33: {
    overall: 71, pace: 75, overtaking: 74, defending: 73, racecraft: 74, wet: 74, qual: 76, consistency: 78,
    aggression: 76, exp_rating: 48, pot_rating: 87, exp_code: 1, battery: 72, team_orders: 82, rel: 80,
    tyre_mgmt: 76, pit_stop: 78, warm_up: 75, temp_ctrl: 74, sponsor: 75, mgmt: 80, morale: 75, fitness: 88,
    form: 78, marketability: 75, reputation: 72, dev_rate: 95, adaptability: 78, reactions: 83,
    braking: 75, cornering: 76, smoothness: 77, incident_proneness: 29
  },
  // Zane Maloney
  126: {
    overall: 74, pace: 78, overtaking: 77, defending: 75, racecraft: 76, wet: 78, qual: 78, consistency: 76,
    aggression: 78, exp_rating: 58, pot_rating: 84, exp_code: 2, battery: 74, team_orders: 80, rel: 80,
    tyre_mgmt: 76, pit_stop: 80, warm_up: 77, temp_ctrl: 76, sponsor: 74, mgmt: 78, morale: 74, fitness: 88,
    form: 76, marketability: 76, reputation: 75, dev_rate: 90, adaptability: 81, reactions: 84,
    braking: 78, cornering: 78, smoothness: 77, incident_proneness: 27
  },
  // Victor Martins
  119: {
    overall: 75, pace: 79, overtaking: 80, defending: 76, racecraft: 77, wet: 77, qual: 81, consistency: 72,
    aggression: 82, exp_rating: 60, pot_rating: 84, exp_code: 2, battery: 75, team_orders: 78, rel: 78,
    tyre_mgmt: 74, pit_stop: 80, warm_up: 79, temp_ctrl: 76, sponsor: 74, mgmt: 78, morale: 72, fitness: 88,
    form: 74, marketability: 76, reputation: 75, dev_rate: 89, adaptability: 81, reactions: 85,
    braking: 79, cornering: 80, smoothness: 75, incident_proneness: 32
  },
  // Luke Browning
  118: {
    overall: 73, pace: 77, overtaking: 76, defending: 75, racecraft: 76, wet: 76, qual: 77, consistency: 76,
    aggression: 79, exp_rating: 54, pot_rating: 85, exp_code: 1, battery: 73, team_orders: 80, rel: 80,
    tyre_mgmt: 75, pit_stop: 79, warm_up: 76, temp_ctrl: 75, sponsor: 72, mgmt: 78, morale: 74, fitness: 88,
    form: 76, marketability: 74, reputation: 73, dev_rate: 93, adaptability: 80, reactions: 83,
    braking: 77, cornering: 77, smoothness: 76, incident_proneness: 28
  },
  // Paul Aron
  28: {
    overall: 74, pace: 78, overtaking: 77, defending: 75, racecraft: 76, wet: 77, qual: 80, consistency: 78,
    aggression: 77, exp_rating: 56, pot_rating: 85, exp_code: 2, battery: 74, team_orders: 82, rel: 82,
    tyre_mgmt: 76, pit_stop: 80, warm_up: 78, temp_ctrl: 76, sponsor: 73, mgmt: 78, morale: 74, fitness: 88,
    form: 76, marketability: 75, reputation: 74, dev_rate: 92, adaptability: 80, reactions: 84,
    braking: 78, cornering: 78, smoothness: 78, incident_proneness: 27
  },
  // Fred Vesti
  23: {
    overall: 75, pace: 77, overtaking: 77, defending: 78, racecraft: 78, wet: 78, qual: 78, consistency: 82,
    aggression: 74, exp_rating: 65, pot_rating: 83, exp_code: 2, battery: 78, team_orders: 86, rel: 84,
    tyre_mgmt: 80, pit_stop: 82, warm_up: 77, temp_ctrl: 78, sponsor: 74, mgmt: 80, morale: 74, fitness: 88,
    form: 74, marketability: 75, reputation: 76, dev_rate: 85, adaptability: 82, reactions: 83,
    braking: 78, cornering: 78, smoothness: 82, incident_proneness: 22
  },
  // Ayumu Iwasa
  120: {
    overall: 74, pace: 78, overtaking: 80, defending: 76, racecraft: 77, wet: 77, qual: 78, consistency: 76,
    aggression: 81, exp_rating: 62, pot_rating: 83, exp_code: 2, battery: 75, team_orders: 80, rel: 80,
    tyre_mgmt: 76, pit_stop: 81, warm_up: 78, temp_ctrl: 76, sponsor: 78, mgmt: 80, morale: 72, fitness: 88,
    form: 74, marketability: 78, reputation: 75, dev_rate: 86, adaptability: 81, reactions: 85,
    braking: 78, cornering: 78, smoothness: 77, incident_proneness: 29
  },
  // Jak Crawford
  31: {
    overall: 73, pace: 76, overtaking: 76, defending: 75, racecraft: 76, wet: 75, qual: 77, consistency: 78,
    aggression: 75, exp_rating: 58, pot_rating: 84, exp_code: 2, battery: 74, team_orders: 82, rel: 82,
    tyre_mgmt: 77, pit_stop: 80, warm_up: 76, temp_ctrl: 76, sponsor: 78, mgmt: 80, morale: 74, fitness: 88,
    form: 75, marketability: 78, reputation: 74, dev_rate: 91, adaptability: 80, reactions: 83,
    braking: 76, cornering: 77, smoothness: 79, incident_proneness: 26
  },
  // Joshua Dürksen
  34: {
    overall: 72, pace: 76, overtaking: 77, defending: 74, racecraft: 75, wet: 75, qual: 76, consistency: 74,
    aggression: 80, exp_rating: 54, pot_rating: 83, exp_code: 1, battery: 72, team_orders: 80, rel: 78,
    tyre_mgmt: 74, pit_stop: 78, warm_up: 76, temp_ctrl: 74, sponsor: 74, mgmt: 78, morale: 74, fitness: 88,
    form: 74, marketability: 74, reputation: 72, dev_rate: 92, adaptability: 79, reactions: 83,
    braking: 76, cornering: 76, smoothness: 75, incident_proneness: 30
  },
  // Ryo Hirakawa
  30: {
    overall: 76, pace: 77, overtaking: 77, defending: 78, racecraft: 79, wet: 80, qual: 77, consistency: 84,
    aggression: 74, exp_rating: 84, pot_rating: 79, exp_code: 3, battery: 85, team_orders: 88, rel: 88,
    tyre_mgmt: 84, pit_stop: 84, warm_up: 78, temp_ctrl: 82, sponsor: 80, mgmt: 80, morale: 75, fitness: 88,
    form: 75, marketability: 78, reputation: 79, dev_rate: 55, adaptability: 84, reactions: 83,
    braking: 79, cornering: 78, smoothness: 84, incident_proneness: 19
  },
  // Dino Beganovic
  39: {
    overall: 72, pace: 76, overtaking: 75, defending: 74, racecraft: 75, wet: 75, qual: 77, consistency: 77,
    aggression: 75, exp_rating: 52, pot_rating: 85, exp_code: 1, battery: 72, team_orders: 82, rel: 80,
    tyre_mgmt: 76, pit_stop: 78, warm_up: 76, temp_ctrl: 75, sponsor: 74, mgmt: 78, morale: 74, fitness: 88,
    form: 75, marketability: 75, reputation: 73, dev_rate: 93, adaptability: 79, reactions: 83,
    braking: 76, cornering: 77, smoothness: 78, incident_proneness: 27
  },
  // Kush Maini
  47: {
    overall: 72, pace: 76, overtaking: 76, defending: 74, racecraft: 75, wet: 74, qual: 77, consistency: 75,
    aggression: 77, exp_rating: 58, pot_rating: 82, exp_code: 2, battery: 73, team_orders: 82, rel: 80,
    tyre_mgmt: 75, pit_stop: 79, warm_up: 76, temp_ctrl: 75, sponsor: 80, mgmt: 80, morale: 74, fitness: 88,
    form: 74, marketability: 78, reputation: 73, dev_rate: 88, adaptability: 79, reactions: 83,
    braking: 76, cornering: 76, smoothness: 77, incident_proneness: 28
  }
};

const allDriversOut = [];

for (const p of people) {
  const existing = existingDriverMap.get(p.id);
  const activeRating = activeMap.get(p.id);
  const specific = specificProfiles[p.id];

  let record;

  if (existing && activeRating) {
    // Already in drivers table with active ratings: update all attributes from marketability onwards
    record = {
      ...existing,
      marketability: activeRating.marketability,
      reputation: activeRating.reputation,
      development_rate: activeRating.development_rate,
      adaptability: activeRating.adaptability,
      reactions: activeRating.reactions,
      braking: activeRating.braking,
      cornering: activeRating.cornering,
      smoothness: activeRating.smoothness,
      incident_proneness: activeRating.incident_proneness,
      pit_stop_precision: activeRating.pit_stop_precision
    };
  } else if (specific) {
    // Specific reserve or junior profile
    record = {
      id: p.id,
      "driver-name": p.display_name,
      first_name: p.first_name,
      last_name: p.last_name,
      nationality: p.racing_nationality || "Unknown",
      date_of_birth: p.date_of_birth,
      car_number: null,
      f1_debut_season: p.f1_debut_season,
      team_id: null,
      driver_status: "reserve",
      current_overall_rating: specific.overall,
      potential_rating: specific.pot_rating,
      experience_level_code: specific.exp_code,
      experience_rating: specific.exp_rating,
      pace: specific.pace,
      overtaking: specific.overtaking,
      defending: specific.defending,
      racecraft: specific.racecraft,
      wet_weather_ability: specific.wet,
      qualifying: specific.qual,
      consistency: specific.consistency,
      aggression: specific.aggression,
      battery_management: specific.battery,
      team_orders_understanding: specific.team_orders,
      reliability: specific.rel,
      tyre_management: specific.tyre_mgmt,
      pit_stop_precision: specific.pit_stop,
      tyre_warm_up_ability: specific.warm_up,
      temperature_control: specific.temp_ctrl,
      personal_sponsorship_backing: specific.sponsor,
      management_support_strength: specific.mgmt,
      morale: specific.morale,
      fitness: specific.fitness,
      form: specific.form,
      marketability: specific.marketability,
      reputation: specific.reputation,
      development_rate: specific.dev_rate,
      adaptability: specific.adaptability,
      reactions: specific.reactions,
      braking: specific.braking,
      cornering: specific.cornering,
      smoothness: specific.smoothness,
      incident_proneness: specific.incident_proneness,
      injury_status: "healthy",
      portrait_url: null
    };
  } else {
    // Formula 2 / Formula 3 / Young Academy Driver general formula
    // Default tier: promising young talent
    const isHigherTier = p.id <= 60; // earlier IDs correspond to F2/F3 front-runners
    const overall = isHigherTier ? 69 : 66;
    const devRate = isHigherTier ? 94 : 96;
    const pot = isHigherTier ? 83 : 81;
    const exp = isHigherTier ? 45 : 38;

    record = {
      id: p.id,
      "driver-name": p.display_name,
      first_name: p.first_name,
      last_name: p.last_name,
      nationality: p.racing_nationality || "Unknown",
      date_of_birth: p.date_of_birth,
      car_number: null,
      f1_debut_season: p.f1_debut_season,
      team_id: null,
      driver_status: "junior",
      current_overall_rating: overall,
      potential_rating: pot,
      experience_level_code: 1,
      experience_rating: exp,
      pace: overall + 2,
      overtaking: overall + 1,
      defending: overall,
      racecraft: overall,
      wet_weather_ability: overall - 1,
      qualifying: overall + 3,
      consistency: overall - 2,
      aggression: 76,
      battery_management: 70,
      team_orders_understanding: 80,
      reliability: 78,
      tyre_management: 73,
      pit_stop_precision: 75,
      tyre_warm_up_ability: 74,
      temperature_control: 73,
      personal_sponsorship_backing: 70,
      management_support_strength: 75,
      morale: 75,
      fitness: 88,
      form: 72,
      marketability: isHigherTier ? 72 : 68,
      reputation: isHigherTier ? 70 : 66,
      development_rate: devRate,
      adaptability: 76,
      reactions: 81,
      braking: overall + 1,
      cornering: overall + 1,
      smoothness: overall,
      incident_proneness: 34,
      injury_status: "healthy",
      portrait_url: null
    };
  }

  allDriversOut.push(record);
}

// Generate the complete SQL upsert migration
let sql = `-- ==============================================================================
-- Migration: 20261026030000_fill_driver_attributes_marketability_and_onwards.sql
-- Description: Fills complete attributes (from marketability onwards, plus full stats)
--              for ALL 91 driver candidates in the database.
-- ==============================================================================

`;

for (const d of allDriversOut) {
  const dob = d.date_of_birth ? `'${d.date_of_birth}'` : 'null';
  const carNum = d.car_number != null ? d.car_number : 'null';
  const f1Debut = d.f1_debut_season != null ? d.f1_debut_season : 'null';
  const teamId = d.team_id != null ? d.team_id : 'null';
  const firstName = d.first_name.replace(/'/g, "''");
  const lastName = d.last_name.replace(/'/g, "''");
  const nat = d.nationality.replace(/'/g, "''");
  const driverName = (d["driver-name"] || `${d.first_name} ${d.last_name}`).replace(/'/g, "''");

  sql += `insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  ${d.id}, '${firstName}', '${lastName}', '${driverName}', '${nat}', ${dob}, ${carNum}, ${f1Debut}, ${teamId}, '${d.driver_status}',
  ${d.current_overall_rating}, ${d.potential_rating}, ${d.experience_level_code}, ${d.experience_rating}, ${d.pace}, ${d.overtaking}, ${d.defending},
  ${d.racecraft}, ${d.wet_weather_ability}, ${d.qualifying}, ${d.consistency}, ${d.aggression}, ${d.battery_management}, ${d.team_orders_understanding},
  ${d.reliability}, ${d.tyre_management}, ${d.pit_stop_precision}, ${d.tyre_warm_up_ability}, ${d.temperature_control}, ${d.personal_sponsorship_backing},
  ${d.management_support_strength}, ${d.morale}, ${d.fitness}, ${d.form}, ${d.marketability}, ${d.reputation}, ${d.development_rate}, ${d.adaptability},
  ${d.reactions}, ${d.braking}, ${d.cornering}, ${d.smoothness}, ${d.incident_proneness}, '${d.injury_status}', null, now()
)
on conflict (id) do update set
  marketability = excluded.marketability,
  reputation = excluded.reputation,
  development_rate = excluded.development_rate,
  adaptability = excluded.adaptability,
  reactions = excluded.reactions,
  braking = excluded.braking,
  cornering = excluded.cornering,
  smoothness = excluded.smoothness,
  incident_proneness = excluded.incident_proneness,
  pit_stop_precision = excluded.pit_stop_precision,
  updated_at = now();\n\n`;
}

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20261026030000_fill_driver_attributes_marketability_and_onwards.sql'), sql);
fs.writeFileSync(path.join(__dirname, '../supabase/seed-data/all-91-drivers-attributes.json'), JSON.stringify(allDriversOut, null, 2));

console.log('Successfully generated full ratings migration for ALL', allDriversOut.length, 'drivers in the database!');
