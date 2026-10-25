# Audit verification record

Date: 25 October 2026. Tested the current working tree, including existing uncommitted changes.

## Automated checks

All 12 package test scripts exited successfully. Individual command stdout/stderr is preserved in [audit-test-results.json](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-test-results.json).

Type check: `node node_modules/typescript/bin/tsc --noEmit --incremental false` — passed.

Production build: `node node_modules/next/dist/bin/next build` — passed; routes `/`, `/setup`, `/game` and the not-found route were generated. `/game` reported 209 kB first-load JavaScript. Build warning: the installed Supabase client warns that Node 20 and below are deprecated. No package updates were performed.

The first sandboxed Node invocations failed during module-path resolution with EPERM, before executing tests. A permitted execution outside that restriction ran the tests/check/build successfully. The results JSON contains the successful rerun, not the environment-only failures.

Targeted in-memory probes confirmed seven failures that the current passing suites do not cover. See the management notes for inputs, outcomes and source locations. The temporary probe source was removed after inspection; no production code was changed.

## Browser smoke check

Started the production server on port 3107 and used an agent-created background browser tab with a fresh origin-specific career. Other development-port saves were not used.

1. Setup displayed 11 team choices; Ferrari selection and confirmation created the career.
2. Initial header showed £54m and 4 January 2027; Home's finances card showed the static $142m.
3. Continue advanced to a technical meeting on 12 January; acknowledgement unblocked the clock.
4. The Race Centre could simulate the entire Australian GP. Time moved to 14 March and the page immediately switched to round two, China.
5. Standings showed Red Bull 25, Ferrari 23, McLaren 22, Aston Martin 12, Williams 10, Alpine 7 and Mercedes 2 points; remaining teams had zero. These sum to 101 constructor points.
6. Home still showed “Pre-season” and “No points awarded”, as well as the static $142m card. The header showed the actual career date and £54m. The screenshot below records that state. Header labels/controls also overlap at the captured 1280px width.
7. Reload preserved the career date and next-event progression. It did not correct the stale Home copy.
8. Database loaded then displayed `Database unavailable: TypeError: Failed to fetch`, consistent with the independent read-only DNS failure.

![Dashboard after completing the first GP](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-dashboard-after-race.png)

This was a targeted smoke check, not an exhaustive browser test of every control, team or multi-season scenario. The management defects were investigated separately with source tracing and in-memory reproduction.

## Database and external references

No live database inspection succeeded: the configured hosted endpoint returned ENOTFOUND. The database report distinguishes local migration/workbook evidence from unverified deployed state. No remote writes were attempted.

IPL-Simulator was read-only. Its existing graph helped locate source, then current code was inspected; its test suite was not run.

FIA/F1 references used for season-rule cautions are linked in the main roadmap. The current financial PDF was retrieved, while linked 2027 sporting/technical PDFs failed to load. No detailed 2027 values are inferred from that failed retrieval.
