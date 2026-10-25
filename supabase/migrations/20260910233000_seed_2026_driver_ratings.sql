-- Migration: 20260910233000_seed_2026_driver_ratings.sql
-- Populates drivers, teams, driver_contracts, driver_career_stats, and driver_rating_history
-- from 'FF1 2026 Grid Driver info.xlsx'.

-- 1. Ensure required columns exist on target tables and relax legacy constraints
alter table public.drivers
  add column if not exists current_overall_rating integer,
  add column if not exists pit_stop_precision integer,
  add column if not exists experience_level_code integer;

alter table public.driver_contracts
  add column if not exists salary_tier_code integer;

alter table public.driver_rating_history
  add column if not exists pit_stop_precision integer;

-- Drop NOT NULL constraint on legacy 'driver-name' or 'driver_name' columns if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drivers' and column_name = 'driver-name'
  ) then
    alter table public.drivers alter column "driver-name" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drivers' and column_name = 'driver_name'
  ) then
    alter table public.drivers alter column driver_name drop not null;
  end if;
end
$$;

-- 2. Ensure public.teams is populated from verified team facts and team info
insert into public.teams (id, slug, short_name, constructor_name, legal_name, base_city, base_country, power_unit_supplier, first_f1_entry_year)
select
  id,
  slug,
  short_name,
  official_full_name,
  legal_name,
  base_city,
  base_country,
  power_unit,
  first_team_entry
from public.f1_team_facts
on conflict (id) do update set
  short_name = excluded.short_name,
  constructor_name = excluded.constructor_name,
  legal_name = excluded.legal_name,
  base_city = excluded.base_city,
  base_country = excluded.base_country,
  power_unit_supplier = excluded.power_unit_supplier,
  first_f1_entry_year = excluded.first_f1_entry_year;

