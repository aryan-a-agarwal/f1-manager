# 2027 contract reference and reserve capacity

Status: applied to the F1-manager Supabase project on 25 October 2026, then verified through public REST reads and the signed-in SQL editor. This is a database/reference-data change, not an implementation of negotiation or a rewrite of existing local careers.

## What is live

- `f1_contract_reference_datasets`: one dated/versioned public-data snapshot for the 2027 baseline.
- `f1_driver_contract_facts`: 23 records: 22 race-driver candidates and Leonardo Fornaroli's confirmed 2027 reserve agreement.
- `driver_contracts_2027`: readable canonical view joining those records to person and team identities.
- `f1_team_driver_slots`: 44 slots, exactly two race slots and **two reserve slots for each of the 11 teams**, as requested.
- `f1_reserve_candidate_references`: 11 unique existing reserve people, deduplicated from 12 recorded 2026 assignments. These are not assumed free agents or automatically renewed 2027 appointees.
- `f1_contract_reference_backups`: private, RLS-protected copy of the prior contract and entry records.

All 22 old `driver_contracts` rows remain intact and gain the label `reference_quality = legacy_import_unverified`. They are retained as historical imports; their guessed salaries/expiry years are not promoted into the canonical 2027 view. Future contract screens should read `driver_contracts_2027`, not treat the legacy import as the authoritative starting dataset.

## Evidence and uncertainty

The snapshot contains 15 confirmed records (14 race plus one reserve), six reported race commitments and two unconfirmed Racing Bulls candidates. Only confirmed records populate the roster slots; uncertain records remain available for review without being converted into confirmed appointments. A roster slot's number is an administrative game position, not a claim of team hierarchy.

Private annual salaries, exact bonuses and undisclosed signature/start dates are null. A minimum confirmed season is separate from an exact expiry year: a driver's announced continuation into 2027 does not automatically mean their agreement ends in 2027. For example, Leclerc's previous imported 2030 expiry is not treated as a disclosed end date in the new view.

Newer team announcements take precedence over stale sections of roundup articles. In particular, both Aston Martin drivers are recorded for 2027 using the team's September announcement, and Rafael Câmara is included at Haas using its October announcement. Ocon's old Haas agreement remains historical; he has not been invented as a 2027 race driver or reserve.

Sources, checked 25 October 2026:

- [McLaren: Norris commitment through at least 2030](https://www.mclaren.com/racing/formula-1/2026/lando-norris-contract-extension-2030/).
- [McLaren: Piastri multi-year extension](https://www.mclaren.com/racing/formula-1/2025/mclaren-formula-1-team-announce-multi-year-contract-extension-with-oscar-piastri/).
- [F1: Verstappen extension](https://www.formula1.com/en/latest/article/verstappen-signs-contract-extension-with-red-bull-until-the-end-of-2030.4gUd8JEkYnKmD6bNMS5syw), [Hadjar retention](https://www.formula1.com/en/latest/article/red-bull-announce-new-deal-with-hadjar-for-2027-ahead-of-his-return-in-azerbaijan.3QcucG3BkfbWJNk4M5dWme).
- [F1: Leclerc extension](https://www.formula1.com/en/latest/article/ferrari-announce-new-multi-year-deal-with-leclerc-ahead-of-monaco-gp.5Mz0PYSKh0YT40Af4LEJdT), [Ferrari coverage including Hamilton](https://www.formula1.com/en/latest/article/analysis-why-leclerc-is-extending-his-stay-with-ferrari.5dWB81fvCO6W9CV4pqiF2N).
- [Williams: 2027 driver announcements](https://www.williamsf1.com/2027-driver-line-up).
- [Aston Martin: 2027 pair confirmed](https://www.astonmartinf1.com/api/news/announcement/lance-stroll-and-fernando-alonso-commit-to-aston-martin-aramco).
- [Haas: Câmara joins for 2027](https://www.haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027).
- [F1: Alpine's 2027 pair](https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq).
- [Audi reporting](https://www.grandprix.com/news/audi-confirms-hulkenberg-and-bortoleto-for-2027.html): labelled reported because the original press-conference evidence was not independently checked in this pass.
- [F1 contract roundup](https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw): uncertain language is retained as uncertainty, not a guaranteed contract.
- [McLaren: Fornaroli retains the F1 reserve role in 2027 alongside WEC](https://www.mclaren.com/racing/endurance/2026/leonardo-fornaroli-joins-mclaren-hypercar-team/).

The complete per-person values and source URLs are in `supabase/seed-data/2027-driver-contract-reference.json`.

## Reserve implementation rules

The two reserve positions are capacity, not a requirement to invent two real-world appointments for every constructor. McLaren's first reserve slot contains Fornaroli; its other slot and the other teams' unconfirmed reserve slots remain vacant. Existing candidates are labelled either `contracted_reserve_2027` or `unverified_2027`, never automatically available to hire.

When the game feature is implemented:

1. Add two nullable reserve IDs to each career team lineup, with separate reserve agreements and explicit effective seasons. Keep race entries distinct from reserve employment.
2. Let the player select eligible candidates for either reserve position through the approved contract flow; unknown terms are resolved explicitly, not supplied by filler defaults.
3. Permit documented shared reserve arrangements at reference level. At an actual event, enforce that a person can race for only one team and one car, and check cross-series date conflicts and release/priority arrangements.
4. Verify race eligibility/licence and event availability before promotion. A listed reserve is not automatically licensed, present or free from WEC/IndyCar duties.
5. Record temporary substitution on the event entry/snapshot. Keep the absent race driver's underlying contract and past results intact; restore the normal entry afterwards unless an explicit permanent transfer is agreed.
6. Keep negotiated salaries/payments disabled until the approved finance and contract-acceptance systems exist.

## Validation and application

Migration: `supabase/migrations/20261025190000_2027_contract_reference_and_reserve_slots.sql`.

An isolated PostgreSQL-compatible PGlite test ran the full migration twice with intentionally shuffled IDs. It verified identities by slug, preserved historical imports/private backup, slot counts, unknown salaries, confirmed-only assignments, public read-only permissions, prevention of a third reserve slot, and complete transaction rollback for missing identities.

Run the isolated checker with `node scripts/verify-2027-contract-reference.cjs <path-to-@electric-sql/pglite>`. The test runtime was installed in the machine's temporary directory; application dependencies were not changed.

Live REST reads returned HTTP 200 for all four public tables/views, and every seeded term was compared to its live counterpart. All 22 historical rows were compared field by field: contract terms remained unchanged; the added quality label triggered the database-managed updated_at timestamp. The private backup retains the original timestamps. Results are in `CONTRACT_REFERENCE_2027_VERIFICATION.json`.

The migration was executed through the SQL editor. The SQL is repeatable; future CLI migration-history reconciliation should account for this manual application before a bulk database push. This change did not update the game UI, activate transfers, modify existing local saves, or connect the basic simulator to the new roster.
