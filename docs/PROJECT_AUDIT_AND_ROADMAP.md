# F1 Manager: project audit and completion roadmap

Audited 25 October 2026 against the current working tree, including existing uncommitted work. This is an analysis and implementation plan; no gameplay source or database records were changed.

## Assessment

The project is a substantial management-game prototype with useful domain modules, save migration, calendar/session orchestration and championship scoring. It is not yet a complete management game. The largest gap is that several systems work in isolation but do not reliably affect one another during normal play. Adding more screens or a sophisticated race engine before repairing those connections would hide rather than solve that problem.

The target should be a repeatable loop: **decide → spend/commit → advance time → complete work → enter an event → receive results and consequences → develop the whole paddock → begin another season**. Every step must survive saving, reloading and retries.

The existing design plan's blanket “Completed” status is too optimistic. Preserve it as design intent, but track implementation against the acceptance criteria below. A function or passing isolated test is not sufficient evidence that its feature works through the UI.

Full race simulation is the final major addition. The user confirmed that final-stage race control must include **both pit-wall management and a separate race-director mode**.

## What was checked

- Inspected application routes, career modules, migrations, reference data, the supplied driver workbook and the existing design document.
- Ran all 12 existing test commands successfully. TypeScript checking with incremental output disabled and the production build also passed. The initial sandbox invocation failed before tests could execute because Node could not resolve the user-directory path; the permitted rerun executed successfully. The build emitted a Node 20 deprecation warning from Supabase.
- Ran targeted, in-memory probes of transfers, new-driver scoring, project completion, facilities, repeated decisions, finance effects, GP fast-forward and season rollover. These reproduced the integration defects below despite the green existing suites.
- Browser smoke-tested a fresh Ferrari career on a separate localhost port: setup, Continue and a meeting acknowledgement, full GP completion, standings, and save/reload work. The test save is isolated by origin from other development ports.
- Inspected IPL-Simulator's existing Graphify graph and relevant current source. IPL was used as an architectural comparison; its behavior was not comprehensively tested or certified.
- Attempted read-only live Supabase access. **The configured hostname returned ENOTFOUND, including with network permission. No live rows, deployed constraints, applied migrations or RLS policies could be verified.** Database counts below describe repository seeds, not confirmed production contents.

Supporting evidence: [management audit](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-management-notes.md), [database audit](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-database-notes.md), [IPL comparison](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-ipl-comparison-notes.md), [test command output](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-test-results.json), and [browser screenshot after a race](C:/Users/10ary/Documents/programming/f1-manager/docs/audit-dashboard-after-race.png).

## Existing foundation worth retaining

| Area | What already exists | Actual readiness |
| --- | --- | --- |
| Career/save | Schema versioning, migrations, backup fallback, import/export helpers | Useful foundation; one localStorage slot, shallow validation of newer systems, missing recovery/slot UI |
| Time/calendar | Generated season calendar, standard and sprint weekends, mandatory stops, advance modes | Two advancement paths disagree about which management work to process |
| Session orchestration | Participant snapshots, seeded attempts, input/output validation, interruption recovery, result outbox | Strong integration boundary to keep for the final simulation |
| Championship | Driver/constructor points, standings, archives and season transition | Works for initial entrants; changing the roster can break points accounting |
| Workforce/market | Driver and staff profiles, offers, counteroffers, buyouts, future lineups | Multiple representations diverge; some accepted contracts do not produce a valid transfer |
| Development/facilities | Car attributes, project stages, inventory, installation flags, ATR, campus upgrades | Completion and time processing are disconnected; several benefits are not consumed by gameplay |
| Commercial/finance/comms | Sponsor contracts, PR actions, ledger, forecasts, decisions, board confidence | Much remains seeded or manually invoked rather than settled through time/results |
| Results engine | Fast seeded classification generator | Fixed driver-rating table; ignores the management model and circuit-specific race distance |
| UI | Broad set of management screens | Some useful controls, but stale seed values, hidden completed results and layout issues remain |

## Highest-priority defects

Priority P0 means a broken core flow or inconsistent saved career; P1 means essential missing gameplay or reliability; P2 means depth and polish after the loop is sound.

