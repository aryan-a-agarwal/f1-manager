const fs = require('fs');
const path = require('path');

/**
 * Carefully calibrated ratings for:
 * - marketability (0-100)
 * - reputation (0-100)
 * - development_rate (0-100, younger drivers / rookies higher, veterans lower)
 * - adaptability (0-100, driving tricky cars / changing conditions)
 * - reactions (0-100, reflex speed, start reaction, snap oversteer save)
 * - braking (0-100, trail-braking mastery, late-braking performance)
 * - cornering (0-100, apex speed, mid-corner balance, high-speed commitment)
 * - smoothness (0-100, tyre preservation, mechanical sympathy, smooth inputs)
 * - incident_proneness (0-100, LOWER is cleaner, HIGHER means more crash/error-prone)
 * - pit_stop_precision (0-100)
 */

const driverRatingsUpdate = [
  {
    id: 7, // Max Verstappen
    name: "Max Verstappen",
    marketability: 96,
    reputation: 98,
    development_rate: 68,
    adaptability: 97,
    reactions: 98,
    braking: 98,
    cornering: 98,
    smoothness: 90,
    incident_proneness: 16,
    pit_stop_precision: 97
  },
  {
    id: 4, // Lewis Hamilton
    name: "Lewis Hamilton",
    marketability: 99,
    reputation: 98,
    development_rate: 45,
    adaptability: 93,
    reactions: 92,
    braking: 94,
    cornering: 92,
    smoothness: 96,
    incident_proneness: 14,
    pit_stop_precision: 96
  },
  {
    id: 19, // Fernando Alonso
    name: "Fernando Alonso",
    marketability: 94,
    reputation: 96,
    development_rate: 40,
    adaptability: 98,
    reactions: 93,
    braking: 93,
    cornering: 91,
    smoothness: 89,
    incident_proneness: 18,
    pit_stop_precision: 95
  },
  {
    id: 3, // Charles Leclerc
    name: "Charles Leclerc",
    marketability: 95,
    reputation: 92,
    development_rate: 76,
    adaptability: 89,
    reactions: 96,
    braking: 95,
    cornering: 94,
    smoothness: 87,
    incident_proneness: 28,
    pit_stop_precision: 93
  },
  {
    id: 5, // Lando Norris
    name: "Lando Norris",
    marketability: 95,
    reputation: 92,
    development_rate: 80,
    adaptability: 90,
    reactions: 93,
    braking: 93,
    cornering: 93,
    smoothness: 89,
    incident_proneness: 22,
    pit_stop_precision: 92
  },
  {
    id: 6, // Oscar Piastri
    name: "Oscar Piastri",
    marketability: 88,
    reputation: 89,
    development_rate: 88,
    adaptability: 89,
    reactions: 92,
    braking: 91,
    cornering: 90,
    smoothness: 92,
    incident_proneness: 18,
    pit_stop_precision: 91
  },
  {
    id: 1, // George Russell
    name: "George Russell",
    marketability: 89,
    reputation: 88,
    development_rate: 78,
    adaptability: 87,
    reactions: 91,
    braking: 89,
    cornering: 88,
    smoothness: 85,
    incident_proneness: 26,
    pit_stop_precision: 90
  },
  {
    id: 17, // Carlos Sainz
    name: "Carlos Sainz",
    marketability: 89,
    reputation: 88,
    development_rate: 68,
    adaptability: 88,
    reactions: 88,
    braking: 87,
    cornering: 86,
    smoothness: 90,
    incident_proneness: 20,
    pit_stop_precision: 91
  },
  {
    id: 2, // Kimi Antonelli
    name: "Kimi Antonelli",
    marketability: 82,
    reputation: 77,
    development_rate: 96,
    adaptability: 83,
    reactions: 88,
    braking: 82,
    cornering: 84,
    smoothness: 80,
    incident_proneness: 32,
    pit_stop_precision: 82
  },
  {
    id: 18, // Alexander Albon
    name: "Alexander Albon",
    marketability: 84,
    reputation: 83,
    development_rate: 74,
    adaptability: 85,
    reactions: 85,
    braking: 84,
    cornering: 83,
    smoothness: 86,
    incident_proneness: 22,
    pit_stop_precision: 88
  },
  {
    id: 11, // Pierre Gasly
    name: "Pierre Gasly",
    marketability: 85,
    reputation: 83,
    development_rate: 69,
    adaptability: 83,
    reactions: 86,
    braking: 84,
    cornering: 84,
    smoothness: 83,
    incident_proneness: 25,
    pit_stop_precision: 88
  },
  {
    id: 13, // Esteban Ocon
    name: "Esteban Ocon",
    marketability: 80,
    reputation: 82,
    development_rate: 67,
    adaptability: 82,
    reactions: 85,
    braking: 84,
    cornering: 83,
    smoothness: 84,
    incident_proneness: 30,
    pit_stop_precision: 88
  },
  {
    id: 15, // Nico Hülkenberg
    name: "Nico Hülkenberg",
    marketability: 79,
    reputation: 83,
    development_rate: 48,
    adaptability: 86,
    reactions: 85,
    braking: 85,
    cornering: 83,
    smoothness: 85,
    incident_proneness: 21,
    pit_stop_precision: 89
  },
  {
    id: 21, // Sergio Pérez
    name: "Sergio Pérez",
    marketability: 92,
    reputation: 82,
    development_rate: 50,
    adaptability: 79,
    reactions: 83,
    braking: 82,
    cornering: 81,
    smoothness: 91,
    incident_proneness: 28,
    pit_stop_precision: 88
  },
  {
    id: 22, // Valtteri Bottas
    name: "Valtteri Bottas",
    marketability: 83,
    reputation: 82,
    development_rate: 50,
    adaptability: 81,
    reactions: 84,
    braking: 83,
    cornering: 82,
    smoothness: 88,
    incident_proneness: 20,
    pit_stop_precision: 89
  },
  {
    id: 9, // Liam Lawson
    name: "Liam Lawson",
    marketability: 78,
    reputation: 79,
    development_rate: 89,
    adaptability: 85,
    reactions: 84,
    braking: 82,
    cornering: 81,
    smoothness: 82,
    incident_proneness: 26,
    pit_stop_precision: 84
  },
  {
    id: 14, // Oliver Bearman
    name: "Oliver Bearman",
    marketability: 82,
    reputation: 78,
    development_rate: 93,
    adaptability: 84,
    reactions: 85,
    braking: 81,
    cornering: 82,
    smoothness: 80,
    incident_proneness: 29,
    pit_stop_precision: 83
  },
  {
    id: 12, // Franco Colapinto
    name: "Franco Colapinto",
    marketability: 86,
    reputation: 78,
    development_rate: 92,
    adaptability: 83,
    reactions: 84,
    braking: 80,
    cornering: 80,
    smoothness: 79,
    incident_proneness: 31,
    pit_stop_precision: 82
  },
  {
    id: 16, // Gabriel Bortoleto
    name: "Gabriel Bortoleto",
    marketability: 78,
    reputation: 76,
    development_rate: 94,
    adaptability: 82,
    reactions: 83,
    braking: 80,
    cornering: 81,
    smoothness: 83,
    incident_proneness: 24,
    pit_stop_precision: 82
  },
  {
    id: 8, // Isack Hadjar
    name: "Isack Hadjar",
    marketability: 76,
    reputation: 75,
    development_rate: 92,
    adaptability: 80,
    reactions: 84,
    braking: 80,
    cornering: 80,
    smoothness: 78,
    incident_proneness: 33,
    pit_stop_precision: 81
  },
  {
    id: 20, // Lance Stroll
    name: "Lance Stroll",
    marketability: 72,
    reputation: 73,
    development_rate: 62,
    adaptability: 78,
    reactions: 80,
    braking: 77,
    cornering: 76,
    smoothness: 79,
    incident_proneness: 38,
    pit_stop_precision: 83
  },
  {
    id: 10, // Arvid Lindblad
    name: "Arvid Lindblad",
    marketability: 70,
    reputation: 70,
    development_rate: 97,
    adaptability: 76,
    reactions: 81,
    braking: 75,
    cornering: 77,
    smoothness: 75,
    incident_proneness: 35,
    pit_stop_precision: 77
  }
];

