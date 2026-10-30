# Finance and manufacturing: next implementation plan

Prepared 29 October 2026. Original planning baseline retained below. Implementation is now delivered across the four releases; see [implementation notes](MANUFACTURING_IMPLEMENTATION.md) for the shipped behaviour, activation steps, test evidence and explicit simplifications.

The next objective is a complete, understandable management loop: approve an affordable upgrade, allocate people and testing, finish its design, manufacture physical parts, fit them to a car, and see the consequences in performance and finances. Build that loop before adding complex corporate or engineering simulation.

## 1. What exists, and what is still missing

Reviewed against the current source, including the finance implementation delivery notes.

| Area | Existing foundation | Work still needed |
| --- | --- | --- |
| Finance records | Opening positions, agreements, invoices, partial settlements, loans, assets, ownership and separate team books | A coherent ordinary-player workflow; controlled starting scenarios; stronger reconciliation and classification |
| Forecasts | Scheduled cash movements, cap forecasts, department budgets and separate scenarios | Correct period presentation, daily commitment checks across all instalments, uncertainty and project-level drill-down |
| Personnel and commercial | Contract obligations, named staff pay, release agreements, result bonuses and explicit prize policies | More automatic origination from the relevant management screens; fewer repeated data-entry forms |
| Manufacturing finance | Explicit orders, instalments, delivery, physical inventory records, cancellation and credits | Typed specifications, project execution, capacity, installation on named cars and operational consequences |
| Old car development | Separate project, part, facility and ATR code | Reconcile with the newer order/inventory system; replace obsolete assumptions before enabling it |
| Race integration | Quick session results and bonus consumers | Car specifications and fitted parts do not currently influence the quick engine |

Concrete observations to resolve before expanding:

- `financeRules.ts` carries a 2026 framework forward. The 2027 amendments need an explicit effective-year implementation.
- `financeForecast()` currently derives monthly relevant-cost rows from remaining payments. Cap recognition must remain visible when a cost was prepaid, or is recognised in a different month from payment.
- `closeFinancePeriod()` stores gross cash inflows/outflows in fields named income/expense. Separate operating performance from financing and asset movements before presenting those as financial statements.
- `journalLinesForObligation()` settles through receivables/payables even when settlement precedes recognition. Add proper advances/deferred-income presentation and reconciliation.
- `manufacturingFinance.ts` accepts a manually chosen recognition date/relevant amount. Its unit transitions can reverse expensing when a part returns to available stock. Physical availability and accounting history need separate, durable fields.
- A manufactured unit currently has a free-text specification and an installed state, but no design reference, car assignment, performance specification, mileage or first-use date.
- `carDev.ts` has fictional supplier names, an old 798 kg reference, DRS terminology, a fixed ATR end date, and a formula giving an eleventh team 120%. These are legacy assumptions, not an approved 2027 starting model.
- `sessionEngine.ts` uses a separate static driver-rating map; it does not consume the manufactured units or current car attributes.

These are source-review findings. This planning task has not changed code, run a new test suite, or audited the live Supabase state.

## 2. Regulatory basis

Pin each save to dated regulations. The FIA currently lists 2027 Sporting B Issue 01, Technical C Issue 04 and Operational F Issue 01, dated 19 October 2026. Finance uses Section D Issue 08, dated 1 October 2026, including its approved later-year amendments. Reconcile new-career calendars with the selected rules; do not silently rewrite an existing save's historical calendar. [FIA regulations register](https://www.fia.com/regulation/category/110/technical-regulations).

Financial rules to encode: $215m base with indexation/calendar adjustments; R&D belongs to its incurred year; inventory treatment depends on use/redundancy; Appendix D2 changes inventory definitions for 2027. Plant/equipment cap depreciation uses straight-line, zero-residual treatment, potentially differing from book depreciation. Property has distinct treatment. The three highest-paid eligible individuals need annual aggregation. Carry-forward requires the regulatory determination, not merely an internal close. Related-party and supplier transactions need valuation rules. Team and PU-manufacturer regimes are separate. [Section D: D4–D7, Appendix D2](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_-_f1_teams_-_iss_08_-_2026-10-01.pdf).

Operational rules to encode: six aerodynamic testing periods; a standings-based coefficient of 70% for first through 115% for tenth-or-lower/new entrants. At 100%, allowances are 320 tunnel runs, 80 wind-on hours, 400 occupancy hours, 2,000 new CFD geometries and 6 MAUh. Use the prior season for the first three periods and standings at the end of period three for the remainder. Factory shutdown is normally 14 summer days and nine days from 24 December, subject to prescribed exceptions. [Section F: F3–F4](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_f_operational_-_iss_01_-_2026-10-19.pdf).

