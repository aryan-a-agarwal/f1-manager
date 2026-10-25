# Approval plan: calendar/time system and integrated verification

Status: implemented following the user’s instruction to implement and open the game. See CALENDAR_RELEASE_VERIFICATION.md for delivered scope and validation.

This combines steps 1 and 6 of the calendar-first core-game plan. Step 6 means verification of this calendar/time release and regression protection for the existing game. It does not certify the still-unimplemented contracts, economy, development capacity or rival-management work from steps 2–5.

## Intended playable outcome

The player can browse a complete season, identify every normal/sprint weekend, inspect sessions and past results, and advance through the season using any time control. Management events cannot be skipped by a different advance button. Saving/reloading preserves the exact schedule, current session and pending decisions. Both interface layouts operate on the same career.

## 1. Establish a recoverable baseline

- Record the current working tree and preserve existing uncommitted work and both interface layouts.
- Run the current suites, type check and production build; record the baseline.
- Add outcome-level reproductions of calendar failures before fixing them: GP fast-forward bypass, same-time events, overdue blockers, mid-weekend next-weekend targeting, missing construction/project transitions and interrupted-session recovery.
- Keep unrelated known audit failures in a separate outstanding-issues list so a passing calendar release cannot be confused with a completed game audit.

## 2. Replace the fixed template with a versioned season profile

Retain the existing generated 2027 scenario as the initial profile: 24 rounds and six sprint weekends, explicitly labelled generated rather than an official 2027 timetable. Reuse the current venue/order data while moving assumptions into a named versioned profile.

Each round defines its circuit, round number, weekend identifier, start/end dates, standard/sprint format, venue timezone and individual sessions. Use template defaults plus per-event overrides, allowing different race days and session times. Session dates should not be inferred permanently from a single Sunday assumption.

Standard template: three practice sessions, qualifying and race. Sprint template: practice, sprint qualifying, sprint, qualifying and race. These are the initial game templates; any official year-specific profile must be checked against the applicable sources before being labelled official.

Include preseason, scheduled breaks and offseason boundaries as calendar metadata. Do not add extra racing/testing gameplay merely because a date exists.

Use one comparable timestamp for ordering. New profiles use explicitly labelled game/UTC times with venue-local display; retain existing save timestamps and ordering during migration instead of silently shifting old events to local time.

Validate unique IDs, round/session order, timestamp ranges, known circuits, format/session compatibility and schedule collisions. Calendar validation must no longer require every possible season to have exactly 24 rounds or every event to have five sessions unconditionally; validate against its selected profile.

Freeze the actual calendar and profile version in each save. Updating default profiles affects new careers, not played schedules.

**Deliverable:** profile definitions, builders and validators, with tests for normal/sprint events, overrides, invalid schedules, leap years and timezone/day-boundary behavior.

## 3. Build one chronological advancement service

Unify Continue, day/week advancement, next weekend, legacy calendar helpers, individual-session simulation and whole-weekend simulation behind the same calendar/event processing path.

The processor must:

1. Collect pending sessions, preparation milestones, management events and existing timed work.
2. Process due work in chronological order, with stable priority/ID ordering for simultaneous events.
3. Stop at mandatory decisions and required sessions; optional stops honour user settings.
4. Handle events at the current timestamp and overdue unresolved events without moving the clock backwards.
5. Remember applied consequences so save/reload or a repeated command cannot apply them twice.
6. Return a clear outcome: reached target, action required, session ready, season complete or error.
7. Detect a lack of progress and stop with a recoverable error instead of looping.

Define controls precisely:

- **Continue:** next required/configured stop, processing intervening work.
- **Next day:** same game-clock time on the following day, stopping earlier for a blocker. Update labels so it is not incorrectly described as 24 hours while jumping to 09:00.
- **Next week:** seven days from the current game time, with the same stop rules.
- **Next race weekend:** next required session of the current incomplete weekend, otherwise the next scheduled weekend; never target a completed session in the past.
- **Simulate session/weekend:** use the existing simple results engine, but stop and preserve progress if intervening management action is required. Already completed sessions are not rerun.

Separate message acknowledgement from actual required decisions. Connect existing decision state to its blocker and reject repeated resolution. This is the scheduler integration needed here; implementing missing contractual/financial effects remains later work.

**Deliverable:** shared scheduler with compatibility adapters for current callers and updated UI handling for stopped/partial progress.

## 4. Connect the existing timed work and result boundary

The unified calendar must not claim work finished while leaving the saved state behind it unchanged.

- Apply existing project phase transitions through their completion function; prevent the current path that marks a project complete before creating its inventory output.
- Apply existing facility-construction completion when its due date is reached.
- Show these dates in the agenda and create completion notices without duplicate effects.
- Do not redesign engineering capacity, parts economics, staff bonuses, payroll, sponsorship settlement or AI in this release.
- Give result processing explicit ownership. Scoring must not acknowledge events intended for other consumers. Track the receipts needed by implemented processors and retain unknown/unhandled work.
- Preserve current standard/sprint scoring and original result snapshots.
- Keep cancellation/postponement in explicit valid states and preserve ordering. Ordinary calendar browsing does not give the player arbitrary powers to cancel official events; full race-director controls remain later work.

