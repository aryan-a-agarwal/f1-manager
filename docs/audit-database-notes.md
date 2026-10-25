# Database and reference-data audit

Audit date: 25 October 2026. This is an analysis and implementation proposal, not an applied migration.

## What was verified

- Reviewed all 11 committed SQL migrations, the Supabase client and call sites, career initialization/storage, grid/circuit constants, and market profiles.
- Inspected the supplied `F1_2026_Grid_Driver_Info (5).xlsx` read-only. It contains `F1 2026 Drivers`, `Legend`, and `Team Info`. The driver sheet has 22 data rows and 36 columns, with no empty data cells in `A2:AJ23`.
- Compared 20 rating/gameplay fields per driver in the workbook with the September ratings migration: all 440 values agree. This confirms the source-to-migration mapping for those fields, not that the values are real-world facts or that the migration was applied remotely.
- Attempted a GET of the configured Supabase REST schema using only the configured public URL and public client key. It failed with DNS `ENOTFOUND`, including a retry with approved network access. The URL has the shape of a hosted HTTPS Supabase endpoint and does not look like a placeholder. No credentials were printed and no remote data was changed.
- **No live row counts, actual deployed schema, migration history, active database policies, or live null/orphan counts could be verified.** All counts below are local seed definitions or explicit migration assertions, not live database findings. DNS failure alone does not establish whether the project was deleted, paused, misconfigured, or inaccessible from this environment.

## Main conclusion

The most urgent data task is to connect and reconcile the existing data. The project already defines a substantial fact catalogue and a ratings seed, but the playable career uses a separate set of hard-coded objects. Adding more columns to the database alone will not change the game.

The only application Supabase reads are inside the Database page: `app/game/page.tsx:2577`–`2583` loads `people`, `series_entries`, `f1_team_staff`, `f1_team_facts`, and `track_facts`. There are no application reads of `drivers`, `driver_contracts`, `driver_rating_history`, `teams`, `staff`, or `tracks`. `lib/career/createCareer.ts:26` initializes hard-coded workforce and `:56` initializes the hard-coded market; `lib/career/storage.ts:20` uses browser localStorage. Race snapshots use the static circuit map at `lib/career/weekend.ts:34`.

Keep three things distinct:

1. Reference facts with source, verification date, effective date, and identity.
2. Game-balance assumptions such as ratings, salary estimates, facilities, starting cash, and team behavior, with a dataset/version label.
3. Each career's mutable world, including transfers, finances, development, results, and history.

Existing saves must retain their starting dataset and subsequent changes when a reference catalogue is refreshed.

## Existing local data coverage

| Area | What the repository defines | Important limit |
| --- | --- | --- |
| Fact sources | 8 source records across the fact seed and circuit registry migration | A URL and verification date are recorded, but do not themselves prove that every claimed field is correct. |
| Fact teams | 11 F1 teams | No season/effective interval on `f1_team_facts`; legal names are not populated by its seed. |
| Fact people | 109 people: 22 F1 race drivers, 10 reserve-driver people, 22 F2 drivers, 30 F3 drivers, 25 senior staff | Only the 22 F1 race-driver rows have DOBs in these seeds. There are 87 intentional missing DOBs and 65 missing nationalities in the supplied seed rows. |
| Championship entries | 86: 22 F1 race entries, 22 F2 race entries, 30 F3 race entries, 12 F1 reserve assignments | Some reserve people have more than one assignment. Entrants are free text, not a team FK. |
| Staff assignments | 25 senior-personnel assignments | Role names are free text and are not the game's hireable-role structure. |
| Circuit facts | 41 distinct venues; assertions require 24 originally announced 2026 venues and 36 venues with race-lap data | Historical/licence facts are mixed across dates/layout versions; 5 venues have intentionally unknown F1 race laps. |
| Driver ratings/contracts | Explicit seeds for 22 F1 drivers, their contracts, career-stat baselines, and rating histories | The wider 84-driver fact catalogue has no corresponding complete game ratings/contracts seed. |
| Gameplay drivers | 25 hard-coded market profiles | 22 grid drivers plus 3 unattached profiles; the fact catalogue is not the recruitment pool. |
| Gameplay staff | 8 hard-coded profiles | They cover only technical director, head of aero, and race engineer. There are no initial chief-designer or chief-scout profiles even though both roles exist in the type. |
| Save data | One active localStorage career plus one backup | No Supabase career tables or user ownership model are declared. Cloud saves are optional for a local single-player game. |

