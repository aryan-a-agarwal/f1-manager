# 2027 starting grid and contracts

Applied to the F1-manager Supabase project on 26 October 2026. Public API verification matched every contract against the checked-in export; see `STARTING_GRID_2027_VERIFICATION.json`.

## Starting roster

The dataset contains 22 race drivers: 19 seats classified as confirmed in the current grid snapshot, with Oliver Bearman, Liam Lawson and Arvid Lindblad retained by the user's explicit game assumption. Rafael Câmara replaces Esteban Ocon at Haas. There is also Leonardo Fornaroli's reserve agreement, and two reserve positions per team (21 vacant).

Source review:

- [Current 19-seat snapshot](https://www.gpfans.com/en/f1-news/1091731/f1-grid-2027-october-2026-three-seats-remaining/), dated 20 October 2026, identifies the three outstanding seats. The reported confirmed-seat classification is stored separately from the confidence in each underlying private contract term.
- [Haas announcement](https://www.haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027) confirms Câmara's multi-year arrival for 2027.
- [F1 contract overview](https://www.formula1.com/en/latest/article/f1-driver-contracts-from-max-verstappen-to-lewis-hamilton-how-long-do-the-drivers-current-deals-last.4ub4xFggoaKgzMCTZhdSXw) and the per-driver sources retained from the previous snapshot inform published term coverage. Its older Aston Martin section is superseded by the team announcement already recorded in the reference data.
- [Audi reporting of Binotto's confirmation](https://racingnews365.com/audi-confirm-2027-f1-driver-line-up) supplements the grid classification. Reported/undisclosed private terms remain labelled as such.
- [Câmara's preferred number](https://www.formula1.com/en/latest/article/new-haas-signing-camara-indicates-the-driver-number-hed-like-to-use-in-2027.2gYYicm5lswBpzkn5Wh2v0) informs the scenario's number 50; this is a game allocation pending an FIA entry list, not a claim of final official registration.

## Live tables

- `f1_starting_grid_datasets`: version metadata.
- `f1_starting_driver_contracts`: 23 contracts with identity, seat basis, original reference confidence/coverage, effective game seasons, annual USD cents and term/salary provenance.
- `f1_starting_team_slots`: 44 race/reserve positions, linked to the populated agreements.
- `f1_starting_grid_2027`: public read-only identity-joined view.

Version: `f1-2027-starting-grid-2026-10-26-v1`. Existing public reference rows, historic series entries and legacy contract imports remain unchanged. A private backup captures the previous reference state. RLS is enabled, public access is SELECT-only, and no client write privileges were added.

## Usable terms without inventing real-world facts

Known exact expiry years are retained. Undisclosed expiry is resolved as an explicit **game assumption**, stored alongside the original null/known-minimum reference fields. Game terms never shorten known minimum coverage. Opening contracts take effect in the 2027 scenario; this does not assert a real signing date or original contract start.

The three assumed continuations run through 2027. Other undisclosed game expiries are in the export: examples include Piastri through 2028, Leclerc through 2029 and Câmara through 2028. These are operational game settings, not claims about confidential deals. All 23 populated agreements carry the previously added annual game salary estimates, now in Supabase as well as the matching game export. No payroll or automatic payment system is enabled.

## Game integration and existing saves

The checked-in versioned export supplies team selection, starting workforce race lineups, opening race agreement seasons/salaries, initial championship entries and the saved contract desk. New saves start consistently offline, using exactly the verified database version. Future database edits require an explicit versioned export rather than silently changing an existing career.

Existing career lineups, results, snapshots, offers and reference baselines are retained. The old career shown in this chat is not restarted. Its contract desk explains that the updated grid applies to new saves. The original-layout header now uses saved lineup identities so old Haas careers do not incorrectly show Câmara replacing Ocon retrospectively. Contract planning uses resolved game expiries for new-scenario agreements, while old unresolved references keep their original warnings. Recruitment candidates from the live catalogue remain selectable and are captured only when drafted.

## Verification

`verify-starting-grid.cjs` tests the complete migration twice against isolated PostgreSQL with shuffled IDs: counts, data values, constraints, read-only public access, historical data preservation and rollback on a missing identity. `verify-live-starting-grid.cjs` checks every seeded term through anonymous Supabase REST reads without printing credentials.

Game regression tests cover the complete 22-driver mapping, exact and assumed terms, salary parity with the database export, no duplicate grid entries, reserve capacity, known-term draft conflicts and retaining existing save lineups. The full gameplay regression suite and production build are run for this update. Temporary substitutions, binding negotiations, automatic expiry/renewals and payroll remain separate features.