-- 3. Upsert driver records into public.drivers
insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  7, 4, 'Max', 'Verstappen', 'Dutch', coalesce((select date_of_birth from public.people where id = 7), make_date(1997, 1, 1)),
  3, 2015, 97, 98, 3, 98, 95, 96,
  97, 96, 97, 95, 88, 93,
  93, 80, 90, 92, 95,
  93, 92, 90, 75
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  8, 4, 'Isack', 'Hadjar', 'French', coalesce((select date_of_birth from public.people where id = 8), make_date(2004, 1, 1)),
  6, 2025, 75, 86, 2, 78, 76, 74,
  75, 72, 77, 73, 80, 62,
  75, 85, 78, 74, 82,
  73, 74, 40, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  3, 2, 'Charles', 'Leclerc', 'Monegasque', coalesce((select date_of_birth from public.people where id = 3), make_date(1997, 1, 1)),
  16, 2018, 90, 92, 3, 93, 88, 85,
  89, 84, 94, 86, 82, 88,
  88, 82, 80, 85, 90,
  87, 86, 80, 65
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  4, 2, 'Lewis', 'Hamilton', 'British', coalesce((select date_of_birth from public.people where id = 4), make_date(1985, 1, 1)),
  44, 2007, 90, 90, 3, 89, 92, 88,
  94, 95, 88, 87, 78, 99,
  90, 85, 85, 95, 91,
  90, 91, 95, 85
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  1, 1, 'George', 'Russell', 'British', coalesce((select date_of_birth from public.people where id = 1), make_date(1998, 1, 1)),
  63, 2019, 86, 90, 3, 87, 88, 84,
  86, 89, 85, 86, 75, 82,
  87, 88, 84, 86, 89,
  85, 86, 75, 65
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  2, 1, 'Kimi', 'Antonelli', 'Italian', coalesce((select date_of_birth from public.people where id = 2), make_date(2006, 1, 1)),
  12, 2025, 74, 90, 2, 82, 74, 72,
  76, 70, 80, 71, 79, 58,
  78, 84, 76, 75, 80,
  73, 74, 55, 70
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  5, 3, 'Lando', 'Norris', 'British', coalesce((select date_of_birth from public.people where id = 5), make_date(1999, 1, 1)),
  1, 2019, 91, 94, 3, 92, 83, 87,
  90, 92, 91, 89, 80, 85,
  90, 83, 87, 89, 92,
  89, 89, 85, 70
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  6, 3, 'Oscar', 'Piastri', 'Australian', coalesce((select date_of_birth from public.people where id = 6), make_date(2001, 1, 1)),
  81, 2023, 87, 93, 3, 90, 85, 84,
  87, 80, 89, 88, 79, 75,
  88, 90, 86, 87, 90,
  85, 86, 65, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  19, 10, 'Fernando', 'Alonso', 'Spanish', coalesce((select date_of_birth from public.people where id = 19), make_date(1981, 1, 1)),
  14, 2001, 87, 87, 3, 85, 91, 90,
  93, 90, 86, 85, 84, 99,
  89, 78, 82, 93, 88,
  88, 90, 85, 95
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  20, 10, 'Lance', 'Stroll', 'Canadian', coalesce((select date_of_birth from public.people where id = 20), make_date(1998, 1, 1)),
  18, 2017, 71, 73, 3, 74, 68, 70,
  71, 65, 73, 68, 65, 78,
  72, 80, 74, 70, 78,
  68, 70, 45, 55
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  11, 6, 'Pierre', 'Gasly', 'French', coalesce((select date_of_birth from public.people where id = 11), make_date(1996, 1, 1)),
  10, 2017, 82, 84, 3, 83, 80, 79,
  82, 78, 84, 80, 76, 84,
  82, 86, 80, 81, 85,
  80, 81, 55, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  12, 6, 'Franco', 'Colapinto', 'Argentine', coalesce((select date_of_birth from public.people where id = 12), make_date(2003, 1, 1)),
  43, 2024, 74, 85, 2, 78, 76, 72,
  75, 70, 79, 70, 81, 60,
  76, 83, 73, 74, 79,
  72, 73, 75, 55
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  17, 9, 'Carlos', 'Sainz', 'Spanish', coalesce((select date_of_birth from public.people where id = 17), make_date(1994, 1, 1)),
  55, 2015, 85, 86, 3, 85, 84, 82,
  87, 88, 84, 85, 76, 87,
  85, 84, 82, 87, 88,
  84, 85, 75, 65
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  18, 9, 'Alexander', 'Albon', 'Thai', coalesce((select date_of_birth from public.people where id = 18), make_date(1996, 1, 1)),
  23, 2019, 82, 84, 3, 82, 87, 83,
  83, 86, 80, 81, 72, 80,
  82, 87, 83, 83, 86,
  80, 81, 60, 55
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  9, 5, 'Liam', 'Lawson', 'New Zealander', coalesce((select date_of_birth from public.people where id = 9), make_date(2002, 1, 1)),
  30, 2023, 77, 83, 3, 79, 77, 76,
  78, 74, 80, 74, 82, 68,
  78, 82, 76, 77, 82,
  75, 76, 45, 55
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  10, 5, 'Arvid', 'Lindblad', 'British', coalesce((select date_of_birth from public.people where id = 10), make_date(2007, 1, 1)),
  41, 2026, 66, 88, 1, 74, 68, 65,
  68, 62, 76, 62, 78, 45,
  70, 79, 68, 66, 75,
  62, 64, 45, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  13, 7, 'Esteban', 'Ocon', 'French', coalesce((select date_of_birth from public.people where id = 13), make_date(1996, 1, 1)),
  31, 2016, 81, 82, 3, 82, 78, 80,
  81, 77, 83, 81, 74, 85,
  81, 78, 81, 82, 84,
  79, 80, 60, 80
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  14, 7, 'Oliver', 'Bearman', 'British', coalesce((select date_of_birth from public.people where id = 14), make_date(2005, 1, 1)),
  87, 2024, 76, 88, 2, 80, 76, 74,
  77, 73, 81, 73, 79, 60,
  76, 82, 74, 76, 80,
  73, 74, 55, 65
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  15, 8, 'Nico', 'Hülkenberg', 'German', coalesce((select date_of_birth from public.people where id = 15), make_date(1987, 1, 1)),
  27, 2010, 81, 81, 3, 81, 79, 80,
  82, 79, 82, 83, 71, 90,
  83, 85, 84, 84, 87,
  81, 82, 50, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  16, 8, 'Gabriel', 'Bortoleto', 'Brazilian', coalesce((select date_of_birth from public.people where id = 16), make_date(2004, 1, 1)),
  5, 2025, 74, 86, 2, 78, 74, 73,
  76, 71, 79, 72, 77, 55,
  75, 81, 72, 74, 78,
  70, 71, 60, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  21, 11, 'Sergio', 'Pérez', 'Mexican', coalesce((select date_of_birth from public.people where id = 21), make_date(1990, 1, 1)),
  11, 2011, 81, 81, 3, 80, 76, 77,
  81, 85, 81, 76, 73, 88,
  80, 76, 77, 81, 85,
  78, 79, 80, 65
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

