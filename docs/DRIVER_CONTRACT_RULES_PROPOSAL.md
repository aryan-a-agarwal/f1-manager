# Driver contracts: proposed game rules

Status: rules proposal; the reference and offer-draft stage is implemented in Team → Contracts. Binding negotiations, transfers, finance, expiry automation and substitutions remain unimplemented. See `CONTRACT_DESK_IMPLEMENTATION.md`. Based on the live database audit of 25 October 2026. These are proposed game mechanics, not a statement of FIA rules or actual private driver agreements.

Subsequent update: the sourced 2027 database snapshot and two reserve slots per team have now been applied as requested. See `CONTRACT_REFERENCE_2027_APPLIED.md`. Career negotiations, paid signings and substitutions remain unimplemented.

## 1. Starting data and trust

- Reference identities and assignments, reported contract terms, approved game assumptions and player-created agreements are distinct records with provenance.
- Every imported term carries source/verification information or an explicit `imported_unverified` label. Unknown values remain null and display **Not recorded**. A missing salary is not a free driver; a missing expiry is not a free agent.
- The starting roster and contract baseline are approved separately. The current generated 2027 career can retain its lineup, labelled as a scenario based on the existing roster, while its contracts remain unresolved. Neither four automatic renewals nor four automatic dismissals should be invented from the 2026 imports.
- Before enabling contract transactions for a driver, resolve their applicable team commitment and effective period through sourced data or an explicit, labelled scenario choice. Never infer a 2027 agreement from a 2026 entry alone.
- No automatic salaries, release fees, driver demands, reputation, loyalty, morale or negotiation odds are invented. Any future balance dataset needs a separate decision.

## 2. Seats and commitments

- Each constructor has two race seats, represented as seat 1 and seat 2. Seat numbers are administrative; they give no automatic performance advantage or first-driver status.
- A driver can occupy at most one race seat at any point in the game timeline. A team cannot enter the same person twice.
- Reserve/junior agreements are a separate later scope. Preserve reference reserve assignments without converting them into race contracts or deleting genuine shared reserve arrangements.
- Race participation requires two eligible drivers at the event entry cutoff. An unresolved vacancy blocks preparing that weekend with a clear explanation; it does not create an automatic replacement. Browsing and time navigation remain available up to that cutoff.
- Signing a replacement for a later season does not remove the incumbent from the current lineup.

## 3. Duration and effective dates

- New game agreements use whole seasons initially: one to five seasons inclusive. Longer imported commitments remain visible and are not truncated.
- Store both the signing timestamp and covered seasons. A contract signed during 2027 for 2028–2029 is a future commitment, not a 2027 race entry.
- Normal recruitment and renewal negotiations can occur throughout a season, but changes become effective next season. A new signing can take effect in the current preseason only before the first session snapshot has been created and after any incumbent obligation is resolved.
- Midseason switches, emergency substitutes, contract options and performance escape clauses are deferred. The UI must not offer them until implemented.
- Expiry occurs after the final covered season's completion, before the next season's lineup validation. The final race is covered even if a calendar is rescheduled. Existing event snapshots and archived lineups never change retrospectively.

## 4. Renewals and recruitment

- A renewal is a new agreement/version beginning immediately after the old agreement ends; it does not mutate or erase the old contract.
- Future overlapping commitments are rejected, including two agreements at the same team for the same seat. A replacement agreement can supersede a previous commitment only through an explicit recorded cancellation/release in the same transaction.
- A driver whose known race commitment ends before the requested start season may be considered for that season. Being out of contract is necessary but does not by itself establish eligibility or acceptance.
- Recruiting an active rival driver before expiry is unavailable in the first release. No invented buyout formula or free poaching. Mutual releases and priced buyouts require a later, explicit financial implementation.
- Existing contracts are honoured; an incumbent cannot be silently displaced. Voluntary termination is deferred until settlement and vacancy handling are implemented together.
- The player can manage only their own team. Rival-team actions and negotiations require a separately approved AI system; the game will not fabricate rival signings in the background.

## 5. Terms and financial boundaries