let sql = `-- ==============================================================================
-- Migration: 20261026030000_fill_driver_attributes_marketability_and_onwards.sql
-- Description: Fills all previously defaulted (50) driver attributes:
--              marketability, reputation, development_rate, adaptability,
--              reactions, braking, cornering, smoothness, incident_proneness,
--              and pit_stop_precision for all 22 active drivers.
-- ==============================================================================

`;

for (const d of driverRatingsUpdate) {
  sql += `update public.drivers set
  marketability = ${d.marketability},
  reputation = ${d.reputation},
  development_rate = ${d.development_rate},
  adaptability = ${d.adaptability},
  reactions = ${d.reactions},
  braking = ${d.braking},
  cornering = ${d.cornering},
  smoothness = ${d.smoothness},
  incident_proneness = ${d.incident_proneness},
  pit_stop_precision = ${d.pit_stop_precision},
  updated_at = now()
where id = ${d.id};\n\n`;
}

// Also update driver_rating_history if records exist
sql += `-- Ensure driver_rating_history reflects latest ratings where appropriate
update public.driver_rating_history h set
  pit_stop_precision = d.pit_stop_precision
from public.drivers d
where h.driver_id = d.id;
`;

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20261026030000_fill_driver_attributes_marketability_and_onwards.sql'), sql);
fs.writeFileSync(path.join(__dirname, '../supabase/seed-data/driver-advanced-ratings.json'), JSON.stringify(driverRatingsUpdate, null, 2));

console.log('Successfully generated driver ratings migration for all', driverRatingsUpdate.length, 'drivers!');