insert into public.drivers (
  id, team_id, first_name, last_name, nationality, date_of_birth, car_number, f1_debut_season,
  current_overall_rating, potential_rating, experience_level_code, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, experience_rating,
  battery_management, team_orders_understanding, reliability, tyre_management, pit_stop_precision,
  tyre_warm_up_ability, temperature_control, personal_sponsorship_backing, management_support_strength
)
values (
  22, 11, 'Valtteri', 'Bottas', 'Finnish', coalesce((select date_of_birth from public.people where id = 22), make_date(1989, 1, 1)),
  77, 2013, 80, 80, 3, 81, 76, 78,
  79, 77, 83, 82, 68, 87,
  82, 88, 83, 83, 86,
  79, 80, 55, 60
)
on conflict (id) do update set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  nationality = excluded.nationality,
  date_of_birth = excluded.date_of_birth,
  car_number = excluded.car_number,
  f1_debut_season = excluded.f1_debut_season,
  current_overall_rating = excluded.current_overall_rating,
  potential_rating = excluded.potential_rating,
  experience_level_code = excluded.experience_level_code,
  pace = excluded.pace,
  overtaking = excluded.overtaking,
  defending = excluded.defending,
  racecraft = excluded.racecraft,
  wet_weather_ability = excluded.wet_weather_ability,
  qualifying = excluded.qualifying,
  consistency = excluded.consistency,
  aggression = excluded.aggression,
  experience_rating = excluded.experience_rating,
  battery_management = excluded.battery_management,
  team_orders_understanding = excluded.team_orders_understanding,
  reliability = excluded.reliability,
  tyre_management = excluded.tyre_management,
  pit_stop_precision = excluded.pit_stop_precision,
  tyre_warm_up_ability = excluded.tyre_warm_up_ability,
  temperature_control = excluded.temperature_control,
  personal_sponsorship_backing = excluded.personal_sponsorship_backing,
  management_support_strength = excluded.management_support_strength;

-- Sync legacy 'driver-name' or 'driver_name' column if it exists in the table
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drivers' and column_name = 'driver-name'
  ) then
    execute 'update public.drivers set "driver-name" = trim(concat(first_name, '' '', last_name))';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drivers' and column_name = 'driver_name'
  ) then
    execute 'update public.drivers set driver_name = trim(concat(first_name, '' '', last_name))';
  end if;
end
$$;

-- 4. Upsert driver contracts
delete from public.driver_contracts where driver_id = 7;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (7, 4, 2015, 2030, 70, 95, 5, 'active');

delete from public.driver_contracts where driver_id = 8;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (8, 4, 2026, 2027, 5, 45, 2, 'active');

delete from public.driver_contracts where driver_id = 3;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (3, 2, 2019, 2030, 34, 80, 5, 'active');