| Priority | Finding and evidence | Required correction |
| --- | --- | --- |
| P0 | GP fast-forward uses `advanceCareerWeekend`/`gameTime` with weekend-only milestones. A fresh career can reach 14 March while a mandatory 22 February deadline remains unresolved and projects with February finish dates remain in design. `lib/career/weekend.ts:208`, `:237`, `:276` | Route every advance mode through one chronological management processor; fast-forward must stop at mandatory decisions and settle every due effect |
| P0 | A Piastri signing probe returns accepted, charges £28m and marks his market profile Ferrari, while the actual lineup still has him at McLaren. `lib/career/paddockMarket.ts:638`, `lib/career/workforce.ts:28` | Validate first, then commit the release, replacement, contract, payment, market and lineup together; errors must return failure without charges |
| P0 | Signing Tsunoda can update Ferrari's lineup without adding him to championship entrants. A valid forced P1 result then totals 76 driver points versus 101 constructor points. `lib/career/workforce.ts:36`, `lib/career/scoring.ts:26` | Use canonical entrants and result-time team attribution; include new drivers without rewriting historical constructor points |
| P0 | Timeline marks a project completed before the helper that creates its inventory part. That helper then rejects the already-completed project. A completed wing produced no new inventory or attributes. `lib/career/timeline.ts:161`, `lib/career/carDev.ts:668` | One completion operation must advance stage, create the part once, notify the player and permit installation |
| P0 | Purchased facility construction remains active after its due date. `processFacilityWearAndUpkeep` is exercised by a unit test but not the normal game-time path. `lib/career/facilities.ts:290` | Process construction, condition and upkeep through the shared time pipeline, exactly once per interval |
| P0 | Year 2028 retains 2027 management events, ATR dates, cap spending, sponsor durations and driver ages. `lib/career/seasonLifecycle.ts:22` | Make yearly close/open a complete, recoverable transition across all domains |
| P1 | Email choices can be applied repeatedly; a probe moved a project finish from 20 February to 15 February and then 10 February. Promised £380k overtime and £4.2m sponsor decisions did not affect cash/cap/contracts. `lib/career/comms.ts:352` | Store one resolved choice, reject repeat execution, apply declared financial/contract consequences and connect its timeline blocker |
| P1 | Development, staff, morale, strategy and circuit data do not influence the results engine. `lib/career/sessionEngine.ts:65` | Before balancing management, let a simple provisional result adapter consume a frozen current-state snapshot; keep detailed racing for the last stage |
| P1 | Home shows $142m and “No points awarded” after a race, while the header shows £54m and standings show Ferrari on 23 points. Header/driver cards use the original grid. `app/game/page.tsx:264`, `:364` | Derive every display from current career selectors; use a consistent money representation and show history/results after a GP |
| P1 | New subsystems are accepted without validating their internal structures. `lib/career/validation.ts:33`, `:142` | Validate complete persisted state and cross-domain relationships, migrate explicitly, and surface recovery choices instead of crashes or silent reconstruction |

Do not treat a hard-coded budget, prize schedule, salary, rating or starting lineup as a verified fact simply because a screen displays it.

## Database: what exists and what to add

### Current situation

There are three partly separate worlds:

1. Supabase factual records and legacy gameplay tables described by SQL migrations.
2. Hard-coded TypeScript grid, ratings, market, car, finance and calendar defaults used to create careers.
3. Mutable browser career state.

Only the Database browser screen reads Supabase. Creating a career does not import the database's driver ratings. Adding more database columns alone therefore cannot improve normal gameplay.

The repository's seeds describe **109 people**: 22 F1 race drivers, 10 reserves, 52 F2/F3 drivers and 25 staff; **86 series entries, 11 factual teams and 41 circuits**. These are expected seed coverage, not live counts. The game's market has only 25 driver profiles and eight staff profiles.

The workbook has 22 populated driver rows and 36 fields. All 440 values checked across 20 rating fields match the latest ratings SQL seed. However, **21 of 22 overall ratings differ from the TypeScript market defaults**. For example, Norris is 91 in the workbook/SQL and 94 in the market; Lindblad is 66 versus 79. Agree one versioned ratings pack and one documented rating formula.

