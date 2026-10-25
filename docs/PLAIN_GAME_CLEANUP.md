# Plain game cleanup

Superseded in part by `MANAGEMENT_RESET.md`: assumed starting management resources and unfinished controls have now also been removed from the active game.

Removed authored demonstration content from the application defaults:

- Five scripted emails and five matching calendar meetings/deadlines.
- Four news stories, five social posts, generic driver quotations and three board mandates.
- Two automatic development projects and their scheduled notifications.
- Seven pre-filled sponsor contracts and three sample offers.
- Invented opening ledger transactions, merchandise income and monthly projections.
- Hardcoded dashboard budget, confidence display and pre-season championship claims; dashboards now use saved career values or an empty state.

Kept the playable foundation: calendar/session formats, results and standings, teams/drivers/reference database, starting cash, car/parts/facilities, development controls, workforce and management functions, and both interface layouts. Starting resources and simulation ratings are still game configuration; they have not been certified as real-world financial or performance data. Prize figures are labelled game estimates.

Schema 7 performs a one-time cleanup of known demo IDs in existing careers. It retains the previous save in the usual backup slot, preserves the clock date, race records, standings, player-created projects/messages/events and actual transactions, and clears blockers tied to removed demo items. Opening fictional spending is removed from cost-cap totals; current cash is preserved. Unfitted parts manufactured by the two demo projects are removed; already fitted equipment is retained to avoid silently changing the player's car.

Populated management scenarios now live under `calibration/fixtures/` solely for regression tests; the game does not import them.

Validation: the existing 14 suites passed, including multi-season coverage; the added plain-career suite passed both fresh-state and legacy-cleanup scenarios. Production build and TypeScript checks passed. The browser confirmed an empty inbox/news/social feed and that the already-completed Australian GP remained in the calendar after save migration. The preview was refreshed on port 3110.
