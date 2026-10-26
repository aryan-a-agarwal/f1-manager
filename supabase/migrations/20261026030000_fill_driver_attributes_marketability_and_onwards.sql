-- ==============================================================================
-- Migration: 20261026030000_fill_driver_attributes_marketability_and_onwards.sql
-- Description: Fills complete attributes (from marketability onwards, plus full stats)
--              for ALL 91 driver candidates in the database.
-- ==============================================================================

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  1, 'George', 'Russell', 'George Russell', 'British', '1998-02-15', 63, 2019, 1, 'active',
  86, 90, 3, 82, 87, 88, 84,
  86, 89, 85, 86, 75, 87, 88,
  84, 86, 90, 85, 86, 75,
  65, 70, 100, 70, 89, 88, 78, 87,
  91, 89, 88, 85, 26, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  2, 'Kimi', 'Antonelli', 'Kimi Antonelli', 'Italian', '2006-08-25', 12, 2025, 1, 'active',
  74, 90, 2, 58, 82, 74, 72,
  76, 70, 80, 71, 79, 78, 84,
  76, 75, 82, 73, 74, 55,
  70, 70, 100, 70, 82, 77, 96, 83,
  88, 82, 84, 80, 32, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  3, 'Charles', 'Leclerc', 'Charles Leclerc', 'Monegasque', '1997-10-16', 16, 2018, 2, 'active',
  90, 92, 3, 88, 93, 88, 85,
  89, 84, 94, 86, 82, 88, 82,
  80, 85, 93, 87, 86, 80,
  65, 70, 100, 70, 95, 92, 76, 89,
  96, 95, 94, 87, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  4, 'Lewis', 'Hamilton', 'Lewis Hamilton', 'British', '1985-01-07', 44, 2007, 2, 'active',
  90, 90, 3, 99, 89, 92, 88,
  94, 95, 88, 87, 78, 90, 85,
  85, 95, 96, 90, 91, 95,
  85, 70, 100, 70, 99, 98, 45, 93,
  92, 94, 92, 96, 14, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  5, 'Lando', 'Norris', 'Lando Norris', 'British', '1999-11-13', 1, 2019, 3, 'active',
  91, 94, 3, 85, 92, 83, 87,
  90, 92, 91, 89, 80, 90, 83,
  87, 89, 92, 89, 89, 85,
  70, 70, 100, 70, 95, 92, 80, 90,
  93, 93, 93, 89, 22, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  6, 'Oscar', 'Piastri', 'Oscar Piastri', 'Australian', '2001-04-06', 81, 2023, 3, 'active',
  87, 93, 3, 75, 90, 85, 84,
  87, 80, 89, 88, 79, 88, 90,
  86, 87, 91, 85, 86, 65,
  60, 70, 100, 70, 88, 89, 88, 89,
  92, 91, 90, 92, 18, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  7, 'Max', 'Verstappen', 'Max Verstappen', 'Dutch', '1997-09-30', 3, 2015, 4, 'active',
  97, 98, 3, 93, 98, 95, 96,
  97, 96, 97, 95, 88, 93, 80,
  90, 92, 97, 93, 92, 90,
  75, 70, 100, 70, 96, 98, 68, 97,
  98, 98, 98, 90, 16, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  8, 'Isack', 'Hadjar', 'Isack Hadjar', 'French', '2004-09-28', 6, 2025, 4, 'active',
  75, 86, 2, 62, 78, 76, 74,
  75, 72, 77, 73, 80, 75, 85,
  78, 74, 81, 73, 74, 40,
  60, 70, 100, 70, 76, 75, 92, 80,
  84, 80, 80, 78, 33, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  9, 'Liam', 'Lawson', 'Liam Lawson', 'New Zealander', '2002-02-11', 30, 2023, 5, 'active',
  77, 83, 3, 68, 79, 77, 76,
  78, 74, 80, 74, 82, 78, 82,
  76, 77, 84, 75, 76, 45,
  55, 70, 100, 70, 78, 79, 89, 85,
  84, 82, 81, 82, 26, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  10, 'Arvid', 'Lindblad', 'Arvid Lindblad', 'British', '2007-08-08', 41, 2026, 5, 'active',
  66, 88, 1, 45, 74, 68, 65,
  68, 62, 76, 62, 78, 70, 79,
  68, 66, 77, 62, 64, 45,
  60, 70, 100, 70, 70, 70, 97, 76,
  81, 75, 77, 75, 35, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  11, 'Pierre', 'Gasly', 'Pierre Gasly', 'French', '1996-02-07', 10, 2017, 6, 'active',
  82, 84, 3, 84, 83, 80, 79,
  82, 78, 84, 80, 76, 82, 86,
  80, 81, 88, 80, 81, 55,
  60, 70, 100, 70, 85, 83, 69, 83,
  86, 84, 84, 83, 25, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  12, 'Franco', 'Colapinto', 'Franco Colapinto', 'Argentine', '2003-05-27', 43, 2024, 6, 'active',
  74, 85, 2, 60, 78, 76, 72,
  75, 70, 79, 70, 81, 76, 83,
  73, 74, 82, 72, 73, 75,
  55, 70, 100, 70, 86, 78, 92, 83,
  84, 80, 80, 79, 31, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  13, 'Esteban', 'Ocon', 'Esteban Ocon', 'French', '1996-09-17', 31, 2016, 7, 'active',
  81, 82, 3, 85, 82, 78, 80,
  81, 77, 83, 81, 74, 81, 78,
  81, 82, 88, 79, 80, 60,
  80, 70, 100, 70, 80, 82, 67, 82,
  85, 84, 83, 84, 30, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  14, 'Oliver', 'Bearman', 'Oliver Bearman', 'British', '2005-05-08', 87, 2024, 7, 'active',
  76, 88, 2, 60, 80, 76, 74,
  77, 73, 81, 73, 79, 76, 82,
  74, 76, 83, 73, 74, 55,
  65, 70, 100, 70, 82, 78, 93, 84,
  85, 81, 82, 80, 29, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  15, 'Nico', 'Hülkenberg', 'Nico Hülkenberg', 'German', '1987-08-19', 27, 2010, 8, 'active',
  81, 81, 3, 90, 81, 79, 80,
  82, 79, 82, 83, 71, 83, 85,
  84, 84, 89, 81, 82, 50,
  60, 70, 100, 70, 79, 83, 48, 86,
  85, 85, 83, 85, 21, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  16, 'Gabriel', 'Bortoleto', 'Gabriel Bortoleto', 'Brazilian', '2004-10-14', 5, 2025, 8, 'active',
  74, 86, 2, 55, 78, 74, 73,
  76, 71, 79, 72, 77, 75, 81,
  72, 74, 82, 70, 71, 60,
  60, 70, 100, 70, 78, 76, 94, 82,
  83, 80, 81, 83, 24, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  17, 'Carlos', 'Sainz', 'Carlos Sainz', 'Spanish', '1994-09-01', 55, 2015, 9, 'active',
  85, 86, 3, 87, 85, 84, 82,
  87, 88, 84, 85, 76, 85, 84,
  82, 87, 91, 84, 85, 75,
  65, 70, 100, 70, 89, 88, 68, 88,
  88, 87, 86, 90, 20, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  18, 'Alexander', 'Albon', 'Alexander Albon', 'Thai', '1996-03-23', 23, 2019, 9, 'active',
  82, 84, 3, 80, 82, 87, 83,
  83, 86, 80, 81, 72, 82, 87,
  83, 83, 88, 80, 81, 60,
  55, 70, 100, 70, 84, 83, 74, 85,
  85, 84, 83, 86, 22, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  19, 'Fernando', 'Alonso', 'Fernando Alonso', 'Spanish', '1981-07-29', 14, 2001, 10, 'active',
  87, 87, 3, 99, 85, 91, 90,
  93, 90, 86, 85, 84, 89, 78,
  82, 93, 95, 88, 90, 85,
  95, 70, 100, 70, 94, 96, 40, 98,
  93, 93, 91, 89, 18, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  20, 'Lance', 'Stroll', 'Lance Stroll', 'Canadian', '1998-10-29', 18, 2017, 10, 'active',
  71, 73, 3, 78, 74, 68, 70,
  71, 65, 73, 68, 65, 72, 80,
  74, 70, 83, 68, 70, 45,
  55, 70, 100, 70, 72, 73, 62, 78,
  80, 77, 76, 79, 38, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  21, 'Sergio', 'Pérez', 'Sergio Pérez', 'Mexican', '1990-01-26', 11, 2011, 11, 'active',
  81, 81, 3, 88, 80, 76, 77,
  81, 85, 81, 76, 73, 80, 76,
  77, 81, 88, 78, 79, 80,
  65, 70, 100, 70, 92, 82, 50, 79,
  83, 82, 81, 91, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  22, 'Valtteri', 'Bottas', 'Valtteri Bottas', 'Finnish', '1989-08-28', 77, 2013, 11, 'active',
  80, 80, 3, 87, 81, 76, 78,
  79, 77, 83, 82, 68, 82, 88,
  83, 83, 89, 79, 80, 55,
  60, 70, 100, 70, 83, 82, 50, 81,
  84, 83, 82, 88, 20, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  23, 'Fred', 'Vesti', 'Fred Vesti', 'Unknown', null, null, null, null, 'reserve',
  75, 83, 2, 65, 77, 77, 78,
  78, 78, 78, 82, 74, 78, 86,
  84, 80, 82, 77, 78, 74,
  80, 74, 88, 74, 75, 76, 85, 82,
  83, 78, 78, 82, 22, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  24, 'Antonio', 'Giovinazzi', 'Antonio Giovinazzi', 'Unknown', null, null, null, null, 'reserve',
  77, 79, 3, 84, 78, 76, 78,
  77, 78, 80, 80, 74, 82, 86,
  84, 80, 85, 79, 80, 74,
  78, 72, 88, 74, 76, 78, 52, 82,
  84, 80, 78, 82, 22, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  25, 'Leonardo', 'Fornaroli', 'Leonardo Fornaroli', 'Unknown', null, null, null, null, 'reserve',
  73, 86, 1, 55, 76, 75, 76,
  77, 76, 77, 85, 70, 74, 84,
  85, 82, 80, 75, 76, 72,
  78, 75, 88, 78, 74, 74, 93, 80,
  82, 77, 77, 85, 19, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  26, 'Pato', 'O''Ward', 'Pato O''Ward', 'Unknown', null, null, null, null, 'reserve',
  78, 86, 3, 74, 82, 85, 81,
  83, 80, 81, 78, 88, 78, 76,
  80, 78, 85, 82, 80, 86,
  84, 75, 90, 78, 87, 81, 80, 87,
  88, 84, 83, 78, 29, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  27, 'Yuki', 'Tsunoda', 'Yuki Tsunoda', 'Unknown', null, null, null, null, 'reserve',
  80, 84, 3, 80, 82, 83, 82,
  81, 79, 83, 78, 84, 80, 78,
  82, 78, 85, 81, 80, 82,
  80, 72, 88, 75, 84, 80, 72, 81,
  87, 83, 82, 79, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  28, 'Paul', 'Aron', 'Paul Aron', 'Unknown', null, null, null, null, 'reserve',
  74, 85, 2, 56, 78, 77, 75,
  76, 77, 80, 78, 77, 74, 82,
  82, 76, 80, 78, 76, 73,
  78, 74, 88, 76, 75, 74, 92, 80,
  84, 78, 78, 78, 27, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  29, 'Jack', 'Doohan', 'Jack Doohan', 'Unknown', null, null, null, null, 'reserve',
  75, 85, 2, 64, 79, 78, 76,
  77, 77, 80, 75, 78, 76, 80,
  80, 76, 82, 78, 76, 75,
  80, 72, 88, 74, 78, 76, 91, 81,
  84, 79, 80, 78, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  30, 'Ryo', 'Hirakawa', 'Ryo Hirakawa', 'Unknown', null, null, null, null, 'reserve',
  76, 79, 3, 84, 77, 77, 78,
  79, 80, 77, 84, 74, 85, 88,
  88, 84, 84, 78, 82, 80,
  80, 75, 88, 75, 78, 79, 55, 84,
  83, 79, 78, 84, 19, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  31, 'Jak', 'Crawford', 'Jak Crawford', 'Unknown', null, null, null, null, 'reserve',
  73, 84, 2, 58, 76, 76, 75,
  76, 75, 77, 78, 75, 74, 82,
  82, 77, 80, 76, 76, 78,
  80, 74, 88, 75, 78, 74, 91, 80,
  83, 76, 77, 79, 26, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  32, 'Zhou', 'Guanyu', 'Zhou Guanyu', 'Unknown', null, null, null, null, 'reserve',
  76, 80, 3, 78, 77, 75, 77,
  76, 76, 76, 82, 70, 78, 85,
  85, 82, 84, 76, 78, 90,
  80, 70, 88, 72, 88, 76, 68, 78,
  82, 77, 77, 84, 21, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  33, 'Rafael', 'Câmara', 'Rafael Câmara', 'Brazil', null, null, null, null, 'reserve',
  71, 87, 1, 48, 75, 74, 73,
  74, 74, 76, 78, 76, 72, 82,
  80, 76, 78, 75, 74, 75,
  80, 75, 88, 78, 75, 72, 95, 78,
  83, 75, 76, 77, 29, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  34, 'Joshua', 'Dürksen', 'Joshua Dürksen', 'Paraguay', null, null, null, null, 'reserve',
  72, 83, 1, 54, 76, 77, 74,
  75, 75, 76, 74, 80, 72, 80,
  78, 74, 78, 76, 74, 74,
  78, 74, 88, 74, 74, 72, 92, 79,
  83, 76, 76, 75, 30, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  35, 'Ritomo', 'Miyata', 'Ritomo Miyata', 'Japan', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  36, 'Colton', 'Herta', 'Colton Herta', 'United States', null, null, null, null, 'reserve',
  77, 85, 3, 72, 82, 84, 79,
  81, 79, 82, 75, 87, 76, 75,
  78, 76, 84, 81, 78, 84,
  82, 75, 88, 76, 85, 79, 80, 85,
  87, 83, 82, 76, 32, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  37, 'Noel', 'León', 'Noel León', 'Mexico', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  38, 'Nikola', 'Tsolov', 'Nikola Tsolov', 'Bulgaria', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  39, 'Dino', 'Beganovic', 'Dino Beganovic', 'Sweden', null, null, null, null, 'reserve',
  72, 85, 1, 52, 76, 75, 74,
  75, 75, 77, 77, 75, 72, 82,
  80, 76, 78, 76, 75, 74,
  78, 74, 88, 75, 75, 73, 93, 79,
  83, 76, 77, 78, 27, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  40, 'Roman', 'Bilinski', 'Roman Bilinski', 'Poland', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  41, 'Gabriele', 'Minì', 'Gabriele Minì', 'Italy', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  42, 'Oliver', 'Goethe', 'Oliver Goethe', 'Germany', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  43, 'Sebastián', 'Montoya', 'Sebastián Montoya', 'Colombia', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  44, 'Mari', 'Boya', 'Mari Boya', 'Spain', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  45, 'Martinius', 'Stenshorne', 'Martinius Stenshorne', 'Norway', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  46, 'Alexander', 'Dunne', 'Alexander Dunne', 'Ireland', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  47, 'Kush', 'Maini', 'Kush Maini', 'India', null, null, null, null, 'reserve',
  72, 82, 2, 58, 76, 76, 74,
  75, 74, 77, 75, 77, 73, 82,
  80, 75, 79, 76, 75, 80,
  80, 74, 88, 74, 78, 73, 88, 79,
  83, 76, 76, 77, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  48, 'Tasanapol', 'Inthraphuvasak', 'Tasanapol Inthraphuvasak', 'Thailand', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  49, 'Emerson', 'Fittipaldi', 'Emerson Fittipaldi', 'Brazil', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  50, 'Cian', 'Shields', 'Cian Shields', 'United Kingdom', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  51, 'Nicolás', 'Varrone', 'Nicolás Varrone', 'Argentina', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  52, 'Rafael', 'Villagómez', 'Rafael Villagómez', 'Mexico', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  53, 'Laurens', 'van Hoepen', 'Laurens van Hoepen', 'Netherlands', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  54, 'John', 'Bennett', 'John Bennett', 'United Kingdom', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  55, 'Théophile', 'Naël', 'Théophile Naël', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  56, 'Ugo', 'Ugochukwu', 'Ugo Ugochukwu', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  57, 'Ernesto', 'Rivera', 'Ernesto Rivera', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  58, 'Noah', 'Stromsted', 'Noah Stromsted', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  59, 'Freddie', 'Slater', 'Freddie Slater', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  60, 'Matteo', 'De Palo', 'Matteo De Palo', 'Unknown', null, null, null, null, 'junior',
  69, 83, 1, 45, 71, 70, 69,
  69, 68, 72, 67, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 72, 70, 94, 76,
  81, 70, 70, 69, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  61, 'Mattia', 'Colnaghi', 'Mattia Colnaghi', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  62, 'Tuukka', 'Taponen', 'Tuukka Taponen', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  63, 'Alessandro', 'Giusti', 'Alessandro Giusti', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  64, 'Taito', 'Kato', 'Taito Kato', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  65, 'Maciej', 'Gładysz', 'Maciej Gładysz', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  66, 'Kanato', 'Le', 'Kanato Le', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  67, 'Hiyu', 'Yamakoshi', 'Hiyu Yamakoshi', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  68, 'Enzo', 'Deligny', 'Enzo Deligny', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  69, 'Bruno', 'del Pino', 'Bruno del Pino', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  70, 'Pedro', 'Clerot', 'Pedro Clerot', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  71, 'Brando', 'Badoer', 'Brando Badoer', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  72, 'Christian', 'Ho', 'Christian Ho', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  73, 'Louis', 'Sharp', 'Louis Sharp', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  74, 'James', 'Wharton', 'James Wharton', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  75, 'Jose', 'Garfias', 'Jose Garfias', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  76, 'Michael', 'Shin', 'Michael Shin', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  77, 'Fionn', 'McLaughlin', 'Fionn McLaughlin', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  78, 'Jin', 'Nakamura', 'Jin Nakamura', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  79, 'Brad', 'Benavides', 'Brad Benavides', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  80, 'Yevan', 'David', 'Yevan David', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  81, 'Fernando', 'Barrichello', 'Fernando Barrichello', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  82, 'Nicola', 'Lacorte', 'Nicola Lacorte', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  83, 'Nandhavud', 'Bhirombhakdi', 'Nandhavud Bhirombhakdi', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  84, 'Gerrard', 'Xie', 'Gerrard Xie', 'Unknown', null, null, null, null, 'junior',
  66, 81, 1, 38, 68, 67, 66,
  66, 65, 69, 64, 76, 70, 80,
  78, 73, 75, 74, 73, 70,
  75, 75, 88, 72, 68, 66, 96, 76,
  81, 67, 67, 66, 34, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  115, 'Sébastien', 'Buemi', 'Sébastien Buemi', 'Switzerland', null, null, null, null, 'reserve',
  78, 79, 3, 90, 77, 78, 80,
  81, 82, 78, 86, 76, 90, 90,
  88, 86, 88, 80, 84, 72,
  80, 75, 88, 75, 75, 82, 45, 86,
  82, 80, 78, 86, 17, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  118, 'Luke', 'Browning', 'Luke Browning', 'United Kingdom', null, null, null, null, 'reserve',
  73, 85, 1, 54, 77, 76, 75,
  76, 76, 77, 76, 79, 73, 80,
  80, 75, 79, 76, 75, 72,
  78, 74, 88, 76, 74, 73, 93, 80,
  83, 77, 77, 76, 28, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  119, 'Victor', 'Martins', 'Victor Martins', 'France', null, null, null, null, 'reserve',
  75, 84, 2, 60, 79, 80, 76,
  77, 77, 81, 72, 82, 75, 78,
  78, 74, 80, 79, 76, 74,
  78, 72, 88, 74, 76, 75, 89, 81,
  85, 79, 80, 75, 32, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  120, 'Ayumu', 'Iwasa', 'Ayumu Iwasa', 'Japan', null, null, null, null, 'reserve',
  74, 83, 2, 62, 78, 80, 76,
  77, 77, 78, 76, 81, 75, 80,
  80, 76, 81, 78, 76, 78,
  80, 72, 88, 74, 78, 75, 86, 81,
  85, 78, 78, 77, 29, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  122, 'Stoffel', 'Vandoorne', 'Stoffel Vandoorne', 'Belgium', null, null, null, null, 'reserve',
  78, 80, 3, 85, 78, 77, 79,
  79, 80, 79, 84, 72, 85, 88,
  88, 84, 86, 78, 82, 75,
  78, 74, 88, 75, 77, 80, 50, 84,
  83, 80, 79, 86, 18, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  125, 'Théo', 'Pourchaire', 'Théo Pourchaire', 'France', null, null, null, null, 'reserve',
  76, 86, 2, 66, 79, 80, 77,
  78, 78, 80, 76, 79, 77, 80,
  80, 77, 82, 78, 77, 76,
  80, 72, 88, 75, 79, 78, 90, 82,
  85, 80, 80, 79, 27, 'healthy', null, now()
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
  updated_at = now();

insert into public.drivers (
  id, first_name, last_name, "driver-name", nationality, date_of_birth, car_number, f1_debut_season, team_id, driver_status,
  current_overall_rating, potential_rating, experience_level_code, experience_rating, pace, overtaking, defending,
  racecraft, wet_weather_ability, qualifying, consistency, aggression, battery_management, team_orders_understanding,
  reliability, tyre_management, pit_stop_precision, tyre_warm_up_ability, temperature_control, personal_sponsorship_backing,
  management_support_strength, morale, fitness, form, marketability, reputation, development_rate, adaptability,
  reactions, braking, cornering, smoothness, incident_proneness, injury_status, portrait_url, updated_at
)
values (
  126, 'Zane', 'Maloney', 'Zane Maloney', 'Barbados', null, null, null, null, 'reserve',
  74, 84, 2, 58, 78, 77, 75,
  76, 78, 78, 76, 78, 74, 80,
  80, 76, 80, 77, 76, 74,
  78, 74, 88, 76, 76, 75, 90, 81,
  84, 78, 78, 77, 27, 'healthy', null, now()
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
  updated_at = now();