The migration history alters `drivers`, `teams`, `staff` and `tracks` without creating their base tables. The configured seed file is absent. The latest ratings migration also assumes numeric person/team IDs and deletes contract rows for seeded drivers. This is not a safe, reproducible setup for an arbitrary existing database. Repair and rehearse it on an empty disposable database before applying anything to a populated one.

Data meaning also needs repair: the ratings seed puts cumulative workbook career totals under `season = 2026` (for example, 233 Verstappen starts). Add statistical scope and an as-of date, and keep imported career history separate from simulated results. For wider recruitment, fill missing DOB/nationality/eligibility and balanced skills for the feeder/reserve pool; the fact seeds currently leave 87 DOBs and 65 nationalities unpopulated. Circuit lengths/layout versions also need reconciliation, and Madrid's race laps/distance are absent from the reference seed.

### Recommended ownership model

Keep **versioned reference data → validated new-career snapshot → career-specific mutable state**. Include `referenceVersion`, `rulesetVersion`, `balanceVersion`, `schemaVersion`, `careerId` and a seeded random-state strategy.

Supabase may distribute reference packs and eventually store cloud saves. A new career should copy the chosen pack so later database edits do not unexpectedly change an existing season. Bundle a last-known-good reference pack so the management game can start without a network connection. Local IndexedDB saves with export/import are sufficient for a single-player release; authentication and cloud synchronization are optional, not prerequisites for a functioning game.

The names below are proposed entities, not claims that every one requires a new SQL table. They can live in validated reference packs or career stores first. If cloud persistence is added, key mutable rows by career ID and protect them with ownership policies.

| Order | Data/entity work | Essential fields and integrity rules |
| --- | --- | --- |
| Now | Base migrations, import batches, canonical IDs and aliases | Reproducible schema; slug/UUID identity; source-system ID map; FK and uniqueness checks; import checksum/version; no positional ID assumptions |
| Now | Season and rules profiles | Year, source/version, generated-versus-official calendar status, session formats, points/countback, cost-cap currency/base/indexation policy, ATR periods, effective dates |
| Now | Driver profiles and rating versions | Person ID, DOB, skills, potential, growth/decline model, morale, fitness, feedback, commercial attributes; provenance/confidence; separate facts from game ratings |
| Now | Staff roles and team staffing | Role-specific abilities, contract, salary, availability, assigned driver/car, experience; minimum staffed roles or explicit generic staff for all 11 teams |
| Now | Contracts, seats and assignments | Person/team IDs, role/seat, effective start/end, salary/bonuses, buyout, status; prevent overlapping exclusive seats; preserve historical assignments |
| Now | Team starting-state profiles | Canonical team ID, cash, ongoing costs, objectives, reputation, car baseline, facilities, workforce, supplier agreement; known team IDs must resolve without silent defaults |
| Now | Finance obligations and ledger | Amount in integer minor units, currency, date, category, cap treatment, source event, settlement status; unique business-effect ID; cash reconciles to ledger |
| Now | Sponsor agreements and commitments | Slots, duration, payment schedule, milestone definitions, PR dates, satisfaction, exclusivity and penalties; settlement IDs prevent duplicate payment |
| Now | Projects, manufactured parts and per-car installations | Stages and due dates, staff/capacity, ATR use, cost, predicted/actual deltas, version/condition/quantity, assigned car, spare stock; one completion creates one batch |
| Next | Facilities, supplier deals and research | Construction dates, capacity, condition/upkeep, upgrade/refurbishment costs; supplier term, price, capabilities; next-season research carryover |
| Next | Scouting, training and career progression | Assignments, scout capacity/cost, expected completion, confidence ranges, eligibility evidence, development plans, age/potential, retirement and generated prospects |
| Next | Events, decisions, objectives and AI plans | Due date/severity, actionable choices, resolved effect IDs, board targets, rival budgets/priorities; deterministic processing history |
| Before management release | Save manifests and archives | Named career/slot, revision, migration history, backups, source pack versions, season/result archives; optimistic revision conflict handling if cloud is introduced |
| Final stage only | Circuit simulation profiles | Layout/sector distances, timing lines, pit lane loss and limits, surface/grip, degradation, overtaking zones, weather distributions, recovery zones; distinguish measured facts from calibrated values |
| Final stage only | Weekend inventories and component usage | Tyre compounds/sets and usage, fitted component serials/life, allocation limits, setup/parc fermé state, penalties and grid decisions |
| Final stage only | Live sessions and race-control records | Per-car state, laps/sectors, fuel/energy/tyres, incidents, flags, SC/VSC/red-flag state, steward cases, evidence, decisions, penalties, restart eligibility and replay/checkpoints |

