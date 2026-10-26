# Live driver-contract database audit

Checked: 25 October 2026 at 18:37 UTC. Read-only Supabase REST queries using the existing public client. No database or game changes applied.

This supersedes the connection limitation in the earlier database audit for the tables checked here. It does not verify the entire deployed schema or real-world contract accuracy.

## Live coverage

| Data | Visible rows | Contract relevance |
| --- | ---: | --- |
| People | 109 | Reference identities; 84 distinct drivers appear in series entries. |
| Series entries | 86 | All for 2026: 22 F1 race, 12 F1 reserve assignments, 22 F2 and 30 F3. |
| Driver gameplay records | 22 | F1 race drivers only; no `person_id` reference column. |
| Teams / team facts | 11 / 11 | Numeric IDs and slugs agree in the current visible rows. |
| Driver contracts | 22 | One per F1 race driver; two per team. |
| Career stats / rating history | 22 / 22 | Separate records, not proof of contract terms. |
| Team staff assignments | 25 | Outside this first driver-contract pass. |

All nine table reads succeeded without pagination truncation. A relationship query embedding `drivers(id)` and `teams(id)` inside contracts also succeeded. Full REST schema discovery returned HTTP 401, so actual unique/check constraints, all RLS policies, migration history and write access have not been comprehensively inspected. No write probes were attempted.

## What the contract table actually contains

`id`, `driver_id`, `team_id`, `start_year`, `end_year`, `base_salary_usd_millions`, `bonus_clause_strength`, `status`, `created_at`, `updated_at`, `salary_tier_code`.

All fields are populated in the 22 visible rows. All statuses are `active`; all creation timestamps are 10 September 2026 at 22:40:39 UTC. Observed data has no missing driver/team references, mismatched contract versus driver teams, reversed year intervals or negative salaries. This checks current data, not every future database write.

## Issues to resolve

1. **2026 reference data versus a 2027 career.** Four imported agreements end in 2026: Fernando Alonso, Liam Lawson, Esteban Ocon and Oliver Bearman. Twelve end in 2027, three in 2028 and three in 2030. `active` is a stored label, not proof of validity on the game date. Do not silently extend the four agreements or remove those drivers from the current generated lineup.
2. **Contract terms lack provenance.** There are no source, verification/as-of, certainty or field-level provenance columns on contracts. Filled salaries and expiry years are imported values, not verified facts. The local ratings migration describes a spreadsheet import and uses these same fields; its presence does not validate them against current official announcements.
3. **Start years are not sufficient contract history.** There is one row per driver and only year precision. Some rows cover many seasons; neither a signature date nor a sequence of renewals can be established. Do not interpret this as the date the currently applicable agreement was signed.
4. **Three identity namespaces.** Gameplay driver numeric IDs currently match `people` numeric IDs and names after accent normalization, but no `drivers.person_id` field records that relationship. Career IDs use slugs such as `verstappen`; people use `max-verstappen`. Career `red-bull` differs from database `red-bull-racing`. Add explicit mappings rather than relying on insertion order or name matching at runtime.
5. **No complete candidate contract catalogue.** The 62 other distinct driver people in entries have no corresponding gameplay-driver/contract coverage. Missing contracts do not establish free-agent status, eligibility or availability. Reserve assignments also do not establish race-seat availability.
6. **No seat or negotiated terms.** No race seat/reserve role, agreement version, signing date, effective date, future activation, exact bonuses, release clauses, options or offer history are recorded. `bonus_clause_strength` is a score, not a payable bonus amount.
7. **No career ownership/snapshot on these contracts.** Reference rows have no career identifier. Player actions must not overwrite this global catalogue. The game currently uses local career workforce agreements with unknown salary/term, not these Supabase rows.
8. **Money unit mismatch with the old dormant code.** Reference salaries are USD millions. Earlier experimental screens used pounds and raw units. Use explicit USD minor units in career contracts; never relabel imported dollars as pounds.
9. **Unsafe historical import pattern.** The committed ratings migration deletes each driver's contracts before inserting its reference row. Future updates must preserve history and career snapshots instead of rerunning that pattern.
10. **Other database defaults are not ready-made systems.** The live teams table includes zero financial values, level-one facilities and repeated rating defaults. They must remain excluded from the stripped game, rather than being imported as validated gameplay settings.

