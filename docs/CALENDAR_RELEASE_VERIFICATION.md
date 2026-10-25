# Calendar/time release verification

Implemented on 25 October 2026 following approval to implement and open the game.

## Delivered

- Versioned season profiles with configurable round dates, session offsets, sprint formats and venue timezones. The initial 24-round/six-sprint scenario is explicitly a generated schedule, not an official 2027 timetable.
- Shared calendar in both interface layouts: month and agenda views, category filters, selected weekend/session details, UTC/local session display, saved classifications and season archives.
- One chronological scheduler for Continue, day/week jumps, next weekend and quick simulation. Mandatory decisions and management interruptions are respected, including simultaneous and overdue events. Race sessions cannot be acknowledged away.
- Scheduled development and facility completion. Manufactured parts enter inventory; fitting is an explicit stock-consuming action.
- Schema 6 migration preserves existing dates, results, clock and career progress. Invalid saves offer recovery/export instead of silently creating a replacement; failed saves report an error.
- Explicit event consumers prevent championship scoring from discarding unrelated lifecycle events. Season rollover rebuilds the calendar and clears scheduler receipts.
- Original interface retained through the layout setting. Existing uncommitted project work was preserved.

## Validation

- All 14 automated suites passed; raw output is in `calendar-test-results.json`.
- Eight calendar integration scenarios passed, covering profiles/leap years/ordering, same-time and overdue events, interruption/decision integrity, project and facility equivalence across advancement paths, migration, storage failure, session acknowledgement protection, mid-weekend targeting and postponement/reload.
- Soak coverage: 20 seasons, 480 weekends and 2,400 sessions. Includes all 11 teams plus three-season runs for Ferrari, Audi and McLaren; checks points, IDs, archives, reload and rollover.
- Final production build and TypeScript check passed. A concurrent standalone type check briefly encountered Next regenerating its route-type files; rerunning after the completed build passed.
- Browser checks exercised both layouts, month/agenda navigation, sprint session details, required decisions, management interruptions during GP fast-forward, Australia completion, reload, the transition to China and the saved 22-driver Australian classification.
- Preview runs at `http://localhost:3110/game?section=season&view=races`.

## Boundaries

This verifies the calendar/time release, not completion of the entire management game. Contracts, annual economy, development capacity and rival-team management remain separate roadmap work. Detailed race simulation, pit-wall management and race-director mode remain the final stage as requested. Existing generated race outcomes still use the current quick simulation engine.

The local browser preview career was advanced through Australia during UI verification. The source checkpoint before implementation is `checkpoints/before-calendar-implementation.zip`; baseline test output is `calendar-baseline-tests.json`. No connected database seed or production data changes were made by this calendar release.

## Repeat checks

Run `npm test` for the full suite, `npm run test:calendar-integration` for focused integration checks, `npm run test:calendar-soak` for the multi-season run, and `npm run build` followed by `npx tsc --noEmit` for release validation.