- Use USD as the initial contract currency, matching the current database. Store exact integer cents and show annual amounts; convert a stored USD-million reference only once, with its original value and provenance retained.
- Proposed salary is a guaranteed annual amount for covered seasons. Unknown reference salary remains unknown. No silent inflation, exchange conversion, signing fee, annual escalator, points bonus or title bonus.
- Exact bonuses can be added later as explicit amounts and triggers. The current `bonus_clause_strength` and salary-tier scores do not create payments.
- Salary commitments, actual payments and available cash are separate concepts. A contract must never credit or debit money just because a record is displayed or loaded.
- Finance is currently unimplemented. The first contract data release may display agreements and validate proposed changes, but **binding paid signings remain disabled until an approved starting finance baseline and affordability/commitment checks exist**. Do not restore the discarded cash defaults just to make a button work.
- Once finance is approved, validate obligations across every covered season, reserve any immediate costs atomically and show the full commitment before confirmation. Payroll timing and bonus settlement are a separate explicit rules decision; until then there are no simulated payments.

## 6. Offers and acceptance

- Offer lifecycle: draft → submitted → accepted or rejected/withdrawn/expired. Contract lifecycle: future → active → completed, with explicit terminated/superseded states only when supported.
- A draft never reserves a seat, changes a lineup or creates a debt. An accepted agreement reserves its future seat immediately, even before activation.
- A driver's acceptance must come from a defined negotiation model or an explicit game-setup decision. No random acceptance, automatic acceptance or hidden demands are supplied by this proposal.
- First implementation: contract records, expiry/reminders, conflict validation and draft previews. Interactive negotiation and confirmed transfers follow only after finance and driver acceptance rules are agreed. This keeps the first addition functional and honest about its boundaries.

## 7. Calendar and season rollover

- Generate reminders from actual, resolved contract dates. Proposed reminder points are 180, 90 and 30 game days before the scheduled end of the final covered season, when those dates are ahead of the current game clock. Recompute unsent reminders if that season's calendar changes.
- Reminders are informational, emitted once per agreement/milestone. They are not prewritten fictitious emails and do not force the player to sign someone.
- Enforce a mandatory lineup validation before preparing the first session of the new season. Show the vacant/conflicting seat and a direct route to resolve it.
- Complete the old season, archive its lineup, expire ended agreements, activate valid future agreements and derive the new lineup atomically. Never copy an expired driver into a new seat automatically, or silently extend their term.
- A person with unresolved imported terms remains a scenario assignment rather than being treated as confirmed contracted or confirmed free. Contract management for that assignment stays unavailable until resolved; it must not corrupt existing calendar play.

## 8. Saving, ownership and failure handling

- Supabase reference rows are shared read-only input. Career contracts, offers and changes belong to the local career. No player action edits `public.driver_contracts` as if it were that career's private world.
- Snapshot the chosen reference/scenario version into the career. A later database update cannot change a saved salary, future signing or played lineup without a deliberate migration.
- Use canonical identity mappings, stable agreement IDs and idempotent action/event IDs. Repeated clicks, reloads or retries cannot duplicate contracts, reminders, commitments or payments.
- Confirm acceptance, supersede an old commitment, reserve a seat and apply financial effects in one validated save operation. Failed persistence leaves the previous contract and lineup intact.
- Keep signed-term history and reasons for changes. Never hard-delete the previous agreement to create a renewal. Keep a recoverable save backup for migrations.

## Implementation acceptance examples

| Situation | Required result |
| --- | --- |
| Alonso's imported row ends in 2026 while the career starts in 2027 | Flag unresolved baseline; do not invent a renewal, claim availability or alter the saved roster. |
| Driver salary has no verified source | Show Not recorded/unverified import; do not show a fabricated zero or automatically charge it. |
| A driver signs a resolved future agreement | Current-season snapshots stay intact; future seat is reserved once. Binding signing requires the finance/acceptance prerequisites. |
| The same driver already has a 2028 race commitment | Reject any conflicting second race agreement. |
| A player reloads after accepting an agreement | One agreement, one seat commitment and no duplicated notifications or charges. |
| A two-year renewal follows an agreement ending in 2027 | New coverage is 2028–2029; the 2027 agreement remains in history. |
| A covered driver's final race is postponed | They remain under that season's agreement through completion; no date-based premature vacancy. |
| The new season has an unfilled seat | Keep the vacancy explicit and block first-session preparation until resolved. |
| Database refresh changes a reported expiry | Existing careers retain their frozen baseline; no silent rewrite. |

## Next concrete deliverable

After approval, prepare the identity mapping and reference-term schema/import plan first. Reconcile the 2027 baseline, then implement the contract list, provenance labels, reminders and validation. Do not enable salary spending, negotiation, paid renewals or transfers before their prerequisites are approved and built.
