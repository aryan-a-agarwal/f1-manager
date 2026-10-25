# Management engine audit — 25 October 2026

This is an evidence supplement for the project audit, based on the current working tree. It separates working scaffolding from integrated gameplay. No production source was changed. The targeted reproductions below used new careers and an in-memory `CareerStorage`, never a browser save or live database. Full build and calibration execution were handled separately by the lead audit.

## Overall assessment

The project has a useful foundation: versioned career saves and migration, a calendar, session attempts and recovery, participant snapshots, an outbox, championship scoring, season archives, workforce lineups, and management screens backed by typed state. The main obstacle is integration. Several systems have attractive data and isolated command functions, but their consequences are not processed by time advancement, results, or season rollover.

The existing `GAME_DESIGN_PLAN.md` marks all eight systems and the season runner completed. Those labels describe implemented interfaces/helpers more accurately than completed gameplay. They should be replaced by separate statuses for data model, command logic, event integration, UI workflow, and end-to-end acceptance.

## Reproduced blockers

### 1. Buying a rival driver can spend money without changing the racing lineup

- Evidence: `lib/career/paddockMarket.ts:638` pays the buyout; `:655` attempts `appointDriver`; `:663` catches and discards all errors; `:686` changes the market team; `:706` returns accepted. `lib/career/workforce.ts:28` refuses drivers already seated elsewhere.
- Reproduction: create Ferrari; offer Piastri £22M/year, three years, equal status, seat two, using in-memory storage.
- Observed: accepted `true`, £28M paid, market team `ferrari`; actual Piastri lineup still `mclaren`, Ferrari still `[leclerc, hamilton]`.
- In-season offers also always pass the current year (`paddockMarket.ts:660`), although `workforce.ts:6` only permits next-year appointments after the first snapshot. That error is swallowed by the same catch.
- Required fix: model an agreed effective date/season, outgoing driver release and source-team replacement. Validate the entire transaction before committing money, agreements, market state and lineups. Failed appointments must leave all state unchanged and report the reason.

### 2. A signed free agent can race but cannot appear in the driver's championship

- Evidence: `lib/career/workforce.ts:36` returns a career with only workforce updated; `lib/career/createCareer.ts:45` creates championship rows once; `lib/career/scoring.ts:26` updates existing driver rows with `map`, never adding a newly registered driver.
- Reproduction: sign free-agent Tsunoda to Ferrari seat two before the first weekend; run one weekend with a valid test session engine placing him first.
- Observed: Ferrari lineup becomes `[leclerc, tsunoda]`, championship still contains Hamilton and excludes Tsunoda. Constructor total is 101 points, driver total is 76 points: the winner's 25 points disappear.
- Required fix: distinguish season championship eligibility from current seat ownership, add entrants on registration, preserve historical driver points, and assign constructor points using each result's frozen participant snapshot. Assert matching aggregate awarded driver/constructor points.

### 3. Quick weekend progression bypasses the management calendar

- Evidence: `lib/career/weekend.ts:208` advances using only weekend milestones, while `:238` and `:276` loop that path for quick simulation. `lib/career/gameTime.ts:132` saves the new clock without running management processors.
- Reproduction: call `simulateEntireWeekend` for round one directly from a new career.
- Observed: clock reaches 14 March 2027, mandatory FIA event dated 22 February remains unresolved, both seeded projects remain in `design` despite testing completion dates of 5 and 20 February, and cash stays unchanged.
- Required fix: every advance mode must use one authoritative time progression service. Quick results may simplify session resolution but must process intervening management events, deadlines and costs. Mandatory events must stop the action rather than become silently overdue.

### 4. Finishing a development project through time produces no new part

- Evidence: `lib/career/timeline.ts:180` changes phase/status and gain values only. `syncCareerProjectsAndEvents` at `:370` stores those changes. `lib/career/carDev.ts:678` returns immediately for a project already marked completed, preventing subsequent manufacture by its completion helper.
- Reproduction: start a paid wing project; advance/synchronize to its testing completion date; inspect inventory and attributes; call `completeCarDevelopmentProject` again.
- Observed: project status `completed`; inventory stays at six parts; car attributes unchanged; completion helper cannot repair the missing part.
- Required fix: have one completion transition that creates a manufactured batch exactly once. Separate design completion, production, testing, inventory availability and fitting. Do not mark a project fully completed before inventory is committed.

### 5. A facility upgrade remains under construction beyond its due date