### First live-database verification once connectivity is restored

Confirm the correct project endpoint, then read the deployed schema and migration history; compare row counts with seed expectations; check duplicate identities, dangling FKs, overlapping contracts and missing ratings; inspect actual privileges/RLS; compare all 22 starter records against the selected reference pack; verify offline fallback. Do not rerun the destructive ratings seed as a diagnostic. Do not claim the current database is empty or deleted: a DNS failure does not establish that.

## F1 rules and data provenance

The product starts in 2027 using 2026 driver pairings and a generated calendar. That can be an intentional fictional career scenario, but must be identified as such. Store factual historical data, future assumptions and game balance values separately.

The current £135m cap is not a reliable modern F1 rule. FIA Section D, Issue 08, specifies a US$215m base for up to 24 competitions, with indexation and presentation-currency rules. Its illustrative 2026 GBP value is £170.09m; do not simply replace one currency's number with another or assume that illustration is the final 2027 amount. See [FIA financial regulations, D4.1](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_-_f1_teams_-_iss_08_-_2026-10-01.pdf). This is game-rules modelling, not a recommendation to reproduce an entire regulatory accounting system.

The old DRS-efficiency field and 798kg comment also need a season-specific review. Formula 1's official 2026 overview describes active aero, Overtake Mode replacing DRS, and a 768kg minimum for that year. It also describes six eliminations in each of the first two qualifying phases for a 22-car grid. See the [official 2026 overview](https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-2026-regulations.6j0tS0hrHG2T01tpmK6XYz). Do not extrapolate those technical figures automatically into 2027.