Seed evidence: `supabase/migrations/20260831120000_create_and_seed_fact_reference_data.sql:88`, `:98`, `:113`, `:141`, `:156`, `:162`, `:167`, `:173`, `:179`, `:185`, `:202`, and `:221`; circuit assertions at `20260831130000_expand_track_registry.sql:60` and `20260831133000_fill_track_race_facts.sql:60`. Market data is at `lib/career/paddockMarket.ts:28`, `:457`, and `:556`.

## Issues to fix before adding new gameplay systems

### 1. A fresh database cannot be reconstructed from this repository

The migrations begin by altering `public.drivers`, and later alter `teams`, `staff`, and `tracks`, but none creates those four base tables. A comment explicitly refers to dashboard-created tables. This means the committed migration history is not a complete schema definition. The local Supabase config also points to `./seed.sql`, which is absent.

Evidence: `supabase/migrations/20260830230000_add_driver_excel_columns.sql:1`; `20260830233000_normalize_driver_schema.sql:1`; `20260830234500_add_staff_component_expertise.sql:1`; `20260831003000_expand_and_seed_tracks.sql:1`; `supabase/config.toml:70`.

Work required: once the endpoint is accessible, export/read the actual schema and applied migration history. Capture the missing baseline, then arrange a complete clean-install migration sequence without rerunning destructive historical seeds against existing data. Test it on an empty disposable database. Align or remove the missing seed-file setting.

### 2. Identity joins depend on numeric IDs from an assumed insert order

The ratings migration copies `f1_team_facts.id` straight into `teams.id`, then hard-codes numeric driver and team IDs. For example, Verstappen is assumed to be `people.id = 7` and `team_id = 4`. The people table has independent identity-generated IDs and the drivers table has no `person_id` FK. Existing rows or a different insertion history can attach someone else's DOB, attach the wrong team, overwrite an unrelated row, or fail a unique constraint. Explicit identity inserts also require sequence reconciliation; no `setval` is present in the committed migrations.

Evidence: `20260910233000_seed_2026_driver_ratings.sql:36`–`55`, `:58`–`77`; fact identity definitions at `20260831120000_create_and_seed_fact_reference_data.sql:14` and `:31`.

Work required: one canonical person identity and one canonical team identity. Use explicit foreign keys and unique stable keys for import mapping, resolving IDs by key rather than positional numbers. Add a deliberate mapping from legacy numeric IDs and application slugs so existing careers remain loadable. Reconcile identity sequences after any legacy explicit-ID import.

Examples of current application/reference identity differences:

- Game team ID `red-bull` versus fact slug `red-bull-racing` (`lib/data/grid.ts:8`; fact seed `:102`).
- Game driver ID `verstappen` versus fact slug `max-verstappen` and numeric rating ID `7`.
- Workforce Newey ID `staff-adrian-newey` generated from full name versus market ID `staff-newey` (`lib/career/careerDefaults.ts:10`; `lib/career/paddockMarket.ts:459`).

### 3. Ratings, staff roles, and money disagree between the playable game and data sources

21 of the 22 F1 driver overall ratings in the hard-coded market differ from the workbook and matching SQL seed. Examples: Norris 94 in game versus 91 in the workbook/SQL; Russell 92 versus 86; Lindblad 79 versus 66. Only Verstappen's overall rating agrees. Other gameplay attributes may intentionally differ, but no selected balance version explains the divergence.

Evidence: `lib/career/paddockMarket.ts:55`, `:106`, `:293`; workbook `F1 2026 Drivers!U2:U23`; corresponding driver inserts in `20260910233000_seed_2026_driver_ratings.sql`.