Technical/sporting rules to encode: component sourcing depends on its regulatory classification; team-designed aero cannot simply be bought from a rival. Use active-aero Corner/Straight Mode and season-specific mass requirements. Parc fermé restricts changes, with defined replacement exceptions. PU pools have element-specific seasonal allowances and additional provisions. [Section C: C3–C4, C17](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_c_technical_-_iss_04_-_2026-10-19.pdf), [Section B: B3.5, B8.2](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_b_sporting_-_iss_01_-_2026-10-19.pdf).

The game should model these constraints without requiring CAD, actual CFD, or a regulatory courtroom. Development gains, staff productivity, manufacturing prices, durations and starting resources are game-design data. Label and approve them as such; they are not supplied by the regulations.

## 3. Finance work

### F1 — Correct the accounting and cap bridge

Retain the existing ledger and agreements. Add a distinct cap-assessment layer with links back to the source records, rule version and reason. This allows cash movement, accounting recognition and regulatory adjustment to happen on different dates without rewriting history.

Implementation work:

- Separate cashflow, accrual operating results and cap reporting throughout summaries, forecasts and year-end reports.
- Distinguish loans/equity from trading revenue; principal repayments from operating expenses; asset purchases from depreciation.
- Support supplier deposits and customer advances, releasing them when the underlying service or delivery occurs.
- Separate design/testing expenditure from the conversion cost attached to each manufactured unit.
- Track manufacture-start, acquisition, delivery, first-use, write-off and retirement dates. Run explicit opening/year-end inventory reviews using the selected season's rules.
- Keep a used part's financial history when it comes off the car. Reinstallation must neither produce a refund nor duplicate the original recognition.
- Separate financial-book depreciation from regulatory depreciation and retain the reconciliation.
- Provide classification templates with supporting rules and limited documented overrides. Do not give the player an unrestricted way to label development spending as excluded.
- Aggregate eligible personnel remuneration across contracts, bonuses and related records for annual exclusions. Do not infer the top three from job titles.
- Store determination dates and amounts for allowances. An administrator's 'audited' checkbox alone must not manufacture regulatory relief.

Completion check: all three views reconcile for a deposit, delivery, first use, removal, reinstallation, credit, write-off and year rollover. No duplicate cash or cap entries after reload.

### F2 — Make affordability consistent

Use one authorisation service from negotiations, projects, purchases and facility upgrades.

For every proposal show separately:

1. Cash required now and on every later instalment date.
2. Lowest unrestricted cash after existing obligations.
3. Department commitment remaining.
4. Cap effect by recognition year, including a clear range for unresolved treatment.

Use exact dates for checks; monthly graphs are summaries. Enforce the same policy through every entry point. Distinguish a discretionary approval budget from cash and the regulatory cap. Budget overrides can require a recorded decision; a cap limit cannot be increased by an owner deposit.

Opening cash that is unknown remains unknown. Offer an explicit setup/incomplete state until a scenario is selected; never show a definitive affordability success based on missing operating costs. Keep the existing no-restrictions setup behaviour clearly identifiable until the user enables a complete financial scenario.

Completion check: a large future receipt cannot conceal an earlier payment shortfall; splitting an order into instalments cannot bypass the checks.

### F3 — Establish usable starting information

Create one reviewed financial profile per team containing cash/debt status, contracted income, employment costs, operating commitments, assets and supplier terms. Reuse supported existing records. Public sponsorship identity does not establish its confidential payment amount.

Allow two explicit data choices: recorded values, or an approved game scenario. Never silently import the provisional team-baseline finance estimates. Unknown is distinct from zero.

Before selecting a scenario, show a preview of all records it creates. Store version, provenance and effective date. Freeze the resulting snapshot within the career. New reference-data revisions must not rewrite ongoing careers.

Group operating costs into a small number of understandable agreements; do not generate hundreds of dummy invoices to make the page look active. Ownership changes and owner cash contributions remain separate events.

### F4 — Improve normal player workflows

Keep the main pages compact:

- **Overview:** unrestricted cash, next obligations, committed spending, forecast cap headroom and genuine actions required.
- **Payments:** upcoming/overdue/paid filters; open the contract, invoice or project that caused the payment.
- **Forecast:** monthly cash graph, recognition-based cap graph and scenario comparison. Mark uncertainty rather than filling gaps.
- **Budgets:** department allocations, actual costs and commitments. Make the basis explicit for capital spending.
- **Cost cap:** rule version, classification breakdown and a bridge from book expenses to assessed relevant costs.
- **Accounts/setup:** journal, corrections, opening data and administrative rule editing outside the normal buying workflow.

Replace free-text IDs with selectors for people, suppliers, contracts and projects. Link staff employment to actual workforce records. Sponsor agreements originate in Commercial; parts orders originate in Manufacturing. Their finance records appear automatically. Include previews and clear cancellation consequences.

### F5 — Close, reconcile and recover