delete from public.driver_contracts where driver_id = 4;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (4, 2, 2025, 2027, 60, 90, 5, 'active');

delete from public.driver_contracts where driver_id = 1;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (1, 1, 2022, 2027, 34, 75, 5, 'active');

delete from public.driver_contracts where driver_id = 2;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (2, 1, 2025, 2027, 2, 50, 2, 'active');

delete from public.driver_contracts where driver_id = 5;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (5, 3, 2019, 2030, 30, 88, 5, 'active');

delete from public.driver_contracts where driver_id = 6;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (6, 3, 2023, 2028, 13, 70, 4, 'active');

delete from public.driver_contracts where driver_id = 19;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (19, 10, 2023, 2026, 20, 75, 4, 'active');

delete from public.driver_contracts where driver_id = 20;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (20, 10, 2017, 2027, 12, 40, 3, 'active');

delete from public.driver_contracts where driver_id = 11;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (11, 6, 2023, 2028, 12, 60, 3, 'active');

delete from public.driver_contracts where driver_id = 12;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (12, 6, 2024, 2027, 1, 40, 1, 'active');

delete from public.driver_contracts where driver_id = 17;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (17, 9, 2025, 2028, 30, 70, 5, 'active');

delete from public.driver_contracts where driver_id = 18;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (18, 9, 2022, 2027, 15, 55, 4, 'active');

delete from public.driver_contracts where driver_id = 9;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (9, 5, 2026, 2026, 1, 45, 1, 'active');

delete from public.driver_contracts where driver_id = 10;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (10, 5, 2026, 2027, 1, 40, 1, 'active');

delete from public.driver_contracts where driver_id = 13;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (13, 7, 2025, 2026, 7, 55, 3, 'active');

delete from public.driver_contracts where driver_id = 14;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (14, 7, 2025, 2026, 1, 45, 1, 'active');

delete from public.driver_contracts where driver_id = 15;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (15, 8, 2025, 2027, 7, 50, 3, 'active');

delete from public.driver_contracts where driver_id = 16;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (16, 8, 2025, 2027, 2, 45, 2, 'active');

delete from public.driver_contracts where driver_id = 21;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (21, 11, 2026, 2027, 8, 55, 3, 'active');

delete from public.driver_contracts where driver_id = 22;
insert into public.driver_contracts (driver_id, team_id, start_year, end_year, base_salary_usd_millions, bonus_clause_strength, salary_tier_code, status)
values (22, 11, 2026, 2027, 5, 50, 3, 'active');

