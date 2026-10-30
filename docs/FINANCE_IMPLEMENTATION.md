# Finance implementation

The finance roadmap is implemented as career-owned records and workflows. Unsupported amounts remain unset. There are no automatically seeded budgets, sponsorship receipts, supplier prices, staff salaries, loans or prize distributions.

## Where to use it

Finances retains the five monitoring tabs. Its **Finance workspace** selector opens Opening position, Agreements & funding, Invoices & settlements, Budgets & scenarios, Asset register, Ownership, Reporting & accounts, Personnel finance and Team financial planning. The same forms remain available in the original interface.

Manufacturing now has explicit project/order and inventory workflows. Commercial has recorded agreements and an explicit championship distribution policy. Existing driver negotiations use recorded release agreements and payment obligations.

## Roadmap delivery

| Plan area | Delivered behaviour |
| --- | --- |
| Opening position | Dated cash/debt anchors, restricted cash, explicit unknowns, source notes, existing assets and opening payables/receivables |
| Accounting | Integer cents; balanced journal lines for new records; separate recognition and settlement; receivables, payables, inventory, assets, depreciation, debt, equity, income and expense accounts |
| Invoices | Scheduled/due/part-paid/paid/overdue/disputed/cancelled states; partial settlements, credit notes, refunds and classification reviews |
| Funding | Explicit owner equity and loan agreements, recorded instalments, principal versus interest, early repayment fees and protected outstanding debt |
| Revenue | Recurring or explicit instalment agreements; guaranteed versus conditional receipts; sponsor result bonuses and corrections |
| Championship distributions | Explicit per-position policy and payment dates; final scored season entitlement; receivable and subsequent instalments; no fabricated real-world payout table |
| Personnel | Named staff employment and earned bonuses, payment timing, increases, termination, driver payment amendments, reserve appearance fees, race/championship bonuses, caps and result corrections |
| Driver releases | Recorded consent and fee, explicit replacement choice, immediate/future activation, correct standings/workforce changes, one payer charge and releasing-team receipt |
| Manufacturing | Research/design/production/facility/supplier/travel orders; itemised costs and instalments; existing-payroll allocation; delivery/inspection; inventory states; credits and cancellation |
| Assets | New purchases, opening assets, residual values, remaining life, relevant/excluded depreciation and disposal without a second cash charge |
| Cost cap | Season rule records, mixed/unresolved classifications, supporting notes, audited carry-forward checks, findings and explicitly assessed penalties |
| Forecasting | Up to ten future seasons; cash, departmental commitments, relevant costs, overdue liabilities, prepaid costs recognised later, uncertainty/coverage indicators and separate planning scenarios |
| Decisions | Cash and restricted-cash checks, future coverage, cap checks, departmental budgets, due-payment funding stops and overdue warnings |
| Ownership | Independent owner identities and dated stakes; transfers preserve history and do not inject team cash; separate funding agreements survive changes |
| Year end | Financial close and stored reports; unresolved costs block close; outstanding balances, assets, debt and future agreements carry forward; no new-season budget reset |
| Other teams | Independent saved finance books; recorded coverage/budgets/objectives/reserves inform proposal decisions; accepted commitments affect later decisions; no generated funding |
| Persistence | Existing career saves, normal backup/export/import, nested financial validation, stable IDs and independent event processing receipts |

## Suggested first use

1. Open Finances → Finance workspace → Opening position. Record known values, their date and source. A zero balance must be entered explicitly; blank remains unknown.
2. Record counterparties and the team's actual game funding/sponsor agreements, including guarantees and instalments.
3. Record existing supplier balances as opening items, then current invoices and named employment terms.
4. Confirm funding and operating coverage only after those records are complete. Incomplete forecasts remain visibly incomplete.
5. Approve department budgets and compare planning scenarios before authorising projects or new commitments.
6. Use Manufacturing to enter actual project costs and production orders. Allocated existing payroll does not create another salary payment.
7. Review overdue invoices, cap classifications and the journal. Close a year only after resolving its accounting treatment.

## Accounting conventions and limits

This is an inspectable game economy. The game uses USD throughout, recorded fixed loan rates, explicit schedules and a ten-season planning horizon. Monthly depreciation uses the acquisition/commissioning month convention. Opening assets continue from the stated accumulated amount over their remaining life. Conditional promises never become guaranteed cash.

The season rule framework references FIA Section D, Issue 08, 1 October 2026. Indexation and team-specific allocations require a recorded decision; no confidential team data is inferred. Staff/supplier classifications and mixed percentages require supporting notes. Regulatory findings and penalties are explicitly recorded decisions; there is no invented automatic fine formula, court outcome, owner rescue or tax rate.

The current championship simulator supplies result events to bonus handlers. These handlers are independent of scoring receipts, operate only on actual simulated participants/results and preserve corrections. Building a new interactive race simulation or race-director UI remains the separately requested final game stage.

Financial state remains in each local career, including other teams' books. The public Supabase reference tables are not used as shared live career ledgers. No starting scenario is silently populated from provisional team finance estimates.

## Validation

Run `npm test` for the complete regression suite. The added suites cover finance operations, nested validation, personnel, agreement bonuses, manufacturing, independent team planning and completion scenarios. Tests include partial settlement, refunds, capital credits, payroll allocation, changing classifications, prepayments, overdue bills, result corrections, ownership transfers, agreed driver releases, early loan repayment and closed periods.