The database salary column is explicitly USD millions. The app uses raw amounts and displays pounds in negotiations. Verstappen's seed contract is USD 70 million through 2030, while his hard-coded profile has 45 million per year and three years remaining. That is a second assumptions system, not a currency conversion.

Evidence: `20260910233000_seed_2026_driver_ratings.sql:1047`; `lib/career/paddockMarket.ts:44`, `:614`; workbook `F1 2026 Drivers!AD2:AG2`.

Staff facts and the static grid also disagree on named principals, including Audi and Cadillac. These are verifiable internal contradictions, not a claim about which current real-world appointment is correct. See `lib/data/grid.ts:14`, `:16` versus fact seed `:106`, `:109`. Newey appears as principal in workforce defaults and technical director in the market under separate IDs; the game needs one person with explicitly modeled assignments, including any allowed dual role.

Work required: choose and version one balanced starting dataset, decide the game's base currency and unit, derive age from DOB and game date, define skill mappings, and preserve whether each value is official fact, user estimate, or model-generated. Compare imports automatically. Avoid silently promoting estimated salaries or January-1 DOB fallbacks to facts.

### 4. The seed encodes cumulative career totals as a season's statistics

The workbook labels starts/wins/titles as career totals, but the ratings seed stores e.g. Verstappen's 233 starts and 71 wins under `season = 2026`. A consumer can reasonably misread those as 2026-only totals. The schema has no scope or as-of field to clarify this.

Evidence: workbook `F1 2026 Drivers!H1:J2`; `20260910233000_seed_2026_driver_ratings.sql:1133`–`1139`; `20260830233000_normalize_driver_schema.sql:122`–`138`.

Work required: distinguish `career_to_date` snapshots with an `as_of_date` from season/event statistics. Keep imported real-world history separate from simulated career results, then derive totals consistently.

### 5. Seed updates can erase history and are not a safe refresh mechanism

The latest seed deletes every contract for each driver before inserting one baseline contract, rather than updating a uniquely identified reference contract. Rating-history inserts append without a dataset/season uniqueness key, so manual replay can duplicate baselines. These are migration behaviors, not evidence of actual data loss.

Evidence: `20260910233000_seed_2026_driver_ratings.sql:1044`–`1051`, `:1288`; `20260830233000_normalize_driver_schema.sql:140`–`165`.

Work required: make reference imports repeatable by stable source/version keys. Preserve contract and rating history. Never apply a catalogue refresh directly to mutable career contracts. Validate before replacing a published dataset.

### 6. Reference tables contain large amounts of uncalibrated default gameplay state

The expanded teams/tracks tables have many ratings defaulting to 50 and financial values defaulting to zero. The staff migration adds 15 skill values defaulting to 50 but has no staff seed. The repository does not establish that the actual database contains differentiated, calibrated values for these fields. These defaults should not be presented as researched attributes.

Evidence: `20260831001000_expand_teams_schema.sql:35`, `:56`, `:244`; `20260831003000_expand_and_seed_tracks.sql:38`–`70`; `20260830234500_add_staff_component_expertise.sql:1`–`17`.

Work required: seed only the attributes that implemented mechanics consume; identify uncalibrated values explicitly. Prefer smaller versioned balance tables over adding hundreds more optional columns to a single team row. Mutable team cash, season points, and investigations belong to a career, rather than shared global team facts.

### 7. Circuit data needs layout/version reconciliation

The circuit registry loads old licence-list lengths, and the subsequent race-facts migration uses `coalesce(existing, new)`, deliberately preserving conflicts. The game uses a separate map. For example, the database migration retains Marina Bay at 5.077 km, while its later race-facts input and game map use 4.940 km. Similar differences exist for Jeddah, Monaco, Spielberg, Silverstone, Las Vegas, and Lusail. This is dangerous input for future pace/distance calculations.

Evidence: `20260831130000_expand_track_registry.sql:21`–`29`; `20260831133000_fill_track_race_facts.sql:5`–`12`, `:18`, `:21`, `:23`, `:24`, `:31`, `:35`, `:36`; `lib/data/circuitFacts.ts:8`, `:11`, `:13`, `:14`, `:21`, `:25`, `:26`.