-- 5. Upsert driver career stats (season 2026 baseline)
insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (7, 2026, 233, 71, 4)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (8, 2026, 29, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (3, 2026, 171, 8, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (4, 2026, 380, 105, 7)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (1, 2026, 152, 5, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (2, 2026, 24, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (5, 2026, 152, 11, 1)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (6, 2026, 70, 9, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (19, 2026, 425, 32, 2)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (20, 2026, 189, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (11, 2026, 177, 1, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (12, 2026, 26, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (17, 2026, 229, 4, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (18, 2026, 128, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (9, 2026, 35, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (10, 2026, 5, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (13, 2026, 180, 1, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (14, 2026, 27, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (15, 2026, 250, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (16, 2026, 24, 0, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (21, 2026, 290, 6, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

insert into public.driver_career_stats (driver_id, season, starts, wins, world_championships)
values (22, 2026, 259, 10, 0)
on conflict (driver_id, season) do update set
  starts = excluded.starts,
  wins = excluded.wins,
  world_championships = excluded.world_championships;

-- 6. Insert initial driver rating history entry (season 2026 baseline)
insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  7, 2026, 97, 98, 95, 96, 97, 96,
  97, 95, 88, 93, 98, 93,
  80, 90, 92, 95
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  8, 2026, 75, 78, 76, 74, 75, 72,
  77, 73, 80, 62, 86, 75,
  85, 78, 74, 82
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  3, 2026, 90, 93, 88, 85, 89, 84,
  94, 86, 82, 88, 92, 88,
  82, 80, 85, 90
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  4, 2026, 90, 89, 92, 88, 94, 95,
  88, 87, 78, 99, 90, 90,
  85, 85, 95, 91
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  1, 2026, 86, 87, 88, 84, 86, 89,
  85, 86, 75, 82, 90, 87,
  88, 84, 86, 89
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  2, 2026, 74, 82, 74, 72, 76, 70,
  80, 71, 79, 58, 90, 78,
  84, 76, 75, 80
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  5, 2026, 91, 92, 83, 87, 90, 92,
  91, 89, 80, 85, 94, 90,
  83, 87, 89, 92
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  6, 2026, 87, 90, 85, 84, 87, 80,
  89, 88, 79, 75, 93, 88,
  90, 86, 87, 90
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  19, 2026, 87, 85, 91, 90, 93, 90,
  86, 85, 84, 99, 87, 89,
  78, 82, 93, 88
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  20, 2026, 71, 74, 68, 70, 71, 65,
  73, 68, 65, 78, 73, 72,
  80, 74, 70, 78
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  11, 2026, 82, 83, 80, 79, 82, 78,
  84, 80, 76, 84, 84, 82,
  86, 80, 81, 85
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  12, 2026, 74, 78, 76, 72, 75, 70,
  79, 70, 81, 60, 85, 76,
  83, 73, 74, 79
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  17, 2026, 85, 85, 84, 82, 87, 88,
  84, 85, 76, 87, 86, 85,
  84, 82, 87, 88
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  18, 2026, 82, 82, 87, 83, 83, 86,
  80, 81, 72, 80, 84, 82,
  87, 83, 83, 86
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  9, 2026, 77, 79, 77, 76, 78, 74,
  80, 74, 82, 68, 83, 78,
  82, 76, 77, 82
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  10, 2026, 66, 74, 68, 65, 68, 62,
  76, 62, 78, 45, 88, 70,
  79, 68, 66, 75
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  13, 2026, 81, 82, 78, 80, 81, 77,
  83, 81, 74, 85, 82, 81,
  78, 81, 82, 84
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  14, 2026, 76, 80, 76, 74, 77, 73,
  81, 73, 79, 60, 88, 76,
  82, 74, 76, 80
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  15, 2026, 81, 81, 79, 80, 82, 79,
  82, 83, 71, 90, 81, 83,
  85, 84, 84, 87
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  16, 2026, 74, 78, 74, 73, 76, 71,
  79, 72, 77, 55, 86, 75,
  81, 72, 74, 78
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  21, 2026, 81, 80, 76, 77, 81, 85,
  81, 76, 73, 88, 81, 80,
  76, 77, 81, 85
);

insert into public.driver_rating_history (
  driver_id, season, overall_rating, pace, overtaking, defending, racecraft, wet_weather_ability,
  qualifying, consistency, aggression, experience_rating, potential_rating, battery_management,
  team_orders_understanding, reliability, tyre_management, pit_stop_precision
)
values (
  22, 2026, 80, 81, 76, 78, 79, 77,
  83, 82, 68, 87, 80, 82,
  88, 83, 83, 86
);

-- 7. Allow public read access to game reference/ratings tables
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'drivers' and policyname = 'allow read drivers') then
    create policy "allow read drivers" on public.drivers for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'teams' and policyname = 'allow read teams') then
    create policy "allow read teams" on public.teams for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'driver_contracts' and policyname = 'allow read driver contracts') then
    create policy "allow read driver contracts" on public.driver_contracts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'driver_career_stats' and policyname = 'allow read driver career stats') then
    create policy "allow read driver career stats" on public.driver_career_stats for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'driver_rating_history' and policyname = 'allow read driver rating history') then
    create policy "allow read driver rating history" on public.driver_rating_history for select using (true);
  end if;
end
$$;
