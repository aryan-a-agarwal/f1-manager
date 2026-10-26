# Sortable driver database

Database → Drivers now uses the shared paginated profile catalogue to show every driver identity and any unmatched legacy driver. It provides selectable attribute groups, biography and imported career totals; every displayed column sorts in both directions. Unknown and unallocated values remain last in either direction. Real zero values sort numerically. Driver names retain full-page profile links.

Search is insensitive to case, accents and punctuation. Appointment, recorded-series and rating-coverage filters combine with search. Multiple stat groups may be selected together, or All stats / Identity only may be used. Hidden sort columns reset to name. View settings survive opening a profile and returning, using optional session storage.

2027 appointments use the latest database starting scenario and preserve shared reserves as one driver row. Recorded series may be historical. Age uses the saved career date. Ratings reuse the profile allocation policy; imported overall ratings remain independent values. Legacy statistics use the latest totals snapshot, not a sum of snapshots, and remain separate from career simulation results. Database identity IDs and legacy driver IDs are never equated.

This is a read-only view and does not mutate Supabase or saves. Staff, teams and circuits retain their existing views. Both game layouts use the same table.

Tables fit the content width with no horizontal scroll. Race attributes are the default group. Selecting several groups stacks one table per group vertically, repeating driver identities and team context. Narrow screens split larger groups into smaller vertical tables rather than hiding columns or requiring sideways scrolling. Identity only shows the sortable identity columns. All rows scroll with the page, without an inner vertical scroll area.

Validation: database-model tests cover identity joins, shared appointments, unrated defaults, latest statistics, numerical zero, unknown-last sorting and unique columns. Existing driver-profile and navigation tests pass; production build and browser behavior are checked before delivery.

Final browser verification: 91 drivers; Pace descending starts Verstappen 98, Leclerc 93, Norris 92; unknowns remain last. The reserve filter returns 21 unique people, with Tsunoda appearing once for both teams. Profile links and the back arrow work. All seven group tables contain 91 rows and have no horizontal overflow at the current viewport (1084px content width). Screenshot: `ui-previews/sortable-driver-database.png`. Production build and the three relevant test suites passed.