Madrid has null race laps and distance in both the reference seed and game circuit map (`20260831133000_fill_track_race_facts.sql:29`; `lib/data/circuitFacts.ts:19`). That is a real missing simulation input for a venue in the current generated calendar. Unknown data for venues that have never hosted F1 need not block the management game, provided those venues cannot accidentally become runnable races without a validated scenario configuration.

Work required: separate venue identity, circuit layout/version, event-specific lap count/distance, and historical licence evidence. Resolve conflicting source values field by field. Store verification/effective dates so an expired licence listing is not interpreted as current permission or as proof the real licence is expired.

### 8. Seasons and rules are not database-backed, versioned configurations

Careers start in 2027, but replay a generated 24-round template named `official-2026-order`. The calendar generation does not consume the database's future-event contracts or updated track registry. The schema stores event status flags on venues, not dated season rounds and sessions. Current points/ruleset labels live in TypeScript.

Evidence: `lib/career/types.ts:2`–`4`; `lib/career/calendar.ts:77`–`96`, `:152`; `lib/career/careerDefaults.ts:4`; `20260831140000_complete_track_reference_status.sql:18`–`47`.

Work required: explicitly select a factual historical season or a fictional generated future scenario. Add versioned season configuration with entry list, calendar, weekend format, points, tie-breaks, financial rules, and provenance. A generated future calendar can be valid gameplay, but should not imply that it is a confirmed real 2027 schedule.

### 9. Public read access is declared, but full policy/integrity coverage is unverified

Fact tables enable RLS and have permissive SELECT policies, which fits a public catalogue. Driver reference tables receive SELECT policies in the latest seed. The repository does not declare a comparable staff RLS policy or a tracks SELECT policy; those may exist in the uninspected live baseline. No owner-scoped career write policy exists because there is no cloud career schema.

Evidence: `20260831120000_create_and_seed_fact_reference_data.sql:214`; `20260831123000_allow_fact_reference_reads.sql:1`; `20260910233000_seed_2026_driver_ratings.sql:1531`; `20260831003000_expand_and_seed_tracks.sql:275`.

The driver/teams rating ranges lack the explicit 0–100 checks present on staff expertise; `driver_rating_history` lacks a unique baseline key; `series_entries.entrant_name` is not a foreign key; contracts allow null terms without a term-precision/provenance field. Existing live constraints could be broader than the committed files.

Work required: inspect effective policies/grants and constraints once connected. Public reference data should be readable and not publicly editable. If cloud saves are introduced, scope every save to its owner and test cross-user isolation and stale-revision handling. Add constraints to the selected canonical model, rather than trying to validate all legacy duplicates indefinitely.

## Proposed additions, in implementation order

These are logical entities; they do not all need separate SQL tables on day one. Keep the current career aggregate for local play, with strict schema validation. A cloud save can initially store a versioned JSON snapshot plus ownership/revision metadata. Normalize mutable state into additional database tables only when queries, multiplayer, or synchronization require it.