Add a guided review of missing classifications, outstanding balances, unit costs, asset schedules and prior-year records. Preserve the current backup/import architecture and add a reconciliation report plus data export.

Separate year close from a later regulatory review. Store amendments as explicit dated adjustments. Cap warnings should explain whether the problem is recorded overspend, committed exposure, uncertain classification or incomplete data. Do not invent automatic penalties or financial rescues.

## 4. Manufacturing work

### M1 — One car/specification/inventory model

Define six initial development families: front wing, rear wing, floor, bodywork/cooling, suspension, and brake cooling. Actual purchased brake hardware can remain a supplier component; avoid treating every brake-related item as freely designable aero.

Separate:

- **Specification:** immutable design/version, team, season eligibility, category, compatibility and performance effects.
- **Physical unit:** serial ID, specification ID, cost basis, dates, condition, status and location.
- **Car assembly:** which unique units are fitted to car one and car two.

Use the newer financial order records as the financial source. Do not introduce a second independent stock count. Migrate legacy parts only when their identity and provenance can be reconciled; flag unsupported records rather than fabricate details.

Keep the first performance model small: low/medium/high-speed aero, drag/active-aero efficiency, mechanical performance, cooling, mass and durability. Each part affects only relevant dimensions. Recompute the car from its baseline plus fitted specifications; swapping a part repeatedly must never stack gains.

All teams need a consistent approved baseline. Performance values are game ratings, not real measurements. Do not turn placeholder ratings into supposedly factual engineering data.

### M2 — Design and research projects

Player flow: choose component → choose target season → choose focus → allocate staff/testing → review quote and finish date → authorise.

Start with balanced, performance, efficiency and durability focuses, mapped appropriately to the component. More ambitious work should require more resources or accept trade-offs. Avoid guaranteed universal gains and arbitrary catastrophic failure rolls.

A project has separate design, validation and production-readiness stages. It creates an approved specification, not free parts. Manufacturing copies later does not charge the design fee again.

Use a small dated productivity model. Staff cannot work full-time on two projects. Allocating salaried staff consumes capacity but does not create a second wage bill. External work, materials and agreed overtime can create additional obligations.

Show estimated outcomes before approval. Store any outcome variability once with the project so saving/reloading cannot reroll it. For the first release, simple bounded outcomes and transparent trade-offs are enough.

### M3 — Testing capacity and the calendar

Implement the regulatory operational rules listed above as a reusable season service. Keep facility capacity separate from legal testing entitlement. A better tunnel can improve the quality of available work; buying it must not create extra permission to test.

Expose tunnel and CFD allocation simply, with the underlying counters in a detail panel. Use correct units instead of the legacy MFLOPS pool. Reserve resources for planned tests and consume them when work occurs. Cancellation releases unused reservations, not spent allowance.

Projects spanning a testing-period boundary need explicit allocations in each period. Do not refund consumed testing on rollover. Generate period boundaries by calendar year and use the appropriate standings snapshot.

Schedule shutdowns as non-working intervals for restricted activities. Continue unrelated payments and permitted activity. Move project completion dates transparently and distinguish a shutdown from ordinary weekends; avoid assuming factories only operate Monday to Friday.

### M4 — Production and spares

Choose a validated specification, quantity, production priority and delivery target. Calculate a quote from approved game cost/capacity data and send it through finance authorisation.

Maintain a small queue with finite production capacity. Show work underway, blocked work, expected completions and the next race each order can reach. A delay or rush changes remaining work and costs; it does not rewrite settled payments.

Delivered units enter inspection, then stock. Failed inspection requires explicit rework or scrapping. Keep the first release deterministic unless a defined quality model exists. Distinguish a factory completion date from availability at a circuit through a simple shipment lead time.

Provide spare-target warnings and a re-order preview. Do not spend money through unapproved automatic reordering.

### M5 — Fitting, first use and condition

Provide a two-car comparison showing fitted versions, available replacements, spares and legal compatibility.

Enforce one location per unit: a physical wing cannot be fitted to both cars. Fitting updates the selected car only. Maintain separate installed, first-used and financially-recognised flags. Record condition only from supported use, inspection or damage events.

Repairs require an approved job, cost and time. Removing a unit does not restore its condition or value. A generic retirement result must not automatically be interpreted as an expensive crash.

Apply the sporting restrictions listed above through a legality check and an explicit reason. Support ordinary replacements first; leave exceptional discretionary approvals visible as unsupported until implemented.

### M6 — Make upgrades matter in the existing quick engine

Add a small versioned input for current driver ability and each car's fitted performance. Capture it for each session, preserving results already produced. Allow permitted changes between sessions without rewriting prior snapshots.

Use coarse circuit demands from the circuit data to weight the car dimensions. Calibrate against fixed-seed comparison runs. State the model's limits; predicted benefit is an estimate, not a guaranteed lap-time claim.

