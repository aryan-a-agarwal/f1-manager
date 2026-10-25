import {
  CareerState,
  DriverContractDetails,
  DriverMarketProfile,
  DriverMental,
  DriverSkills,
  DriverTrait,
  MarketState,
  StaffProfile,
  StaffRoleType,
} from "./types";
import { persistCareer, CareerStorage } from "./storage";
import { recordFinancialTransaction } from "./finance";
import { appointDriver } from "./workforce";

export function calculateDriverOverall(skills: DriverSkills): number {
  const score =
    skills.pace * 0.25 +
    skills.qualifying * 0.2 +
    skills.racecraft * 0.2 +
    skills.consistency * 0.15 +
    skills.tyreManagement * 0.1 +
    skills.wetWeather * 0.05 +
    skills.feedback * 0.05;
  return Math.round(score);
}

export const INITIAL_DRIVERS: DriverMarketProfile[] = [
  {
    id: "verstappen",
    name: "Max Verstappen",
    number: 3,
    nationality: "Netherlands",
    abbreviation: "VER",
    currentTeamId: "red-bull",
    age: 29,
    experienceYears: 12,
    overallRating: 97,
    marketValue: 48_000_000,
    marketability: 96,
    skills: { pace: 98, qualifying: 97, racecraft: 98, consistency: 96, tyreManagement: 95, wetWeather: 98, feedback: 92, adaptability: 96 },
    mental: { morale: 92, confidence: 99, pressureHandling: 98, aggression: 90, loyalty: 88 },
    traits: ["Rain Master", "Tyre Whisperer"],
    contract: { salaryPerYear: 45_000_000, contractYearsRemaining: 3, buyoutClause: 60_000_000, status: "first_driver", bonuses: { pointsBonus: 50_000, podiumBonus: 200_000, winBonus: 800_000, titleBonus: 5_000_000 } },
  },
  {
    id: "norris",
    name: "Lando Norris",
    number: 1,
    nationality: "Great Britain",
    abbreviation: "NOR",
    currentTeamId: "mclaren",
    age: 27,
    experienceYears: 8,
    overallRating: 94,
    marketValue: 32_000_000,
    marketability: 93,
    skills: { pace: 95, qualifying: 96, racecraft: 93, consistency: 92, tyreManagement: 92, wetWeather: 92, feedback: 93, adaptability: 91 },
    mental: { morale: 90, confidence: 93, pressureHandling: 88, aggression: 84, loyalty: 92 },
    traits: ["Technical Driver"],
    contract: { salaryPerYear: 28_000_000, contractYearsRemaining: 2, buyoutClause: 40_000_000, status: "first_driver", bonuses: { pointsBonus: 40_000, podiumBonus: 150_000, winBonus: 600_000, titleBonus: 4_000_000 } },
  },
  {
    id: "leclerc",
    name: "Charles Leclerc",
    number: 16,
    nationality: "Monaco",
    abbreviation: "LEC",
    currentTeamId: "ferrari",
    age: 29,
    experienceYears: 9,
    overallRating: 94,
    marketValue: 34_000_000,
    marketability: 95,
    skills: { pace: 97, qualifying: 98, racecraft: 93, consistency: 90, tyreManagement: 90, wetWeather: 90, feedback: 92, adaptability: 92 },
    mental: { morale: 88, confidence: 92, pressureHandling: 87, aggression: 86, loyalty: 94 },
    traits: ["Technical Driver"],
    contract: { salaryPerYear: 32_000_000, contractYearsRemaining: 3, buyoutClause: 45_000_000, status: "first_driver", bonuses: { pointsBonus: 40_000, podiumBonus: 150_000, winBonus: 600_000, titleBonus: 4_000_000 } },
  },
  {
    id: "hamilton",
    name: "Lewis Hamilton",
    number: 44,
    nationality: "Great Britain",
    abbreviation: "HAM",
    currentTeamId: "ferrari",
    age: 42,
    experienceYears: 20,
    overallRating: 93,
    marketValue: 35_000_000,
    marketability: 99,
    skills: { pace: 93, qualifying: 92, racecraft: 95, consistency: 94, tyreManagement: 95, wetWeather: 96, feedback: 94, adaptability: 93 },
    mental: { morale: 92, confidence: 95, pressureHandling: 97, aggression: 82, loyalty: 85 },
    traits: ["Veteran", "Rain Master"],
    contract: { salaryPerYear: 35_000_000, contractYearsRemaining: 1, buyoutClause: 30_000_000, status: "equal", bonuses: { pointsBonus: 40_000, podiumBonus: 150_000, winBonus: 600_000, titleBonus: 4_000_000 } },
  },
  {
    id: "russell",
    name: "George Russell",
    number: 63,
    nationality: "Great Britain",
    abbreviation: "RUS",
    currentTeamId: "mercedes",
    age: 28,
    experienceYears: 8,
    overallRating: 92,
    marketValue: 26_000_000,
    marketability: 89,
    skills: { pace: 93, qualifying: 94, racecraft: 91, consistency: 91, tyreManagement: 89, wetWeather: 91, feedback: 93, adaptability: 90 },
    mental: { morale: 87, confidence: 92, pressureHandling: 89, aggression: 86, loyalty: 90 },
    traits: ["Technical Driver"],
    contract: { salaryPerYear: 22_000_000, contractYearsRemaining: 2, buyoutClause: 32_000_000, status: "first_driver", bonuses: { pointsBonus: 30_000, podiumBonus: 120_000, winBonus: 500_000, titleBonus: 3_000_000 } },
  },
  {
    id: "piastri",
    name: "Oscar Piastri",
    number: 81,
    nationality: "Australia",
    abbreviation: "PIA",
    currentTeamId: "mclaren",
    age: 25,
    experienceYears: 4,
    overallRating: 91,
    marketValue: 24_000_000,
    marketability: 88,
    skills: { pace: 92, qualifying: 91, racecraft: 92, consistency: 93, tyreManagement: 90, wetWeather: 89, feedback: 91, adaptability: 92 },
    mental: { morale: 92, confidence: 93, pressureHandling: 94, aggression: 81, loyalty: 91 },
    traits: ["Young Prospect", "Tyre Whisperer"],
    contract: { salaryPerYear: 18_000_000, contractYearsRemaining: 2, buyoutClause: 28_000_000, status: "equal", bonuses: { pointsBonus: 30_000, podiumBonus: 100_000, winBonus: 400_000, titleBonus: 2_500_000 } },
  },
  {
    id: "alonso",
    name: "Fernando Alonso",
    number: 14,
    nationality: "Spain",
    abbreviation: "ALO",
    currentTeamId: "aston-martin",
    age: 45,
    experienceYears: 23,
    overallRating: 91,
    marketValue: 22_000_000,
    marketability: 94,
    skills: { pace: 91, qualifying: 91, racecraft: 95, consistency: 92, tyreManagement: 93, wetWeather: 94, feedback: 95, adaptability: 94 },
    mental: { morale: 86, confidence: 96, pressureHandling: 96, aggression: 88, loyalty: 82 },
    traits: ["Veteran", "Rain Master"],
    contract: { salaryPerYear: 20_000_000, contractYearsRemaining: 1, buyoutClause: 20_000_000, status: "first_driver", bonuses: { pointsBonus: 30_000, podiumBonus: 100_000, winBonus: 400_000, titleBonus: 2_500_000 } },
  },
  {
    id: "sainz",
    name: "Carlos Sainz",
    number: 55,
    nationality: "Spain",
    abbreviation: "SAI",
    currentTeamId: "williams",
    age: 32,
    experienceYears: 12,
    overallRating: 90,
    marketValue: 20_000_000,
    marketability: 90,
    skills: { pace: 90, qualifying: 90, racecraft: 91, consistency: 92, tyreManagement: 90, wetWeather: 89, feedback: 94, adaptability: 91 },
    mental: { morale: 88, confidence: 91, pressureHandling: 91, aggression: 82, loyalty: 86 },
    traits: ["Technical Driver"],
    contract: { salaryPerYear: 16_000_000, contractYearsRemaining: 2, buyoutClause: 24_000_000, status: "first_driver", bonuses: { pointsBonus: 25_000, podiumBonus: 90_000, winBonus: 350_000, titleBonus: 2_000_000 } },
  },
  {
    id: "albon",
    name: "Alexander Albon",
    number: 23,
    nationality: "Thailand",
    abbreviation: "ALB",
    currentTeamId: "williams",
    age: 30,
    experienceYears: 7,
    overallRating: 86,
    marketValue: 12_000_000,
    marketability: 82,
    skills: { pace: 86, qualifying: 87, racecraft: 86, consistency: 87, tyreManagement: 87, wetWeather: 84, feedback: 88, adaptability: 85 },
    mental: { morale: 89, confidence: 88, pressureHandling: 86, aggression: 80, loyalty: 90 },
    traits: ["Technical Driver"],
    contract: { salaryPerYear: 9_000_000, contractYearsRemaining: 2, buyoutClause: 14_000_000, status: "equal", bonuses: { pointsBonus: 20_000, podiumBonus: 70_000, winBonus: 250_000, titleBonus: 1_500_000 } },
  },
  {
    id: "gasly",
    name: "Pierre Gasly",
    number: 10,
    nationality: "France",
    abbreviation: "GAS",
    currentTeamId: "alpine",
    age: 31,
    experienceYears: 9,
    overallRating: 85,
    marketValue: 11_000_000,
    marketability: 83,
    skills: { pace: 86, qualifying: 86, racecraft: 85, consistency: 84, tyreManagement: 84, wetWeather: 85, feedback: 86, adaptability: 84 },
    mental: { morale: 84, confidence: 86, pressureHandling: 85, aggression: 87, loyalty: 84 },
    traits: ["Hot Head"],
    contract: { salaryPerYear: 8_000_000, contractYearsRemaining: 1, buyoutClause: 12_000_000, status: "first_driver", bonuses: { pointsBonus: 20_000, podiumBonus: 60_000, winBonus: 250_000, titleBonus: 1_000_000 } },
  },
  {
    id: "ocon",
    name: "Esteban Ocon",
    number: 31,
    nationality: "France",
    abbreviation: "OCO",
    currentTeamId: "haas",
    age: 30,
    experienceYears: 9,
    overallRating: 84,
    marketValue: 9_500_000,
    marketability: 80,
    skills: { pace: 85, qualifying: 85, racecraft: 85, consistency: 84, tyreManagement: 83, wetWeather: 86, feedback: 84, adaptability: 83 },
    mental: { morale: 85, confidence: 87, pressureHandling: 84, aggression: 90, loyalty: 82 },
    traits: ["Hot Head"],
    contract: { salaryPerYear: 7_000_000, contractYearsRemaining: 2, buyoutClause: 10_000_000, status: "first_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "antonelli",
    name: "Kimi Antonelli",
    number: 12,
    nationality: "Italy",
    abbreviation: "ANT",
    currentTeamId: "mercedes",
    age: 20,
    experienceYears: 1,
    overallRating: 82,
    marketValue: 14_000_000,
    marketability: 88,
    skills: { pace: 85, qualifying: 84, racecraft: 80, consistency: 78, tyreManagement: 79, wetWeather: 83, feedback: 79, adaptability: 84 },
    mental: { morale: 92, confidence: 85, pressureHandling: 80, aggression: 84, loyalty: 90 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 4_000_000, contractYearsRemaining: 3, buyoutClause: 18_000_000, status: "second_driver", bonuses: { pointsBonus: 20_000, podiumBonus: 80_000, winBonus: 300_000, titleBonus: 1_500_000 } },
  },
  {
    id: "bearman",
    name: "Oliver Bearman",
    number: 87,
    nationality: "Great Britain",
    abbreviation: "BEA",
    currentTeamId: "haas",
    age: 21,
    experienceYears: 1,
    overallRating: 81,
    marketValue: 8_500_000,
    marketability: 82,
    skills: { pace: 83, qualifying: 83, racecraft: 81, consistency: 79, tyreManagement: 78, wetWeather: 81, feedback: 80, adaptability: 82 },
    mental: { morale: 90, confidence: 86, pressureHandling: 82, aggression: 83, loyalty: 88 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 3_000_000, contractYearsRemaining: 2, buyoutClause: 8_000_000, status: "second_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "lawson",
    name: "Liam Lawson",
    number: 30,
    nationality: "New Zealand",
    abbreviation: "LAW",
    currentTeamId: "racing-bulls",
    age: 25,
    experienceYears: 2,
    overallRating: 82,
    marketValue: 7_500_000,
    marketability: 81,
    skills: { pace: 83, qualifying: 83, racecraft: 83, consistency: 81, tyreManagement: 81, wetWeather: 82, feedback: 81, adaptability: 82 },
    mental: { morale: 88, confidence: 87, pressureHandling: 85, aggression: 86, loyalty: 85 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 3_500_000, contractYearsRemaining: 1, buyoutClause: 7_000_000, status: "equal", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "hadjar",
    name: "Isack Hadjar",
    number: 6,
    nationality: "France",
    abbreviation: "HAD",
    currentTeamId: "red-bull",
    age: 22,
    experienceYears: 1,
    overallRating: 80,
    marketValue: 6_500_000,
    marketability: 79,
    skills: { pace: 82, qualifying: 82, racecraft: 79, consistency: 78, tyreManagement: 78, wetWeather: 80, feedback: 78, adaptability: 81 },
    mental: { morale: 89, confidence: 84, pressureHandling: 80, aggression: 85, loyalty: 86 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 2_500_000, contractYearsRemaining: 2, buyoutClause: 8_000_000, status: "second_driver", bonuses: { pointsBonus: 20_000, podiumBonus: 70_000, winBonus: 300_000, titleBonus: 1_500_000 } },
  },
  {
    id: "lindblad",
    name: "Arvid Lindblad",
    number: 41,
    nationality: "Great Britain",
    abbreviation: "LIN",
    currentTeamId: "racing-bulls",
    age: 19,
    experienceYears: 1,
    overallRating: 79,
    marketValue: 6_000_000,
    marketability: 78,
    skills: { pace: 81, qualifying: 81, racecraft: 78, consistency: 76, tyreManagement: 77, wetWeather: 79, feedback: 76, adaptability: 80 },
    mental: { morale: 92, confidence: 83, pressureHandling: 79, aggression: 82, loyalty: 89 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 2_000_000, contractYearsRemaining: 2, buyoutClause: 6_000_000, status: "second_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "hulkenberg",
    name: "Nico Hülkenberg",
    number: 27,
    nationality: "Germany",
    abbreviation: "HUL",
    currentTeamId: "audi",
    age: 39,
    experienceYears: 15,
    overallRating: 83,
    marketValue: 8_000_000,
    marketability: 81,
    skills: { pace: 84, qualifying: 86, racecraft: 82, consistency: 85, tyreManagement: 82, wetWeather: 85, feedback: 87, adaptability: 83 },
    mental: { morale: 86, confidence: 88, pressureHandling: 88, aggression: 78, loyalty: 88 },
    traits: ["Veteran"],
    contract: { salaryPerYear: 6_000_000, contractYearsRemaining: 2, buyoutClause: 8_000_000, status: "first_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "bortoleto",
    name: "Gabriel Bortoleto",
    number: 5,
    nationality: "Brazil",
    abbreviation: "BOR",
    currentTeamId: "audi",
    age: 22,
    experienceYears: 1,
    overallRating: 80,
    marketValue: 7_000_000,
    marketability: 82,
    skills: { pace: 82, qualifying: 82, racecraft: 80, consistency: 78, tyreManagement: 78, wetWeather: 80, feedback: 78, adaptability: 81 },
    mental: { morale: 91, confidence: 84, pressureHandling: 81, aggression: 81, loyalty: 89 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 2_500_000, contractYearsRemaining: 2, buyoutClause: 6_500_000, status: "second_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "stroll",
    name: "Lance Stroll",
    number: 18,
    nationality: "Canada",
    abbreviation: "STR",
    currentTeamId: "aston-martin",
    age: 28,
    experienceYears: 10,
    overallRating: 80,
    marketValue: 7_000_000,
    marketability: 77,
    skills: { pace: 81, qualifying: 80, racecraft: 81, consistency: 78, tyreManagement: 80, wetWeather: 86, feedback: 79, adaptability: 80 },
    mental: { morale: 84, confidence: 85, pressureHandling: 80, aggression: 84, loyalty: 99 },
    traits: ["Pay Driver", "Rain Master"],
    contract: { salaryPerYear: 5_000_000, contractYearsRemaining: 3, buyoutClause: 12_000_000, status: "equal", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "colapinto",
    name: "Franco Colapinto",
    number: 43,
    nationality: "Argentina",
    abbreviation: "COL",
    currentTeamId: "alpine",
    age: 23,
    experienceYears: 2,
    overallRating: 81,
    marketValue: 8_000_000,
    marketability: 85,
    skills: { pace: 83, qualifying: 83, racecraft: 81, consistency: 79, tyreManagement: 79, wetWeather: 80, feedback: 79, adaptability: 82 },
    mental: { morale: 90, confidence: 85, pressureHandling: 83, aggression: 85, loyalty: 86 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 3_000_000, contractYearsRemaining: 1, buyoutClause: 7_000_000, status: "second_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "perez",
    name: "Sergio Pérez",
    number: 11,
    nationality: "Mexico",
    abbreviation: "PER",
    currentTeamId: "cadillac",
    age: 37,
    experienceYears: 16,
    overallRating: 82,
    marketValue: 8_000_000,
    marketability: 91,
    skills: { pace: 82, qualifying: 81, racecraft: 84, consistency: 82, tyreManagement: 89, wetWeather: 81, feedback: 85, adaptability: 81 },
    mental: { morale: 87, confidence: 86, pressureHandling: 86, aggression: 80, loyalty: 88 },
    traits: ["Veteran", "Tyre Whisperer"],
    contract: { salaryPerYear: 7_000_000, contractYearsRemaining: 1, buyoutClause: 9_000_000, status: "first_driver", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "bottas",
    name: "Valtteri Bottas",
    number: 77,
    nationality: "Finland",
    abbreviation: "BOT",
    currentTeamId: "cadillac",
    age: 37,
    experienceYears: 14,
    overallRating: 83,
    marketValue: 9_000_000,
    marketability: 85,
    skills: { pace: 84, qualifying: 86, racecraft: 81, consistency: 85, tyreManagement: 83, wetWeather: 82, feedback: 88, adaptability: 83 },
    mental: { morale: 88, confidence: 88, pressureHandling: 85, aggression: 78, loyalty: 88 },
    traits: ["Veteran"],
    contract: { salaryPerYear: 8_000_000, contractYearsRemaining: 1, buyoutClause: 9_000_000, status: "equal", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  // Free Agents & Young Prospects
  {
    id: "tsunoda",
    name: "Yuki Tsunoda",
    number: 22,
    nationality: "Japan",
    abbreviation: "TSU",
    currentTeamId: null,
    age: 26,
    experienceYears: 6,
    overallRating: 84,
    marketValue: 8_500_000,
    marketability: 84,
    skills: { pace: 86, qualifying: 86, racecraft: 84, consistency: 82, tyreManagement: 82, wetWeather: 83, feedback: 83, adaptability: 83 },
    mental: { morale: 82, confidence: 86, pressureHandling: 81, aggression: 88, loyalty: 78 },
    traits: ["Hot Head"],
    contract: { salaryPerYear: 5_500_000, contractYearsRemaining: 0, buyoutClause: 0, status: "equal", bonuses: { pointsBonus: 15_000, podiumBonus: 50_000, winBonus: 200_000, titleBonus: 1_000_000 } },
  },
  {
    id: "doohan",
    name: "Jack Doohan",
    number: 7,
    nationality: "Australia",
    abbreviation: "DOO",
    currentTeamId: null,
    age: 24,
    experienceYears: 1,
    overallRating: 80,
    marketValue: 4_500_000,
    marketability: 77,
    skills: { pace: 82, qualifying: 82, racecraft: 79, consistency: 78, tyreManagement: 78, wetWeather: 79, feedback: 80, adaptability: 80 },
    mental: { morale: 85, confidence: 82, pressureHandling: 80, aggression: 82, loyalty: 80 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 2_000_000, contractYearsRemaining: 0, buyoutClause: 0, status: "reserve", bonuses: { pointsBonus: 10_000, podiumBonus: 30_000, winBonus: 100_000, titleBonus: 500_000 } },
  },
  {
    id: "pourchaire",
    name: "Théo Pourchaire",
    number: 99,
    nationality: "France",
    abbreviation: "POU",
    currentTeamId: null,
    age: 23,
    experienceYears: 1,
    overallRating: 81,
    marketValue: 5_000_000,
    marketability: 79,
    skills: { pace: 83, qualifying: 83, racecraft: 80, consistency: 80, tyreManagement: 80, wetWeather: 81, feedback: 81, adaptability: 82 },
    mental: { morale: 86, confidence: 84, pressureHandling: 81, aggression: 81, loyalty: 80 },
    traits: ["Young Prospect"],
    contract: { salaryPerYear: 2_200_000, contractYearsRemaining: 0, buyoutClause: 0, status: "reserve", bonuses: { pointsBonus: 10_000, podiumBonus: 30_000, winBonus: 100_000, titleBonus: 500_000 } },
  },
];

export const INITIAL_STAFF: StaffProfile[] = [
  {
    id: "staff-newey",
    name: "Adrian Newey",
    role: "technical_director",
    currentTeamId: "aston-martin",
    overallRating: 98,
    salaryPerYear: 14_000_000,
    contractYearsRemaining: 3,
    buyoutClause: 22_000_000,
    specialty: "Ground-Effect Aerodynamics & Packaging Mastery",
    ratings: { technicalSkill: 99, leadership: 96, innovation: 99 },
  },
  {
    id: "staff-wache",
    name: "Pierre Waché",
    role: "technical_director",
    currentTeamId: "red-bull",
    overallRating: 94,
    salaryPerYear: 8_500_000,
    contractYearsRemaining: 2,
    buyoutClause: 12_000_000,
    specialty: "High-Downforce Aero Balance & Suspension Integration",
    ratings: { technicalSkill: 95, leadership: 93, innovation: 94 },
  },
  {
    id: "staff-cardile",
    name: "Enrico Cardile",
    role: "technical_director",
    currentTeamId: "aston-martin",
    overallRating: 91,
    salaryPerYear: 6_500_000,
    contractYearsRemaining: 2,
    buyoutClause: 9_000_000,
    specialty: "Chassis Dynamics & Carbon Composites",
    ratings: { technicalSkill: 92, leadership: 90, innovation: 91 },
  },
  {
    id: "staff-allison",
    name: "James Allison",
    role: "technical_director",
    currentTeamId: "mercedes",
    overallRating: 93,
    salaryPerYear: 7_500_000,
    contractYearsRemaining: 2,
    buyoutClause: 11_000_000,
    specialty: "Structural Rigidity & Aerodynamic Flow Structures",
    ratings: { technicalSkill: 94, leadership: 94, innovation: 92 },
  },
  {
    id: "staff-prodromou",
    name: "Peter Prodromou",
    role: "head_of_aero",
    currentTeamId: "mclaren",
    overallRating: 92,
    salaryPerYear: 5_500_000,
    contractYearsRemaining: 2,
    buyoutClause: 8_000_000,
    specialty: "Vortex Control & Low-Drag Flow Field",
    ratings: { technicalSkill: 94, leadership: 89, innovation: 93 },
  },
  {
    id: "staff-fallows",
    name: "Dan Fallows",
    role: "head_of_aero",
    currentTeamId: null,
    overallRating: 88,
    salaryPerYear: 3_800_000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    specialty: "Scale Tunnel Correlation & Wing Aerodynamics",
    ratings: { technicalSkill: 89, leadership: 87, innovation: 88 },
  },
  {
    id: "staff-lambiase",
    name: "Gianpiero Lambiase",
    role: "race_engineer",
    currentTeamId: "red-bull",
    overallRating: 95,
    salaryPerYear: 2_600_000,
    contractYearsRemaining: 2,
    buyoutClause: 4_500_000,
    specialty: "Race Management, Composure & Tactical Radio Strategy",
    ratings: { technicalSkill: 94, leadership: 96, innovation: 93 },
  },
  {
    id: "staff-bonnington",
    name: "Peter Bonnington",
    role: "race_engineer",
    currentTeamId: "mercedes",
    overallRating: 94,
    salaryPerYear: 2_500_000,
    contractYearsRemaining: 2,
    buyoutClause: 4_000_000,
    specialty: "Tyre Thermal Modeling & Calm Radio Execution",
    ratings: { technicalSkill: 93, leadership: 95, innovation: 92 },
  },
];

export function createInitialMarket(seasonYear: number = 2027): MarketState {
  return {
    drivers: [...INITIAL_DRIVERS],
    staff: [...INITIAL_STAFF],
    scoutedProspects: INITIAL_DRIVERS.filter((d) => d.currentTeamId === null),
  };
}

export type DriverNegotiationOffer = {
  salaryPerYear: number;
  contractYears: number;
  status: "first_driver" | "equal" | "second_driver" | "reserve";
  pointsBonus: number;
  podiumBonus: number;
  winBonus: number;
  titleBonus: number;
};

export type NegotiationResult = {
  accepted: boolean;
  career: CareerState;
  reason: string;
  buyoutPaid: number;
  counterOffer?: DriverNegotiationOffer;
};

export function negotiateDriverContract(
  career: CareerState,
  driverId: string,
  targetSeat: 1 | 2 | "reserve",
  offer: DriverNegotiationOffer,
  storage?: CareerStorage,
): NegotiationResult {
  const synced = syncMarketState(career);
  const driver = synced.market.drivers.find((d) => d.id === driverId);
  if (!driver) {
    return { accepted: false, career, reason: "Driver not found in paddock market.", buyoutPaid: 0 };
  }

  // Minimum reservation wage calculation based on OVR & market value
  const baseDemandedSalary = Math.round(driver.marketValue * 0.85);

  // Status check: Elite drivers (92+ OVR) won't accept reserve or second_driver
  if (driver.overallRating >= 91 && (offer.status === "second_driver" || offer.status === "reserve")) {
    return {
      accepted: false,
      career,
      reason: `${driver.name} is a proven championship contender and refuses a ${offer.status.replace("_", " ")} contract status.`,
      buyoutPaid: 0,
    };
  }

  // Salary evaluation
  if (offer.salaryPerYear < baseDemandedSalary) {
    const counterSalary = Math.round(baseDemandedSalary * 1.05);
    return {
      accepted: false,
      career,
      reason: `The offered salary of £${(offer.salaryPerYear / 1_000_000).toFixed(1)}M/yr is below ${driver.name}'s valuation. They require at least £${(counterSalary / 1_000_000).toFixed(1)}M/yr.`,
      buyoutPaid: 0,
      counterOffer: {
        ...offer,
        salaryPerYear: counterSalary,
      },
    };
  }

  // Buyout check: if under contract with another team, player must pay buyout clause!
  let buyoutToPay = 0;
  if (driver.currentTeamId && driver.currentTeamId !== career.player.teamId) {
    buyoutToPay = driver.contract.buyoutClause;
    const currentCash = career.finance?.cashBalance ?? 0;
    if (currentCash < buyoutToPay) {
      return {
        accepted: false,
        career,
        reason: `Insufficient cash balance to trigger ${driver.name}'s contract buyout clause of £${(buyoutToPay / 1_000_000).toFixed(1)}M with ${driver.currentTeamId}.`,
        buyoutPaid: 0,
      };
    }
  }

  // Execute Agreement & Financial Transaction
  let updatedCareer = career;
  if (buyoutToPay > 0) {
    // Driver buyouts are Cap-Exempt under FIA financial regulations
    updatedCareer = recordFinancialTransaction(
      updatedCareer,
      -buyoutToPay,
      "driver_salaries",
      `Driver Buyout Clause: Triggered for ${driver.name} from ${driver.currentTeamId}`,
      true, // Cap-exempt
      storage,
    );
  }

  // Update workforce lineup if seat 1 or 2
  if (targetSeat === 1 || targetSeat === 2) {
    try {
      updatedCareer = appointDriver(
        updatedCareer,
        career.player.teamId,
        targetSeat,
        { id: driver.id, name: driver.name, kind: "driver", carNumber: driver.number },
        career.season.year,
        storage,
      );
    } catch {
      // appointDriver may check effective season, update cleanly
    }
  }

  // Update driver in market state
  const updatedDriverContract: DriverContractDetails = {
    salaryPerYear: offer.salaryPerYear,
    contractYearsRemaining: offer.contractYears,
    buyoutClause: Math.round(offer.salaryPerYear * 1.5),
    status: offer.status,
    bonuses: {
      pointsBonus: offer.pointsBonus,
      podiumBonus: offer.podiumBonus,
      winBonus: offer.winBonus,
      titleBonus: offer.titleBonus,
    },
  };

  const updatedDrivers = synced.market.drivers.map((d) =>
    d.id === driverId
      ? {
          ...d,
          currentTeamId: career.player.teamId,
          contract: updatedDriverContract,
          mental: {
            ...d.mental,
            morale: Math.min(100, d.mental.morale + 10),
            confidence: Math.min(100, d.mental.confidence + 8),
          },
        }
      : d,
  );

  const finalCareer: CareerState = {
    ...updatedCareer,
    market: {
      ...synced.market,
      drivers: updatedDrivers,
    },
  };

  return {
    accepted: true,
    career: persistCareer(finalCareer, storage),
    reason: `${driver.name} has signed the ${offer.contractYears}-year contract terms as ${offer.status.replace("_", " ")}!`,
    buyoutPaid: buyoutToPay,
  };
}

export function negotiateStaffContract(
  career: CareerState,
  staffId: string,
  salaryPerYear: number,
  contractYears: number,
  storage?: CareerStorage,
): { accepted: boolean; career: CareerState; reason: string; buyoutPaid: number } {
  const synced = syncMarketState(career);
  const staff = synced.market.staff.find((s) => s.id === staffId);
  if (!staff) {
    return { accepted: false, career, reason: "Staff member not found.", buyoutPaid: 0 };
  }

  const minSalary = Math.round(staff.salaryPerYear * 0.9);
  if (salaryPerYear < minSalary) {
    return {
      accepted: false,
      career,
      reason: `${staff.name} declined the offer. They expect at least £${(minSalary / 1_000_000).toFixed(1)}M/yr.`,
      buyoutPaid: 0,
    };
  }

  let buyoutToPay = 0;
  if (staff.currentTeamId && staff.currentTeamId !== career.player.teamId) {
    buyoutToPay = staff.buyoutClause;
    const currentCash = career.finance?.cashBalance ?? 0;
    if (currentCash < buyoutToPay) {
      return {
        accepted: false,
        career,
        reason: `Insufficient cash to pay £${(buyoutToPay / 1_000_000).toFixed(1)}M buyout clause for ${staff.name}.`,
        buyoutPaid: 0,
      };
    }
  }

  let updatedCareer = career;
  if (buyoutToPay > 0) {
    // Staff contracts count against Cost Cap!
    updatedCareer = recordFinancialTransaction(
      updatedCareer,
      -buyoutToPay,
      "facility_maintenance",
      `Staff Poaching Buyout Fee: ${staff.name} (${staff.role})`,
      false, // counts against cap!
      storage,
    );
  }

  const updatedStaffList = synced.market.staff.map((s) =>
    s.id === staffId
      ? {
          ...s,
          currentTeamId: career.player.teamId,
          salaryPerYear,
          contractYearsRemaining: contractYears,
          buyoutClause: Math.round(salaryPerYear * 1.4),
        }
      : s,
  );

  const finalCareer: CareerState = {
    ...updatedCareer,
    market: {
      ...synced.market,
      staff: updatedStaffList,
    },
  };

  return {
    accepted: true,
    career: persistCareer(finalCareer, storage),
    reason: `${staff.name} accepted your offer as ${staff.role.replace("_", " ").toUpperCase()}!`,
    buyoutPaid: buyoutToPay,
  };
}

export function syncMarketState(career: CareerState): CareerState & { market: MarketState } {
  if (career.market) {
    return career as CareerState & { market: MarketState };
  }
  const market = createInitialMarket(career.season.year);
  return {
    ...career,
    market,
  };
}