**Deliverable:** reliable scheduling connections for existing features, with focused regressions for duplicate and omitted completion.

## 5. Deliver the calendar UI in both layouts

Under Season → Calendar in the management layout, and Calendar in the original layout:

- Season overview with month navigation and a readable month grid.
- Agenda/list view for dense schedules and smaller screens.
- Mark normal weekends, sprint weekends, breaks, the current date and next required action.
- Filters for racing, management decisions, development and facilities.
- Selecting a weekend opens its detailed session schedule, format, timestamps and states.
- Selecting a management item shows its reason, due date/status and the relevant existing action screen.
- Completed weekends expose saved session classifications/results without changing the current active weekend.
- Factory timeline and team agenda use the same underlying dates and status as the main calendar.
- Empty, failed and completed-season states have explicit messages and actions.

Use the shared calendar component beneath the existing switchable shells. Preserve original layout appearance through scoped styling. Show time basis clearly and do not let the user's computer timezone change saved event order.

**Deliverable:** an end-to-end calendar workflow with useful past and future event navigation.

## 6. Migrate and protect existing careers

- Introduce an explicit save-schema migration for profile metadata, calendar timestamps and scheduler receipts as required.
- Preserve existing career identity, selected team, dates, completed results, points, contracts, money and user preferences.
- Preserve original round/session IDs and played dates so results and blockers keep their references.
- Do not regenerate a partially played calendar from new defaults.
- Infer completion receipts only from explicit historical evidence; do not replay rewards or completion output to guess missing history.
- If ambiguous legacy state cannot be repaired safely, retain the backup and present an actionable explanation rather than fabricate history or reset the career.
- Validate the affected nested calendar/event structures and references before accepting imports or saving transitions.
- If a save fails, keep the last valid persisted state and show a recoverable error; do not silently report that progression was saved.

**Deliverable:** tested migrations, validation and save/reload/recovery behavior for calendar workflows.

## 7. Verification matrix and acceptance gate

### Automated calendar/integration checks

| Scenario | Required outcome |
| --- | --- |
| New season | Every configured race has the expected dates, format and ordered sessions |
| Standard/sprint weekend | Correct template, valid progression, expected initial scoring and archive |
| Different advance modes | Equivalent business/calendar state at the same target, allowing for stop acknowledgements and save metadata |
| Mandatory decision before a GP | All modes stop before bypassing it |
| Two blockers at the same minute | Resolve one; the other is still presented without advancing time |
| Overdue event | Resolve/present it without turning time backwards or losing it |
| Mid-weekend advancement | Targets the next unresolved session and cannot hang |
| Non-blocking project/construction due en route | Completes exactly once, including fast-forward |
| Repeated result/completion request | No duplicated points, inventory or processed consequences |
| Engine error/interruption | Recoverable session state; reload cannot silently discard or duplicate results |
| Legacy/partial-season save | Original IDs, dates, results, points and current action are preserved |
| Invalid import/storage failure | Explicit recovery path; no silent career reset |
| Calendar rollover | New-year dates/IDs and calendar events; previous calendar/results remain archived |

Run one complete calendar season across all 11 constructors. Run three consecutive calendar seasons for representative teams, checking date progression, archives, IDs and save/reload. This is a calendar soak; it deliberately does not claim that old finances, driver contracts or AI now have a complete annual lifecycle.

### Browser checks

In both layouts: start/resume career, switch calendar views/months, filter events, open a sprint weekend, advance into a blocking event, resolve it through its existing workflow, run a session, inspect completed results, reload mid-weekend and change layouts without altering the career. Verify keyboard access and laptop/narrow-width layouts.

Run all existing calibration suites, new targeted tests, TypeScript checking and a production build. Fix regressions introduced by this work; report pre-existing unrelated failures separately and keep them visible in the backlog.

**Acceptance gate:** all in-scope scenarios pass, the UI tells the truth about calendar state, saves remain compatible, neither layout is lost, and the verification report states precisely what was and was not checked.

## Planned code areas

- `lib/career/calendar.ts`, `gameTime.ts`, `timeline.ts`, `weekend.ts`, `calendarPersistence.ts`: shared scheduling and progression.
- New season-profile and scheduler modules as needed to avoid creating another oversized file.
- `types.ts`, `validation.ts`, `storage.ts`: explicit persisted state and migration/recovery.
- `scoring.ts`, and minimal project/facility/decision integration hooks: effect ownership and timed transitions.
- A shared calendar feature component extracted from `app/game/page.tsx`; navigation mapping and scoped styles for both layouts.
- `calibration/` and test commands: focused regressions and calendar-season runners.

No database writes are required for this release. Existing bundled reference data supports calendar work while hosted-database connectivity remains unresolved. Official-calendar import, live database repair, contract rework, a complete financial lifecycle, detailed race simulation and both race-control experiences remain tracked follow-up work.

## Delivery order after approval

1. Baseline and failing regressions.
2. Season profiles, calendar validation and save migration structure.
3. Shared advancement service and integrations.
4. Calendar/results UI in both layouts.
5. Migration, browser and multi-season verification; resolve in-scope failures.
6. Deliver changed-file summary, test evidence, screenshots and remaining issues.

Approval covers this bounded calendar/time implementation and its verification. Implementation starts only after the user approves.