The [FIA regulations index](https://www.fia.com/regulation/category/110) already lists 2027 sporting, technical and operational documents published on 19 October 2026. Their detailed PDFs were not successfully retrieved in this audit. Pin and review those editions when implementing the 2027 rules pack. Prize-money scales and private commercial terms used for balancing must be labelled game assumptions unless independently sourced.

## Step-by-step implementation plan

### 1. Establish an honest baseline and protect saves

Work in `storage`, `validation`, setup/settings and test tooling. Preserve the existing working tree; make small, independently reviewable implementation changes.

- Introduce a single `check` command covering type check, existing tests and production build; add CI and a short setup README.
- Add targeted regression tests for the reproduced defects, initially demonstrating the failure.
- Validate all career subsystems and references, provide versioned migrations, distinguish recoverable backup from invalid data, and show save errors in the UI.
- Expose export/import and backup recovery. Add career-scoped shortlist IDs. Add named save slots/IndexedDB where needed for capacity; cloud can wait.
- Upgrade the runtime to a supported version and pin it for local development and deployment.

**Done when:** a save can be exported, corrupted, recovered and reimported; an old schema migrates without losing progress; changing careers does not leak shortlists or records; the reproducible check command passes.

### 2. Make the database/reference pack authoritative

Repair the baseline migration chain, restore connectivity, map canonical IDs and build one reference-data adapter used by `createCareer`. Retire duplicate independent ratings/defaults gradually after tests establish parity. Choose and document the 2027 scenario, rules pack and balancing assumptions.

**Done when:** a clean database can be built from the repository; all 11 teams and their starting drivers/staff resolve; workbook-approved ratings reach a newly created career; missing or unavailable reference data produces a clear error or a versioned offline fallback; an existing save remains unchanged by later reference updates.

### 3. Unify time advancement and domain effects

Make Continue, +1 day, +7 days, To GP, session simulation and entire-GP simulation use one advancement service. Process due items in chronological order, with deterministic ordering for events at the same minute. Each domain effect gets a stable ID and is committed once.

Connect project stage transitions/materialization, construction, upkeep/payroll, sponsor schedules, contract deadlines, inbox decisions and weekend entry. Separate “read/acknowledged” from “decision resolved”; a mandatory choice cannot be bypassed by acknowledging a notice. Return explicit outcomes: advanced, stopped for action, season complete or failure. Add progress guards so future malformed schedules cannot spin indefinitely.

Fix result-event ownership at the same time: `processChampionshipEventsState` currently marks every pending outbox event processed, including events it does not otherwise handle (`lib/career/scoring.ts:33`). Track receipts separately for scoring, finance, sponsors, board and other consumers, or dispatch all required consequences atomically before marking a shared event complete. Otherwise adding later consumers can silently lose their work.

**Done when:** advancing day by day and jumping to the same target produce equivalent state; GP simulation cannot skip a mandatory decision; every due financial/project/facility effect applies once; save/reload at a blocker resumes correctly.

### 4. Repair contracts, recruitment and championship identity

Give one service ownership of driver/staff contracts and assignment changes. Include release/buyout, displaced driver, replacement at the selling team, effective season, payroll and championship entry in a single validated transaction. Do not swallow appointment exceptions. Represent active and future contracts distinctly in the market UI.

Rebuild displays from the workforce state. Add timed scouting with uncertainty and eligibility checks; introduce training/development only once roster integrity is stable. Staff should occupy real roles with measurable effects.

**Done when:** a rival signing either completes every required change or changes nothing; new entrants score; total awarded driver and constructor points reconcile; no driver occupies two exclusive seats; the old team's historical points survive a transfer; reload preserves the transaction.

### 5. Complete the financial, commercial and board loop

Make the ledger authoritative and projections derive from scheduled obligations. Implement regular payroll/upkeep, supplier costs, sponsor fees, PR commitments, achievement bonuses, prize settlement, contract termination and facility/project charges. Reconcile cash independently from cap-counted expenditure. Add affordability checks and deliberate rules for deficits, board intervention and contract consequences.

Make every email choice's stated effect real, including overtime costs and sponsor acceptance. Resolve the choice once. Board confidence and objectives should react to sporting, financial and long-term results; warnings need actionable consequences rather than colour alone.

**Done when:** opening cash plus transactions equals current cash; obligations settle once through any advance mode; UI explanations match ledger effects; season-end money is paid exactly once; cap behavior is based on the pinned rules/balance profile.

### 6. Finish car development and operational capacity

Connect Design → Production → Testing → Inventory → Installation. Model actual batch quantities, spare consumption, replacement of an existing part and per-car fitment without repeatedly adding the same gain. Staff/engineering allocation and facility capacity must constrain timelines. Correlation/testing determines realised benefit; rushing has defined cost and quality trade-offs.

Refresh ATR by period and standing; integrate facility completion/maintenance and supplier deals; give next-season research a defined carryover. Keep budgets, cap treatment and resource usage in the shared transaction model.

**Done when:** paying for an upgrade produces the correct quantity at the correct time, consumes the correct resources and can be fitted to either car; repeated installation cannot stack gains; staff/facility changes alter project outcomes; a facility becomes usable on its completion date.

### 7. Complete the season cycle and rival management

Implement explicit preseason, in-season, season-close and offseason stages. Settle awards/bonuses; expire/activate agreements; refresh budgets, sponsor terms, ATR, objectives and events; age/develop/retire people; introduce prospects; carry research forward; archive immutable history. Store transition IDs so reload/retry cannot apply yearly changes twice.

Give all 11 teams the same basic budgets, contracts, cars, staffing and operational rules. Add modest AI planning for hiring, replacement, spending, development and sponsor renewals; the AI must obey the same affordability and resource constraints as the player. Elaborate personalities can follow later.

Retain a simple automatic result adapter during this phase. Feed it current car/driver/staff state and a pinned seed so management changes have an observable payoff. This is a provisional season-resolution tool, not the final detailed race simulator.

**Done when:** three consecutive seasons complete without manual repair, duplicate payments, vacant mandatory seats or stale-year state; opponents develop and replace personnel; old standings remain stable; management investment affects provisional outcomes in controlled tests.

### 8. Make the management game usable and pass its release gate

Extract the 3,000-line game page into feature components backed by shared selectors/services. Replace static home/header values; show current contracts, forecasts, project dates, comparative car strengths and decision consequences. Keep completed GP results accessible after auto-archive. Add season/history views, clear empty/error/loading states, keyboard-friendly dialogs and usable layouts at laptop widths. The browser audit showed overlapping header content at 1280px.

Add browser scenarios for a complete management journey and save/reload checkpoints. Test long-career save size, multiple slots, storage failure, offline reference data and retries. Separate large history archives from frequently updated current state.

**Management-release gate:** start with each team; hire a driver and staff member; sign a sponsor; run a project and facility build; resolve an expensive decision; advance through deadlines; complete three seasons using provisional results; reload at each phase; verify money, roster, points and history invariants. Only after this gate should detailed race simulation/control become the main workstream.

### 9. Final stage A — build and calibrate the detailed race simulation

Keep the existing session input/output boundary, but expand its frozen snapshot to contain the actual entrant/team/car, driver skills/form, fitted components, circuit and weather, applicable regulations, setup, tyres and strategy. Preserve engine/rules/balance versions and deterministic random state.

Implement in this order:

1. Headless practice and qualifying with session-specific rules, progression and grid creation.
2. Race/sprint progression with track-dependent laps, sectors, fuel/energy, tyres, pace variation, reliability and errors.
3. Traffic, overtaking/defence, pit stops, undercut/overcut, changing weather and AI strategy.
4. Incidents and a common rules/race-control state machine for flags, SC/VSC, red flags, restarts, investigations and penalties.
5. Persisted checkpoints/replays and performance suitable for live playback and fast-forward.

Use a worker or equivalent execution boundary so UI speed does not change sporting outcomes. Calibrate across many seeds and representative circuits; report distributions for pace, gaps, overtakes, pit losses, DNFs, safety cars and wet races. A single plausible-looking classification is not calibration.

**Done when:** identical input/seed/version reproduces the same race, checkpoint resume matches uninterrupted execution, sprint/GP rules differ correctly, official result adjustments update championships once, and faster playback does not change results.

### 10. Final stage B — pit wall and race-director mode

Build both experiences on the same simulation and event stream, after the management release gate and headless engine are stable.

**Pit wall:** live timing and track map, both driver panels, tyre/condition/fuel/energy state, gaps and pit windows, weather, pace/energy orders, pit instructions, team orders, engineer messages, race-control notifications, pause and speed controls. Orders need acknowledgement, latency where appropriate and an audit trail; they cannot bypass pit-entry/session rules.

**Race director:** review incident evidence and live session state; issue authorised flag changes, SC/VSC, suspension/restart decisions and steward decisions. Keep race direction and steward penalties as distinct workflows even if one player controls both. Show the reason, affected cars and legal next actions. Keep irreversible sporting decisions in the session event log with deterministic replay.

Offer race-director control as an explicit mode separate from a standard team career; normal careers use automated officials. A combined sandbox can be offered deliberately, but should not silently allow the team manager to manipulate neutral officiating in the competitive career. Reuse the same engine and legal-transition checks in every mode.

**Done when:** race-control interventions have reproducible effects; prohibited transitions are blocked; pit-wall instructions, flags and penalties persist through reload; result reclassification cannot double-award points or money; automated and player-controlled officiating use the same rules.

## Immediate implementation queue

Start with small fixes whose value is easy to verify, in this order:

1. Regression cases for the GP fast-forward bypass, false-success transfer, omitted entrant points and missing project/facility completion.
2. One chronological advancement processor, stable effect IDs and the completion hooks.
3. Atomic transfer/contract handling and canonical championship entrants.
4. Idempotent decision/ledger settlement and truthful home/header displays.
5. Explicit annual close/open processing and three-season integration tests.
6. Reproducible database bootstrap and reference-pack adapter in parallel where it does not compete with core state changes.

Do not begin with a full rewrite, more cosmetic pages, a large new live-race UI, multiplayer or mandatory cloud accounts. The current domain modules and session orchestration are a useful foundation; the priority is to make their consequences reliable and visible.