| Priority | Entity/data | Minimum useful fields and behavior |
| --- | --- | --- |
| Foundation | `reference_dataset_versions` | ID, base season, fact cut-off date, balance version, schema version, checksum, published status. Pin each new career to one immutable version. |
| Foundation | Canonical people/teams and mappings | Stable unique IDs/slugs, legacy-ID mappings, `person_id`/`team_id` relationships, source and value precision. Prevent duplicate real people across workforce/market. |
| Foundation | `season_entries` and roster slots | Dataset, season, team, person, role/seat, car number, effective interval. Validate two race seats per F1 team and uniqueness of active driver seats. |
| Main game | Driver/staff balance profiles | Dataset, person, skills, potential, development/decline profile, reputation, morale defaults, role suitability and availability. Connect real reserves/F2/F3 people to recruitment profiles or use clearly marked generated alternatives. |
| Main game | Staff roles and employment | Role definitions, slot limits, assignment dates, salary, renewal/expiry, buyout, bonuses, component expertise. Populate enough roles for every playable team and a useful hiring pool. |
| Main game | Team starting conditions | Dataset/team, opening funds, debt, operating costs, board goals, facility levels, current car/design values, suppliers, staff capacity, rival decision preferences. Give all 11 teams coherent starting conditions. |
| Main game | Currency/finance rules | Base currency, storage unit, cost-category treatment, budget cap assumptions, payroll cadence, prize distribution version, payment schedules. Use integer minor units or a deliberate precise decimal policy. |
| Main game | Career state and action journal | Career ID, dataset ID, schema version, revision, clock, world state, processed action IDs, timestamps, recovery snapshots. Actions that change cash and contracts must commit together. |
| Main game | Contracts/negotiations | Person/team/role, start/end dates, guaranteed pay, bonuses, release/termination terms, offer status/expiry, scheduled future assignment. Distinguish reference estimate from simulated agreement. |
| Main game | Sponsors/board objectives | Definition IDs, slots and exclusivity, period, target condition, guaranteed/conditional amounts, obligations, evaluation state, payment IDs. Link promised money to the finance ledger. |
| Main game | Facilities/development/manufacturing | Capacity, assigned workforce, queued projects, progress, costs/commitments, design versions, finished parts/inventory, installation/condition, research carryover. Read from the same state the UI displays. |
| Main game | Scouting/progression/AI | Reports and uncertainty, academy affiliation, eligibility, development events, retirement/newgen rules, rival budgets/contracts/projects. Keep real facts and generated careers distinguishable. |
| Main game | Season history/results | Stable result/event IDs, official classification, points breakdown, result finality, team at event time, archives, career-stat scope. Use deterministic test results to validate seasons while the live simulator is deferred. |
| Before simulation | Versioned competition configuration | Calendar rounds/sessions, venue-layout IDs, session format, scoring/tie-break rules, applicable financial/sporting assumptions. Keep provenance and effective season. |
| Final addition | Circuit and simulation balance | Layout lengths/sections, validated race/sprint distances, pit loss, tyre models, weather profiles, degradation/incident parameters, performance model and engine versions. |
| Final addition | Race session/checkpoint data | Frozen entrants/ratings/car/setup/strategy, random seed and RNG state, session inputs, deterministic tick/checkpoint, command log, telemetry, classification, result-processing outbox. |
| Final addition | Race-control records | Neutralisation/red-flag/restart state, incident/steward investigations, penalties and serving status, grid changes, infringements, lap deletion, time adjustments, final result version. Separate the player's strategic commands from the sporting authority's decisions. |

Detailed FIA rules should be researched and versioned for the chosen ruleset before race-control implementation. The core-management phase can establish the data contract now and defer the simulation behavior, telemetry, track detail, and race-control interface until the rest of the career works.

## Concrete database/data completion checks

1. Restore readable access to the intended database and record the actual migration state without mutating it.
2. Inspect table/column definitions, foreign keys, indexes, grants, RLS policies and sequence state. Reconcile them against the repository.
3. Run paginated counts and null/duplicate/orphan reports for every reference table; distinguish a zero-row SELECT caused by permissions from an empty table.
4. Rebuild a disposable database using the committed baseline and seed set. Repeat the supported seed-refresh process and confirm row counts do not grow unexpectedly and histories are retained.
5. Validate the chosen starting dataset: 11 teams, 22 unique race seats, every required person/profile linked, no unmatched team IDs, all required rating values in range, enough staff to fill declared slots, coherent contracts and currency.
6. Reconcile the 440 workbook rating values and resolve the 21 overall-rating differences explicitly. Record intentional changes as a new balance version.
7. Validate every playable calendar round against an event/layout configuration. Resolve Madrid's distance inputs before it can run a simulation. Resolve the known track-length conflicts.
8. Create careers for all 11 teams from the same validated dataset and confirm changes to that catalogue cannot alter existing saves.
9. Complete management actions and a full synthetic-results season, save/reload it, roll into the next season, and confirm rosters, ledger, payments, development, standings, and histories reconcile.
10. Only after these checks pass, add live simulation and race control, using the existing session input/output boundary and an expanded immutable snapshot rather than reading changing catalogue rows during a race.

No application code, workbook data, SQL migration, or database row was changed during this audit.