## Imported agreement coverage

The following values are an audit of stored data only. Salaries and end years have not been reverified against real-world sources. Salary is annual USD millions as named by the database column.

| Driver | Team | Start year | End year | Imported annual USD m | Applies to 2027 by stored year range? |
| --- | --- | ---: | ---: | ---: | --- |
| Max Verstappen | Red Bull Racing | 2015 | 2030 | 70 | Yes — unverified terms |
| Isack Hadjar | Red Bull Racing | 2026 | 2027 | 5 | Yes — unverified terms |
| Charles Leclerc | Ferrari | 2019 | 2030 | 34 | Yes — unverified terms |
| Lewis Hamilton | Ferrari | 2025 | 2027 | 60 | Yes — unverified terms |
| George Russell | Mercedes | 2022 | 2027 | 34 | Yes — unverified terms |
| Kimi Antonelli | Mercedes | 2025 | 2027 | 2 | Yes — unverified terms |
| Lando Norris | McLaren | 2019 | 2030 | 30 | Yes — unverified terms |
| Oscar Piastri | McLaren | 2023 | 2028 | 13 | Yes — unverified terms |
| Fernando Alonso | Aston Martin | 2023 | 2026 | 20 | No |
| Lance Stroll | Aston Martin | 2017 | 2027 | 12 | Yes — unverified terms |
| Pierre Gasly | Alpine | 2023 | 2028 | 12 | Yes — unverified terms |
| Franco Colapinto | Alpine | 2024 | 2027 | 1 | Yes — unverified terms |
| Carlos Sainz | Williams | 2025 | 2028 | 30 | Yes — unverified terms |
| Alexander Albon | Williams | 2022 | 2027 | 15 | Yes — unverified terms |
| Liam Lawson | Racing Bulls | 2026 | 2026 | 1 | No |
| Arvid Lindblad | Racing Bulls | 2026 | 2027 | 1 | Yes — unverified terms |
| Esteban Ocon | Haas F1 Team | 2025 | 2026 | 7 | No |
| Oliver Bearman | Haas F1 Team | 2025 | 2026 | 1 | No |
| Nico HÃ¼lkenberg | Audi | 2025 | 2027 | 7 | Yes — unverified terms |
| Gabriel Bortoleto | Audi | 2025 | 2027 | 2 | Yes — unverified terms |
| Sergio PÃ©rez | Cadillac | 2026 | 2027 | 8 | Yes — unverified terms |
| Valtteri Bottas | Cadillac | 2026 | 2027 | 5 | Yes — unverified terms |

## Data work needed before implementation

- Establish explicit person/team/career-ID mappings and stable import keys.
- Add a versioned contract-reference model with sources, uncertainty and effective periods; keep legacy imports marked unverified.
- Reconcile the starting 2027 roster separately from 2026 reference contracts. An explicitly approved game scenario is acceptable; an invented real-world renewal is not.
- Define career-local agreements, seat commitments, offers, lifecycle events and history. Existing saves need a versioned snapshot, not a live overwrite.
- Represent unknown terms as null with a reason. Display them as **Not recorded**; unknown is neither zero salary nor expired nor available.
- Keep imported salary figures as unverified reference values until sourced or explicitly adopted as labelled game settings.

Detailed counts and the sanitized 22-row contract summary are in `DRIVER_CONTRACT_DATABASE_FINDINGS.json`. Proposed game rules are in `DRIVER_CONTRACT_RULES_PROPOSAL.md`. No migrations, contract activations, salary payments or gameplay features have been applied in this audit.
