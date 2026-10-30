# Driver contract proposal workspace

## Negotiation update (27 October 2026)

The page now supports instant driver responses based on role-specific expectations, guaranteed and conditional payments, and the negotiable non-financial terms. Drivers can counter with changed or added clauses. Patience responds to progress, repeated near misses, worsening proposals and extremely low offers. Session state persists with the career; legacy counters remain available. The visible negotiation remains distinct from signing.

An accepted offer may be confirmed as a career appointment when its replacement and release obligations are resolved. A compatible reserve appointment may coexist with a race seat and activates today or on its scheduled start date. An unresolved outgoing obligation or another team's unreleased race driver blocks signing. Scheduled appointments are applied during career progression. Reserve call-up decisions, a system for negotiating another team's release, financial payments, conditional bonus settlement and automatic replacement of an expired driver are not yet implemented. A signed appointment that cannot activate is marked blocked instead of creating a duplicate race entry.

Salary expectations, bonus forecasts, preferences and temperament are game assumptions where recorded data is missing. Starting-reference records are not overwritten with personality ratings. The implementation uses the existing contract-cost conventions and displays unresolved costs separately.

Every resolved driver profile links to a full-page negotiation workspace through the existing history navigation. The URL retains the source section and driver identity.

The desktop workspace fits the game content area in three columns: driver/replacement context, proposed terms, and financial effects. Only the central clause list scrolls when long. Breakdown, release, yearly schedule and conditional costs use tabs. Narrow screens retain an accessible stacked layout with page scrolling.

Supported terms: exact start/end dates (up to five calendar seasons), race/reserve seat, annual base pay, signing payment, annual loyalty payment, salary escalator, race-result and championship bonuses, reserve appearance fees, practice guarantees, simulator/coaching days, commercial appearance caps, equipment parity, promotion review, release fee and termination guarantee exceptions. Standard obligations are implicit.

Proposals are stored in the existing career's contract drafts as optional `negotiation` terms. The Team Contracts desk reopens them in the new workspace. Legacy drafts remain supported. Driver identities outside the original baseline are added only when saving a proposal. No Supabase starting-contract changes are needed: proposals belong to the saved career.

## Financial conventions

- Salaries use actual calendar days and calendar-year denominators, including leap years. Escalation compounds on 1 January after the proposed start year.
- Incoming annual loyalty is payable on every 31 December within the appointment, including a partial first season; a final partial season that ends earlier has no year-end payment.
- The signing payment is due on the proposed start date.
- The overall figure sums known proposed contract and replacement costs. The first-season figure contains the starting season's salary and loyalty, plus signing, incoming release and outgoing termination payments due at the start. Unknown amounts are labelled as excluded rather than treated as zero. These are proposed costs, excluding existing wages before the start date.
- Outgoing compensation uses saved salary, expiry and salary escalation. Full remaining base salary is the default guarantee; a recorded percentage overrides it. Remaining salary is not counted twice.
- The outgoing departure-season loyalty payment remains protected under the seeded no-breach dismissal terms. Earlier earned payments and ordinary salary before replacement are excluded from the incremental replacement commitment.
- A start after existing expiry has zero dismissal cost. Unknown expiry or salary remains unresolved. Same-driver overlap requires an amendment, not a self-dismissal.
- Incoming overlapping commitments, unknown availability, competing saved seat proposals and inconsistent lineup/baseline identities generate review issues. An unresolved hiring release fee is never represented as a complete zero-cost acquisition.
- An overlapping incoming driver contract with another team adds an estimated release payment to the cost. A recorded `release_fee` clause with `amountCents` takes precedence. Otherwise the estimate is remaining scheduled salary, accounting for escalation, multiplied by the guarantee percentage (100% by default), plus protected loyalty for the departure season. This is an explicit game assumption and the final fee and release require the current team's agreement. Expired contracts incur no release fee. Unknown expiry, salary, or clause package leaves the cost unresolved. Shared reserve appointments are assessed separately per team; no same-team release fee is charged.
- Performance bonuses are conditional, shown separately and excluded from committed totals. Future release fees are potential income, not an expense. Budget affordability is not inferred.

Validation covers proration, leap days, escalation, expiry, protection, loyalty, unknown obligations, same-driver overlap, invalid dates/clauses, save round-trip and unchanged roster/clock/finance. Browser verification covers entry from the driver profile, clause addition and live totals.

Next work: agreed release settlement, reserve call-up decisions, contract expiry handling and finance events for salaries, bonuses and compensation.
