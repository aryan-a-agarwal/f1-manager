# Contract desk: reference and draft stage

Available under Team → Contracts in both layouts. The 2027 canonical Supabase data is copied into an optional `contractDesk` career field on the first visit. Setup requires a valid dataset, mapped driver/team identities, at least 22 race references, and 44 distinct race/reserve reference slots. Existing schema-8 saves remain compatible without adding placeholder contracts to unopened careers. Reference updates do not overwrite an initialized baseline.

The page shows saved reference provenance, the player's two race and two reserve reference positions, existing career race occupants, and source-linked commitments for the player's team or the whole grid. Reference disagreements and unknown salaries/expiry years remain explicit. No driver is treated as available merely because terms are missing. Reference reserve capacity is distinct from a career appointment.

Draft offers support a driver, race/reserve role, one of two positions, a start season from next season to five years ahead, one to five covered seasons, and a player-entered positive USD annual salary. Amounts use exact integer cents. Drafts can be saved, edited or withdrawn, keeping withdrawn history. Repeated saves update the same draft. Draft checks flag uncertain availability, known coverage overlapping the requested start, unresolved incumbent obligations, and overlapping plans for the same driver or seat. Later-season rollover marks outdated start seasons for review.

These are planning records, not accepted contracts. No draft changes a lineup, creates a reserve appointment, contacts a driver, reserves a seat, creates a financial obligation, or makes payments. Binding offers, driver acceptance, approved finance/affordability rules, roster reconciliation, temporary substitutions and operational expiry/reminders remain subsequent work. Calendar play continues independently.

Every change goes through existing validated career persistence and its recovery backup. Failed writes keep the previous career intact. The contract subsystem validates optional imported save data, including identities, reference shape, exact cents, two positions and supported draft states. Supabase is only read; no shared reference data is edited.

Validation: focused tests cover complete/frozen baselines and save/reload, idempotent edits and withdrawals, unknown terms and overlapping drafts, two reserve positions, invalid terms, unchanged rosters/no finance, and failed persistence. Career-save, day-progression and profile-navigation regression suites pass. Production build includes TypeScript validation.

Ticker adjustment accompanying this release: 850 ms per day, with a 400 ms date-tile animation; the panel retains its 650 ms smooth entrance and exit.
