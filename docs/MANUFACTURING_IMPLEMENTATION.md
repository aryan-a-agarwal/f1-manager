# Finance and manufacturing implementation

Implemented 29 October 2026 against `FINANCE_MANUFACTURING_NEXT_STEPS.md`.

## Using the new workflow

1. Open **Manufacturing → Performance**. Review the workshop capacities, previous championship position, summer shutdown and cost multipliers, then activate the starting model. This creates two existing car assemblies, not purchase transactions.
2. Optionally open **Finances → Opening position → Reviewed starting profile**. Preview recorded values or a provisional team scenario. Edit/import the JSON before applying. Applying a scenario is explicit and freezes its version in the career. Unknown cash remains unknown until recorded.
3. Open **Manufacturing → Development**. Choose a component, current-season design or next-season research, focus, engineers, testing allocation and priority. Review its cost, expected finish and performance changes before authorising.
4. Advance the calendar. Restricted work pauses for shutdown, queued work respects capacity, and testing usage is retained by aerodynamic testing period. Design completion creates a specification rather than free physical parts.
5. Order a quantity of the specification. Production records its non-refundable deposit and delivery balance, consumes workshop capacity and includes shipment time.
6. Inspect delivered units in **Performance**, then fit separate serialised units to cars 1 and 2. Spare quantities, condition, repair and scrap actions are available there. A part cannot be fitted to both cars.
7. Start a supported quick session. First use records the inventory/cap treatment once; session inputs snapshot the fitted car performance. Finishing the session records distance and condition wear. Archived inputs/results do not change with later upgrades.
8. Review the linked finance records, payment filters, forecast, budgets and reconciliation export. Cash settlement, operating accounts and cap assessment remain separate.

## Implemented scope

| Plan area | Delivered behaviour |
| --- | --- |
| Finance correctness | Supplier advances/customer deferred income; recognition-based forecasting; operating results separate from equity/loan cash; permanent book-to-cap adjustments; zero-residual regulatory equipment depreciation |
| Inventory accounting | Production cost remains inventory until consumption; first-use/removal/refit history; unused prior-year stock assessment; recorded manufacture-start and WIP review; cancellation credits preserve audit history |
| Personnel/cap allowances | Annual top-three eligible named-person remuneration aggregation after explicit coverage review; carry-forward requires a separate recorded determination and the existing prior-year checks |
| Classification | Fixed standard operating-cost templates; unresolved treatment retained for review; advanced accounting entries retained for other supported records |
| Affordability | Common dated commitment checks for contracts, staff employment, manufacturing orders and facility work; restricted cash, later instalments, departmental limits and cap exposure considered separately |
| Starting information | Per-team recorded-value templates and optional provisional financial scenarios for all 11 teams; preview, JSON import/edit/export, provenance and no replacement of existing books |
| Player finance screens | Paid/upcoming/overdue filters; links to originating workspaces; monthly cash and recognition charts; existing scenario comparison; reconciliation checklist and export |
| Car components | Front wing, rear wing, floor, bodywork/cooling, suspension and brake cooling; immutable versioned specifications; distinct fitted cars; available, inspection, damaged, repair and scrap states |
| Development | Focus trade-offs, finite engineer allocations, normal/rush quotes, reserved wind-tunnel/CFD resources, validation time, current-season design and dated next-season research |
| Execution | Daily progression, finite production/repair slots, shutdowns, delivery lead time, inspections, cancellation, spare warnings, commissioning and durable history |
| Testing | Six dated periods, prior-season/half-season position basis, 70–115% entitlement, tunnel runs/wind-on/occupancy and CFD geometry/compute tracking |
| Facilities | Design office, production, wind tunnel, CFD and inspection; each affects its own resource; commissioning before benefit; linked asset, payment and depreciation records |
| Suppliers | Customer-unit receipt, supplier identity, agreed incremental costs, serials, seat-based usage and ordinary element limits; existing supply agreements remain the payment source where applicable |
| Sessions and rollover | Coarse circuit-specific car contribution to the quick engine; saved session inputs; distance wear; compatible designs/stock persist; research eligibility and fresh testing periods follow the year |

