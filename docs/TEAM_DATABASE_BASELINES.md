# Team baselines and ownership

The 2027 team baseline is a starting scenario for the game, not a claim about teams' confidential ratings, finances, objectives or future ownership. It provides 123 ratings, 25 facility values, 23 financial assumptions and four objectives for each of the 11 teams. Ratings are generated from team-specific assumptions and field-specific variation; driver costs use the existing starting-contract salary estimates. The financial values are provisional modelling inputs, in millions of US dollars, and are not audited budgets or a cost-cap calculation. Unknown factual details and unsupported ownership percentages remain unknown.

The inputs and reproducible generators are in `supabase/seed-data/2027-team-baselines.json`, `supabase/seed-data/2027-team-ownership.json`, `scripts/build-team-baselines.py`, and `scripts/build-team-ownership-migration.py`. Ownership references are stored alongside the relevant starting relationships. The 2027 owner relationships are projections from available information rather than confirmed future ownership.

The migration creates separate baseline, owner, owner-baseline and dated team-ownership tables. Owner entities are independent of teams and may be associated with more than one team. Relationships record their dates, role, optional share and evidence. The migration adds read-only access for anonymous and authenticated game clients; writing remains protected. It does not change existing career saves or overwrite the existing reference tables. Existing legacy placeholder ratings remain distinguishable from the versioned, assumed ratings.

Until the migration is applied, the game displays the bundled data as a clearly labelled local preview. This does not mean the live Supabase database contains the new records. The migration must be reviewed and applied before the database becomes the source of those records.

`lib/career/teamOwnership.ts` provides an isolated dated stake-transfer model that preserves historical periods and leaves the original snapshot unchanged. It is a foundation for future ownership gameplay; persistence, takeover negotiations, valuation, decisions, and scheduled ownership events are not yet implemented. Transfers involving unknown shares require the shares to be resolved first.

Run `npm run test:team-baselines` to check coverage, existing salary consistency, display behaviour and ownership history.
