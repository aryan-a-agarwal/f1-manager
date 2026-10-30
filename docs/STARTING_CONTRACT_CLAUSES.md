# Starting driver contract clauses

Applied to Supabase project oltacisolvyiqjixowvj through its authenticated SQL editor. Verification returned **44 appointments, 370 clauses** in starting dataset `f1-2027-starting-grid-2026-10-26-v2`.

These are game-design assumptions, not confirmed private contract provisions. Existing reference facts, salaries, durations and driver personality ratings were not changed. Packages vary by race/reserve role, career stage, current salary and term; they are not a researched reconstruction of individual negotiating preferences.

- Database: `public.f1_starting_driver_contracts.clause_package`.
- Offline seed: `supabase/seed-data/2027-contract-clauses.json`.
- Reproducible generator: `scripts/build-starting-contract-clauses.cjs`.
- Migration: `supabase/migrations/20261027010000_starting_contract_clauses.sql` (transactional, skips existing packages, checks 44 records).
- New careers snapshot the local seed. Existing v1/v2 starting-grid careers add missing packages on opening Contracts only when person, team, role and end season match. Existing packages, offers and salaries remain unchanged.
- Terms appear in expandable sections in the contract desk and driver profile contract records.

All clauses currently have `execution: recorded_only`. No bonus is paid, salary escalated, participation scheduled, or breach enforced by this change. Negotiation preferences, offers and automatic execution remain separate future work. No presumed loyalty/ambition personality ratings were assigned.

Race result rewards use only the highest eligible finish tier per Grand Prix, exclude sprints and have annual caps. Championship bonuses are separate. Reserve substitution fees require a Grand Prix start. Shared Tsunoda availability gives Red Bull priority; it does not promise availability to two teams simultaneously. Equipment parity permits limited delays. Development promotion reviews do not guarantee a seat.

Validation: production build and contract, starting-grid, reserve, clause/save regression tests.
