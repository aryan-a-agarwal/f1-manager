# Finance foundation

The Finances section sits between Manufacturing and Commercial and retains Overview, Payments & commitments, Ledger, Forecast, and Cost cap & rules.

## Records only

Automatic budgets have been removed at the user's request. There are no invented sponsor, owner, prize, merchandise, hospitality or licensing receipts, and no assumed staff payroll, facility or travel invoices. No budget renews on season rollover. The finance engine no longer imports the team-baseline or ownership seed files to generate payments.

Opening cash and debt are **Not set** until recorded. Internal cash movements can still be tracked, but they are not presented as a known bank balance. Cash warnings and contract affordability restrictions are inactive while the opening balance is unknown. The preview calculator states that cash affordability is unavailable. Cost-cap checks still operate on recorded relevant costs.

Payments are generated only from existing career driver contracts, signed appointments, explicit obligations and registered assets. Existing driver salaries and clauses were previously requested by the user and remain in the game; their values are game contract terms, not claims about real-world salaries. No new staff or operating agreements are invented.

## Accounting and rules

Amounts use integer USD cents; compatibility fields use dollars. Recognition and settlement have separate permanent entries with unique IDs. Repeated processing cannot duplicate a payment. Replacements prorate outgoing and incoming payroll, with a correction entry if a replacement is signed after payroll on the same day. Existing contract loyalty, signing, release and termination payments remain connected.

Rules use the linked FIA Section D, Issue 08 (1 October 2026) framework: USD 215m base, applicable calendar adjustments and a clearly labelled 0% indexation placeholder. No team-specific PU integration relief or audited carry-forward is invented. The expanded implementation now includes recorded loans, compliance decisions, result bonuses and Manufacturing workflows; see `FINANCE_IMPLEMENTATION.md` for the delivery map and accounting conventions.

Commitment and asset commands support the implemented purchasing workflows. Purchases and straight-line depreciation are separate. No asset is invented from a facility rating.

## Save cleanup

Career schema 10 / finance book version 2 migrates existing saves automatically, using the normal backup mechanism. The migration removes generated baseline obligations and their journal entries, clears estimated opening cash/debt and automatic budgets, and removes the assumed PU allocation. It preserves driver contract entries, explicit gameplay obligations, assets and genuine transaction history. Cash totals are recomputed from retained records. No live Supabase records or team reference profiles are changed.

## Checks

Finance lifecycle tests cover migration and backup, removing already-posted filler, retaining actual contracts and actions, reload idempotence, no regeneration after advancement/rollover, unknown balance handling, payment deduplication, forecast reconciliation, asset depreciation and affordability for explicitly funded test scenarios.