- Evidence: upgrade creation is implemented in `lib/career/facilities.ts:202`. Completion lives only inside `processFacilityWearAndUpkeep` at `:290`. Repository-wide call search finds its only caller outside exports is `calibration/carDevFacilities.test.ts:155`.
- Reproduction: buy Ferrari's wind-tunnel upgrade; advance the career beyond its completion date through the normal day-advance path.
- Observed: on 25 April 2027, an upgrade due 24 April still has `upgradeInConstruction: true`.
- Required fix: schedule facility completion/wear from the shared clock service; process each elapsed interval once. Connect facility level and condition to actual design/manufacturing/driver-development capabilities.

### 6. Email trade-offs omit money and can be applied repeatedly

- Evidence: `lib/career/comms.ts:49` declares £380,000 overtime via `costOffset`; `:89` declares £4.2M sponsor income. `chooseEmailDecision` at `:352` only changes email state, the target project's testing date, and board confidence. It does not consume `costOffset`, create a sponsor agreement, delay the competing wing project, or reject an already chosen decision.
- Reproduction A: accept overtime and then separately accept the sponsor proposal from fresh Ferrari careers.
- Observed: both leave cash at £54M; overtime leaves cost-cap spend at £17.6M; sponsor contract count remains seven.
- Reproduction B: choose `choice-reassign-aero` twice on the same email.
- Observed: floor completion moves 20 February → 15 February → 10 February. The advertised front-wing delay is never applied.
- Required fix: typed, atomic decision effects with a stable decision/event ID, one application per decision, linked timeline completion, real costs, resource transfers and downstream contracts. UI descriptions should be generated from these actual effects.

### 7. Starting another season retains the old year's management state

- Evidence: `lib/career/seasonLifecycle.ts:22` refreshes workforce lineups, calendar, clock, championship and weekend state only. It spreads the previous career, preserving finance, projects, comms, events, commercial, market and ATR unchanged.
- Reproduction: start 2028 from a controlled offseason state and inspect management state.
- Observed: events are still dated 2027; ATR ends `2027-04-15`; annual cap spend stays £17.6M; title sponsor still has two years remaining; first driver's age stays 29.
- Required fix: explicit rollover policies per domain: close the financial year and settle prizes, decrement/expire contracts, activate future agreements, generate new objectives/calendar/inbox, reset annual commitments and ATR periods, age/develop/retire people, handle ongoing projects and next-season research, preserve historical ledgers and rosters.

## Additional gaps established by source tracing

