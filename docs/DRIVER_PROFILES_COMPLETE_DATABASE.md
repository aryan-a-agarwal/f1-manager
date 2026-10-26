# Complete database driver profiles

Profiles now read the connected Supabase driver tables rather than only the fact catalogue. The live audit is saved in `DRIVER_PROFILE_DATABASE_AUDIT.json` and can be repeated with `node scripts/audit-driver-profile-data.cjs`.

## Display coverage

- Identity: names, birth date, nationality, birthplace, debut, race number and source provenance.
- All 35 stored ability, technique, condition, development and commercial fields, grouped into five cards. Values are labelled as imported database snapshots, including defaults; they do not imply implemented career mechanics.
- Latest versioned starting agreements, each saved workforce agreement and published contract references, with salary units and assumption labels kept separate.
- Every recorded series entry, imported career totals, year/team history (starts, wins, podiums, poles, points, championship position, titles) and dated rating snapshot.
- Expandable complete records expose every returned column, including timestamps, IDs, nulls, source metadata, old contract versions, slot assignments and related dataset definitions. New columns automatically appear in this section.
- Historical imported contracts remain explicitly unverified. Historical season data has no attached verification source or cut-off date and is described as recorded data rather than independently verified statistics.

Legacy `drivers` and canonical `people` use separate identity spaces. Joining uses normalized full names with a birth-date conflict guard; statistics, salaries and rating histories then join through the actual legacy driver ID. Team IDs in legacy records resolve through `teams`, while canonical records use `f1_team_facts`. Unknown reserve ratings remain unrecorded.

Reference loading uses stable ordering and 500-row pagination, with partial failures reported while saved career data remains usable. All-field disclosures preserve zero, false, null and structured values. HTTPS source links remain clickable. Profile section shortcuts scroll without adding browser-history entries. Both game layouts use the same profile component and existing page-history arrows.

No database values, race results or save contracts were rewritten for this display change. Existing database ratings and history are now visible; this task does not independently re-research or invent missing facts.

## Validation

Production build and TypeScript checks; profile database tests covering identity collisions, birth-date conflicts, accents, relationship joins, field completeness, zero/null/boolean/object handling and salary units; existing profile-navigation, contract-desk and reserve suites. Browser checks against Supabase confirmed Norris's 47-field driver record, populated ratings, separate contract versions and history, and no reference-loading errors.

Final browser checks also confirmed Pato O’Ward's reserve agreement and salary with absent ratings left unknown. Section scrolling retained the profile URL and enabled back arrow. Screenshot: `ui-previews/driver-database-attributes.png`. The final production preview remains running at `http://localhost:3110`.

## Unallocated attributes

The normalization migration supplied defaults, while the 2026 ratings import did not allocate morale, fitness, form, marketability, reputation, development rate, adaptability, reactions, braking, cornering, smoothness or incident proneness. These 12 attributes now display **Unrated** with no rating bars, including in expanded driver records and rating-history records. Missing values in other rating fields also display Unrated. Explicitly imported ratings remain visible even when their score happens to equal a default such as 50. Status fields are not numeric ratings.

This is a presentation/allocation policy in `lib/driverProfileData.ts`; it does not rewrite database values or career simulation data. Deliberate future allocations must update that policy. Regression checks cover all 12 fields across null/50/70/100, genuine allocated scores and expanded records.
