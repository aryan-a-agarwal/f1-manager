# Management reset

This supersedes the earlier cleanup's decision to retain assumed management resources. The user requested removing these systems from the active game so they can be implemented individually.

## Active game

- Removed the old car attributes, parts, development, facilities, power-unit and ATR page implementations.
- Removed commercial budgets, cost caps, sponsorship, merchandise, prize estimates and their actions from the interface.
- Removed driver/staff scouting, negotiations, assumed contract values, skills, mental ratings and marketability from the interface.
- Removed meeting allocations, strategy selectors, invented board governance and unused management stop configuration.
- Retained the navigation and both layout designs. Unbuilt pages have a plain empty state; the driver page shows lineup names and car numbers only.
- Removed financial/development/sponsor metrics from headquarters and the original header.

## Careers

New careers contain the season core without `comms`, `commercial`, `finance`, `carDev`, `facilities`, `market` or `weekendSim` state. Loading a career no longer calls the initializers for those systems.

Schema 8 removes those optional systems and their projects/events from older active saves. It clears management interruptions while retaining any current race-session interruption. The normal migration backup retains the previous raw save. Calendar dates, team selection, workforce identity/lineups, race operations, standings, results and season archives remain intact. No Supabase records are deleted or changed.

The underlying experimental management modules remain in source control for reference, with explicit test scenarios. They are not exposed as implemented gameplay. Calendar/session orchestration and the existing basic quick simulator remain; detailed race simulation and both race-control modes are still future work.

## Verification

- All 15 suites passed, including the season soak and fresh/legacy stripped-career checks.
- Production build and TypeScript check passed.
- Browser checks confirmed empty car, facilities, powertrain, commercial and scouting pages; a lineup without invented ratings/contracts; and the same empty pages in the original layout.
- Game preview refreshed and left at the facilities page on port 3110.