| Area | Current implementation and consequence | Evidence | Required completion |
|---|---|---|---|
| Recurring economy | Finance sync only initializes state; monthly projections are fixed values. Salaries, supplier fees and facility monthly upkeep are not settled when time passes. | `lib/career/finance.ts:89`, `:97`; `lib/career/facilities.ts:290` performs wear/completion but no upkeep transaction. | A dated ledger with payment schedules, obligations, accrual policy, cash forecasting and explicit failure/credit rules. |
| Result-driven commercial | Sponsorship bonus definitions, streaks, PR obligations and prize projections exist, but results do not pay bonuses or update streaks. | `lib/career/commercial.ts:92`; `lib/career/scoring.ts:30` processes scoring and marks every pending outbox event processed. | Idempotent subscribers for sponsor/driver bonuses, reputation, board objectives and final WCC settlement. Track each consumer separately so scoring cannot acknowledge other consumers' work. |
| Cost-cap enforcement | The cap is a display/status calculation, not a sanctions or spending control system. Upgrade and R&D commands can overdraw cash; no cap/accounting-year lifecycle exists. | `lib/career/finance.ts:159`; `lib/career/carDev.ts:592`; `lib/career/facilities.ts:218`. | A deliberate financial ruleset, validated commitments, actual accounting periods and documented permitted overrun/debt behaviour. Treat current monetary assumptions as game balance values until rules verified. |
| Capacity and input constraints | Engineer and batch values affect simple formulas, but engineers are never reserved/released, concurrent slots are not enforced, facility levels do not alter project durations, and only upper ATR clamping exists. | `lib/career/carDev.ts:475`; `lib/career/facilities.ts:342`; search for `availableEngineers` finds initialization/display only beyond this function. | Bounded validated inputs, real engineer/production capacity, queues, resource reservation and deterministic release at phase transitions. |
| ATR lifecycle | Only initial allocation is generated; its end date is hard-coded to 2027. No period refresh or championship-based reassessment follows. | `lib/career/carDev.ts:327`, especially `:338`. | Season-scoped, dated testing periods with versioned rule units and recalculated allocation. |
| Parts and two cars | A single fitted part is stored per part type and attributes are averaged across two fitting booleans; no per-chassis physical inventory. Completion adds raw deltas to current attributes, while installation recomputes all fitted deltas from baseline. Correlation changes reported gain but not actual deltas. | `lib/career/carDev.ts:616`, `:639`, `:681`, `:694`, `:719`. | Separate designs, manufactured units, per-car fitment and condition. Derive attributes consistently from installed units. Scale gains by actual correlation and enforce available quantities. |
| Staff integration | Negotiation changes market team/salary/term and possibly buyout cash, but never assigns a staffed operational role or payroll agreement. Most teams have no complete specialist staff lineup. | `lib/career/paddockMarket.ts:713`; initial staff list `:457`; `lib/career/workforce.ts` only has drivers and principals. | Canonical employment agreements and role slots for technical, aero, design, race engineering, scouting and pit crew; capabilities must affect operations. |
| Management feedback | Engineering allocation, driver morale and pre-race choices are saved but not consumed by project calculations or the session engine. | `lib/career/comms.ts:413`, `:440`, `:455`; `lib/career/weekend.ts:74` hard-codes neutral instructions. | Link each decision to a documented operational outcome; carry actual instructions and frozen car/driver/team state into quick-result input. |
| Basic result bridge | Quick engine ranks by a separate hard-coded driver-rating table plus noise. It receives participant IDs but no current car, market skills, upgrades, staff, morale or circuit-specific performance. | `lib/career/sessionEngine.ts:31`, `:65`; `lib/career/weekend.ts:33`, `:74`. | Before full race simulation, extend the simple resolver to consume current management outcomes. Without this, stronger car development cannot help win races. |
| AI opponents | Other teams race, but their car ratings remain fixed baselines and there are no AI development/financial/recruitment policies. Management state is essentially player-only. | `lib/career/carDev.ts:281` derives rival rankings from constants; `CareerState` has singular `finance`, `carDev`, `facilities`, `commercial`. | Per-team state and deterministic bounded AI decisions using the same legal actions, constraints and economy as the player. |
| Long-term game world | No expiry-driven free agency, ageing, progression, retirement, new prospects, new staff, rival appointments or regulation-driven car resets. | `lib/career/paddockMarket.ts:556` seeds static arrays; `seasonLifecycle.ts:22` copies rosters only. | Defined annual world evolution and an adequate talent pipeline for long saves. |
| Governance | Board confidence and mandates are seeded and directly nudged by email decisions; no scheduled objective evaluation, dismissal, bailout or career outcome loop. | `lib/career/comms.ts:16`, `:382`; `seasonLifecycle.ts:12`. | Outcome-driven board reviews, explicit success/failure conditions and progression rewards. |
| Canonical identifiers | Finance/commercial initial tables use `red_bull`, `aston_martin`, `rb` and `sauber`; car/grid uses `red-bull`, `aston-martin`, `racing-bulls`, `audi`, `cadillac`. Several teams receive fallback cash/prestige. | `lib/career/finance.ts:20`; `lib/career/commercial.ts:79`; `lib/career/carDev.ts:18`. | One canonical team-ID registry and validated imports/seeds; remove obsolete aliases from runtime maps or normalize them at ingestion. |
| Save validation | Core structure is checked, but management domains are not validated. Migration trusts any object for finance/carDev/comms/market/facilities. | `lib/career/validation.ts:29`, `:60`, `:129`. | Validate nested domain schemas, finite numbers, dates, references, cash/ledger agreement, unique people/assignments and versioned migrations. A corrupt object must not pass import and crash the UI later. |
| Clock edge cases | Events equal to the current timestamp are filtered out, so multiple mandatory events at one time need a pending-event queue. Next-race-weekend mode targets the first session of an unfinished round, which may already be in the past midway through the weekend. | `lib/career/gameTime.ts:62`; `lib/career/timeline.ts:459`. | Process due/unresolved events in stable order, protect against stalled loops, and target the next unresolved session rather than an already completed first session. |

## What the existing tests establish, and what they miss

- `calibration/workforceContracts.test.ts:73` is titled “updates lineup” but asserts the market record, not `workforce.lineups` or championship eligibility. It calls negotiation without storage; `appointDriver` throws when its save needs storage, and the broad catch hides that. The rival-poaching test similarly checks cash and the market team only.
- `calibration/carDevFacilities.test.ts:120` completes a project immediately through the helper instead of advancing through its phases. The facility test calls the wear helper manually and does not advance the clock past construction completion.
- `calibration/commsDecisions.test.ts:60` checks only date/confidence changes; no assertion covers overtime cost, the displaced project's delay, sponsor agreement creation, event resolution or duplicate application.
- `calibration/seasonLifecycleWorkforce.test.ts:16` fabricates archived rounds and checks the next calendar, roster and championship; it does not close/reopen finance, contracts, commercial obligations, ATR or communications.
- `calibration/seasonRunner.test.ts` covers the resolver's classification shape and two weekends of points, without asserting intervening obligations, management decisions affecting results, a complete season, or a second season's economy.

