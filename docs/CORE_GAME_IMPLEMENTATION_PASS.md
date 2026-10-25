# Calendar-first core game implementation pass

Proposed execution order following the project audit and the user's calendar-first direction. This document plans implementation; it does not mark the items complete.

## Outcome

One coordinated core-management release, developed through small verified checkpoints. A player can start a career, progress through a complete calendar, manage current/future contracts and spending, complete upgrades, finish a season and continue into another year. Detailed race simulation, pit-wall control and race-director mode follow after this core works.

The new management interface remains the default. The original F1 layout remains selectable. Both interfaces use the same underlying career and commands.

## Checkpoint 1: season calendar and shared time processing

The existing calendar already generates 24 rounds, assigns ISO weekends and identifies six sprint events. It is a generated 2027 career schedule based on a 2026 template, with common session times and Friday-to-Sunday assumptions. Keep the useful structure and make it configurable and operationally reliable.

### Calendar model

- Versioned season profile with an explicit official/generated status, circuit IDs, round ordering, weekend dates, session dates/times and weekend format.
- Explicit standard and sprint session templates; allow event-specific session/day overrides instead of assuming all events have identical timing.
- Store a single comparable game timestamp and retain venue timezone/local display information; decide explicitly how the existing game clock maps to these timestamps.
- Include preseason, breaks and offseason boundaries. Calendar views should also show management deadlines and work completion dates.
- Validate session order, unique IDs, date bounds, missing circuit references and collisions. Cancellation/postponement must have defined states and cannot silently corrupt the sequence.
- Freeze the generated/imported schedule in each save. Updating a reference calendar must not reschedule an existing played career.

### Time processing

- One service handles Continue, next day/week, next weekend, individual-session progression and entire-weekend progression.
- Process all intervening due events chronologically. Handle multiple events at one timestamp and overdue unresolved decisions explicitly.
- Stop at mandatory decisions and session boundaries. Acknowledging a message is distinct from making its required decision.
- Give each durable consequence a stable identity so retry/reload cannot repeat it.
- Give scoring, finance, sponsor and other result consumers separate processing receipts, or commit all consequences together. The current scoring consumer must not mark other consumers' work complete.
- Add progress guards and clear stopped/completed/error outcomes.

### Playable calendar UI

- Month/week/agenda views or equivalent useful date navigation; clearly identify the next event and highlight race/sprint weekends.
- Selecting an event shows the full weekend and each session's actual date, format and status.
- View completed weekend results and history as well as upcoming events.
- Show mandatory decisions and management work beside racing events; Continue takes the player to the action that is blocking progress.

**Gate:** a standard and sprint weekend can be traversed; every advance mode respects the same blockers; day-by-day and fast-forward reach equivalent management state; same-time events are not lost; save/reload preserves schedules, blockers and completion; both interfaces remain usable.

## Checkpoint 2: driver contracts, assignments and payroll

- Reconcile driver identity across reference data, market, workforce, contracts, lineup, session participants and championship entrants.
- Represent active and future contracts explicitly: effective date/season, expiry, seat/role, salary, bonuses, buyout and negotiation status.
- Validate a transfer before committing any payment or assignment. Release the outgoing driver and account for the selling team's replacement or fail cleanly.
- Enforce one exclusive seat per driver and a valid team lineup. Support reserve roles separately.
- Register new championship entrants while preserving historical driver and constructor points using each result's team snapshot.
- Schedule contract-expiry warnings, offer deadlines, future-contract activation and payroll through checkpoint 1's time service.
- Make the contract page explain what is agreed, when it becomes active and what it costs.

**Gate:** a successful signing updates every relevant representation; an invalid signing changes nothing; a future signing activates on the right date; salaries settle once; replacement drivers can score; all screens agree after reload.

## Checkpoint 3: dependable money, sponsors and decisions

- Use one reconciled ledger for spending and income, with separate cash and cost-cap classifications.
- Process payroll, facility upkeep, supplier charges, sponsor schedules and basic performance payments through the calendar.
- Make email decisions apply their stated cost, income, contract or resource effects once.
- Add affordability/commitment rules and actionable warnings.
- Derive financial forecasts from actual obligations rather than fixed display estimates.
- Pin the rules/balance/currency profile; official regulations and estimated commercial figures need distinct provenance.

**Gate:** opening cash plus ledger movements equals cash; no duplicate settlements; displayed choices match their actual effects; daily advancement and jumps produce equivalent balances.

## Checkpoint 4: development and facility completion

- Use the same scheduler for design, production, testing and construction.
- Completing a project creates its manufactured inventory batch exactly once; installation is a separate operation.
- Track quantities, spares and per-car fitment; recompute performance consistently and prevent repeated gain stacking.
- Reserve/release engineers and manufacturing capacity; apply facility and staff effects to operational work.
- Complete facilities on their scheduled date, settle upkeep and refresh ATR by dated period.

**Gate:** a paid project finishes on schedule, produces usable parts, can be installed correctly, and consumes the correct resources. Facility completion changes capacity; retrying completion cannot duplicate inventory or expenditure.

## Checkpoint 5: season completion and a functioning paddock

- Explicitly close and open the season across finance, contracts, events, ATR, commercial, objectives and development.
- Settle year-end awards once, activate future agreements, age/progress people and preserve immutable archives.
- Add basic rival staffing/recruitment and development using valid budgets and resource limits; maintain full entries.
- Provide a minimum progression/retirement/prospect pipeline for continued seasons.
- Retain a simple provisional result adapter, consuming current driver/car state, to test the sporting consequences of management decisions.

**Gate:** three seasons complete without manual edits, stale-year dates, duplicate payments, missing entrants or corrupted archives. A save resumes correctly across offseason transitions.

## Checkpoint 6: core-release verification

- Test the complete player journey in both selectable layouts, including save/reload at decisions and season boundaries.
- Add focused regressions for the audit failures; cover business outcomes rather than only helper return values.
- Run the existing calibration suites, type checking and production build.
- Check finance reconciliation, unique assignments, championship totals, exactly-once processing and calendar consistency.
- Test representative starting teams and run the three-season soak through all constructors where practical.
- Verify old saves migrate without discarding completed races, rewriting historical dates or recreating the career.
- Reconcile the database baseline/IDs/reference pack as required by these checkpoints. A bundled validated reference pack keeps development and local play independent of the presently unreachable hosted database.

**Gate:** the management release is usable and repeatable. Remaining unimplemented scope is explicitly tracked, not marked complete because its UI exists.

## Final additions after the core release

Build and calibrate the detailed headless race engine, then connect both the pit wall and race-director mode to its shared state/rules/event stream. These systems should consume stable career snapshots and return results through the same scoring, finance and calendar boundaries established above.

## How to keep the large pass controlled

Record a recoverable working-state baseline and preserve existing work. Establish the shared event/identity/save contracts first. Deliver each checkpoint as a small reviewable change, fix its blocking regressions before expanding scope, and retain a runnable build throughout. Each checkpoint includes its actual management UI, save migration and outcome-level verification. Finish with one integrated release rather than accumulating disconnected helpers.

The first implementation batch is checkpoint 1: **calendar + weekend formats + shared time processing**. The next is checkpoint 2: **contracts + lineup integrity + scheduled payroll**.