## Data and migration

- Gameplay remains career-owned; this change does not create a public/shared Supabase ledger.
- Workshop state is optional, version 1. Older careers remain loadable without manufacturing activation. Existing financial transactions are preserved.
- New managed production orders use `capModel: 2`; legacy manual orders retain their original treatment rather than rewriting historical entries.
- Reference performance uses the existing team baseline dataset. Applying the workshop snapshots those values within the career.
- Ownership remains a separate identity/dated relationship model. Workshop and finance records identify the team, not a permanent owner.
- No scenario was applied to the user's localhost save during testing. Browser mutations used a separate 127.0.0.1-origin test career.

## Rules and deliberate simplifications

Rules are based on [FIA Section D Issue 08, including 2027 amendments](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_-_f1_teams_-_iss_08_-_2026-10-01.pdf), [2027 Section F Issue 01](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_f_operational_-_iss_01_-_2026-10-19.pdf), and [2027 Section B Issue 01](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_b_sporting_-_iss_01_-_2026-10-19.pdf). This is a management-game model, not a complete regulatory/accounting implementation.

- Costs, productivity, starting resources, gains, wear and the 55% driver / 45% car quick-engine contribution are game assumptions. They are not confidential real-team engineering or financial information.
- Financial scenario amounts derive from the existing provisional team baseline estimates. They remain previews until applied. Aggregate workforce estimates cannot establish individual top-three exclusions; named complete payroll must be reviewed separately.
- Quotes exclude existing payroll. No maintenance, crash charge, supplier fee or owner injection is generated merely to fill a page.
- Facility quotes represent equipment, use a five-year game useful life, and do not reduce existing capacity during construction. Land/buildings and complex group accounting are outside this model.
- Prior-year work in progress uses paid conversion cost as its recorded interim assessment basis; unused delivered stock is reviewed separately. This is an explicit simplified valuation policy, not factory cost-accounting reconstruction.
- Monthly recognition charts exclude unallocated regulatory bridge adjustments and unused-stock reservations. Annual cap forecasts include those assessments. Scenario comparisons appear in the forecast tables.
- Ordinary parc fermé changes are blocked. Discretionary replacement approvals, penalty adjudication and extraordinary PU allowances are not automated. PU stock tracks complete assemblies for EXH, CE and ANC; sub-element combinations remain later sporting work. The ordinary 2027 limits include the stated additional 2026–2028 allowance.
- The same operational framework and configured summer shutdown are carried forward until a new rules scenario is introduced. There are no random regulation resets or invented annual supplier renewals.
- Rival cars use their frozen baseline performance; autonomous rival R&D is not part of this release. Full pit-wall/race-director simulation, detailed CFD/CAD, works-engine development, corporate tax/FX and forensic audits remain the roadmap's later stage.

## Verification

- Production build succeeds, including TypeScript checking.
- Workshop integration suite: 10 passing cases covering activation, three units/two cars/one spare, first use and refit, daily-vs-skip equivalence, shutdown/cancellation, resources/budgets, research/facilities, repair, testing calendar, ordinary PU quotas and quick-session snapshots.
- Finance bridge suite: 9 passing cases covering advances/refunds, book/regulatory depreciation, personnel aggregation, equity/year close/determination, cancellation/stock rollover, all 11 explicit profile previews, dated cash shortfall, cross-year WIP and fixed classification policies.
- Existing finance lifecycle, operations, validation, manufacturing-finance, personnel and contract-appointment suites pass after integration. Full regression rerun on 30 October 2026: all 39 suites passed.
- Browser checks cover persisted design creation/reload, payment filters, finance navigation and incomplete-data forecasts on an isolated test save.

Preview: `docs/ui-previews/manufacturing-workshop.png`.