Add integration tests that operate through the same commands as the UI, always with storage: sign → reload → race → score; start project → advance through dates → inspect manufactured inventory; upgrade facility → advance → capacity/upkeep change; choose email → check all advertised consequences → repeat → no extra effects; process result twice → no duplicated money/points; complete two full seasons → check world, ledger, contract and roster invariants. Compare day-by-day advancement with jumping to the same date. Add bounded seeded multi-season balance tests after the core loop works.

## Suggested implementation order

1. **Restore truth in the status tracker and lock acceptance criteria.** Preserve the existing working calendar/save scaffolding. Define a “working management game” as a save that can be created, played through at least two seasons, reloaded, and continued with meaningful decisions and consistent money, people, cars and standings.
2. **Unify identities, domain contracts and validation.** One team/person registry; dated employment agreements; canonical per-team management state; versioned rules/game-balance data; nested save validation and migrations. Keep editable reference facts separate from a career's mutable snapshot.
3. **Build one authoritative advancement and event pipeline.** Every advance button and quick weekend uses it; settle all due effects exactly once; preserve mandatory stops; detect time-progress stalls; support atomic save commits and independent result consumers.
4. **Repair roster and contract transactions.** Fix failed buyouts, effective seasons, departing-driver release, reserves, staff roles, workforce/market synchronization and championship registration. This prevents incorrect careers from being produced by ordinary management actions.
5. **Make the operating economy work.** Payroll, supplier costs, upkeep, sponsor instalments and bonus settlement; cash forecast derived from commitments; annual cost-cap accounting and WCC settlement; overspend/bankruptcy rules. Use explicit fictional balance assumptions where real financial terms are unavailable.
6. **Finish the development and facilities loop.** Phase transitions manufacture actual parts; engineer/factory queues and costs; facility completion; per-car installation and inventory; ATR period refresh; correlation and staff effects; next-season research. Spending must yield a measurable capability change.
7. **Complete decision-driven communications and governance.** Route messages from actual events; enforce one decision; apply all costs/trade-offs; use deadlines and current rosters; let race results and finances change morale, reputation and board objectives. Remove seeded stories that contradict actual dates or personnel.
8. **Use a deliberately simple quick-result bridge to validate management.** Keep the existing session-engine interface, frozen participant snapshots, idempotent scoring and archives. Feed the resolver current car/driver/team/circuit state and real preparation instructions. This is a dependency for proving that management decisions matter, not the full race simulator.
9. **Implement AI competition and complete multi-season progression.** Other teams use the same budget/resources/contract constraints; renew/expire contracts, age/develop/retire people, generate prospects, evolve cars and objectives, archive/reset the correct annual fields. Run two-season end-to-end acceptance and longer seeded balance trials.
10. **Only then add deep race simulation and race control.** Replace the simple engine behind its established input/output contract. Add circuit-aware lap/sector models, tyres/energy/reliability/weather, qualifying and sprint rules, safety cars/red flags/penalties, pit strategy and live race-control actions, pause/speed/replay/checkpointing and post-race adjudication. Race-control commands should affect live simulation state and produce auditable events. Keep this as the final major feature stage as requested.

## Data requirements for the database/storage roadmap

These are domain requirements, not a recommendation to put every value in a new SQL table. The database audit should determine whether each belongs in authoritative reference tables, a versioned career snapshot, or queryable per-save records.

- Every team: balances and accounting year, dated ledger entries and scheduled obligations, budgets/credit rules, sponsor agreements, facilities/construction, resource allocation, car designs/batches/per-car fitment, staff assignments, objectives and reputation.
- Every person: canonical identity and date of birth, skills/potential/traits with provenance, seasonal progression, contracts with effective dates/end dates/clauses, role/seat assignment and historical affiliations. Do not maintain independent conflicting market and racing identities.
- Every season/ruleset: eligible teams/entrants, dated calendar, points rules, cost-cap treatment/currency, ATR periods/units, component and staffing rules, prize model and next-season regulation assumptions.
- Every durable process: stable command/event ID, scheduled time, status, source entity, effective outcomes, per-consumer acknowledgement, and sufficient history to avoid repeating money/results after reload or retry.
- Every result: participant/team snapshot, rules and engine versions, seed, input state, classification, consequences and processing receipts. The later live race simulator can extend this structure without replacing the management save format.