This is a narrow integration into the current quick simulator. Live pit-wall commands, full tyre/energy/traffic simulation and race-director mode remain later work.

### M7 — Facilities and suppliers

Start with design office, manufacturing workshop, wind tunnel, CFD capacity and inspection facilities. Each should affect a specific bottleneck: concurrent work, throughput, validation quality or available computing capacity. Avoid a universal instant car-rating bonus.

Facility upgrades have a quote, construction/commissioning dates and any temporary capacity loss. Connect their asset/payment records to existing finance APIs. Record real game maintenance agreements rather than re-enabling arbitrary old upkeep charges.

Use actual supplier identities and dated team relationships from the reference data. Start with customer supply contracts, inventory and reliability/usage records. Import the applicable component allowance table when implementing PU pools, including exceptions and driver changes; do not copy old-season quotas.

A works team's engine operation should remain outside the first manufacturing release. Do not offer unlimited 'engine upgrades' using the chassis development system.

### M8 — Next-season research and rollover

Add research once current-season design/production works. Research creates dated knowledge/design progress against a target ruleset; it does not secretly improve the current car.

Define a small, inspectable carry-over policy. Only apply rule changes actually in the selected scenario, not random annual resets. Compatible stock remains physically available subject to its accounting review and eligibility. Revalidate supplier agreements, capacities and testing allocations for the new season.

## 5. Reference data and career records

Extend existing tables instead of recreating finance tables that already exist in the save.

| Reference/configuration data | Career-owned records |
| --- | --- |
| Season rule versions and effective dates | Frozen applied rule versions and determinations |
| Component catalogue and regulatory sourcing classification | Approved specifications and project outcomes |
| Supplier identities and dated team relationships | Supply agreements and scheduled payments |
| Approved starting car, stock and facility scenarios | Physical serialised units and car assemblies |
| Project cost/productivity assumptions with provenance | Engineer allocations, queued work and progress |
| Facility types and capacity definitions | Facility assets, commissioning and maintenance |
| Testing rules and calendar definitions | Per-period reservations and actual testing usage |
| Financial classification policies | Cap adjustments, first-use events and reconciliation history |

Supabase can hold reference/configuration records. Keep the current career persistence model for gameplay unless cloud saves become a separate requirement. Do not create shared public live ledgers. Owners continue as independent entities with dated relationships; supplier or financial records reference the team rather than assuming a permanent owner.

## 6. Delivery order and acceptance gates

| Release | Scope | Completion gate |
| --- | --- | --- |
| 1. Finance correctness | F1–F2; versioned rules, classification and inventory/accounting corrections | Cash, operating accounts and cap reconcile through year-end; every buying route uses the same checks |
| 2. Starting data and usable finances | F3–F5; approved scenario mechanism, compact views and source links | A team can be configured without filler and the player can explain every displayed movement |
| 3. First complete upgrade | M1–M6 for front wings; minimum staff/facility capacities; real ATR/shutdown scheduler | Design one version, make three units, fit two, retain one spare, advance a session and reconcile everything |
| 4. Broader manufacturing | Remaining part families, M7 facilities/suppliers, M8 next-season research | Two distinct cars, limited resources and next-season progression work without duplicated stock or charges |

Keep independent features behind migration/version boundaries. Do not activate partially integrated legacy features just because functions already exist. Preserve existing user records and provide a migration summary.

Minimum acceptance scenarios:

- An affordable full quote fails correctly if its first instalment is not covered, despite a later receipt.
- An unknown opening balance never becomes zero or a false 'fully affordable' claim.
- A funded but cap-constrained project is refused for the correct reason.
- A production order cannot bypass a department limit by avoiding the ordinary obligation-creation route.
- Advancing one day, skipping several days and reloading produce identical dated obligations and stock.
- Cancelling work preserves sunk costs and testing already used, while releasing genuinely avoidable commitments.
- A project stops for the configured shutdown; salary processing continues as agreed.
- Testing-period rollover cannot duplicate entitlement or let two projects spend the same reservation.
- Manufacture three units; fit two different units to two cars; leave exactly one available spare.
- Unfit/refit one unit without changing its performance specification, first-use history or recognition twice.
- A year-end stock review handles opening/unused/used/redundant units under the selected year's definitions.
- A facility is paid for, commissioned and depreciated without charging its purchase twice.
- An upgrade changes only eligible future session inputs and never archived results.

## 7. Deliberately later

Defer full CFD/CAD or geometry design, component-level material science, full PU-manufacturer R&D/ADUO simulation, detailed corporate group accounting, tax and foreign-exchange markets, multi-bank treasury, forensic audits and appeals, takeover valuation, complex supplier negotiations, autonomous rival transfer strategy, and the full interactive race simulator/race-director experience.

Keep the extension points, but finish the first front-wing upgrade loop before expanding into those systems.
