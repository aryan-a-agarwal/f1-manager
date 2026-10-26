# Driver and team profiles

Full-page profiles are available in both interface layouts. Driver and team links throughout headquarters, driver lists, championship standings, race results, calendar classifications and the database open the same profile system. Database-only drivers and junior series entrant teams use reference identities, so they do not need a career grid slot.

Profiles combine saved career results and lineups with separately labelled Supabase reference facts, series entries, published contract commitments and reserve capacity. Missing information is shown as unavailable; no salaries, achievements or management systems are invented. Reference loading failures leave local career information usable. This feature does not mutate the database or advance the career.

The header's Back and Forward buttons use browser history. Links preserve the source section and subsection, support direct URLs and normal modified-click behavior, and retain navigation availability after reload. Opening a new page after going back replaces the forward trail. Profile and section navigation reset the relevant content scroll position.

Validation: production build and TypeScript checks passed; profile navigation tests passed (3); career-save calibration passed. Browser verification covered all 22 career drivers, all 11 constructors, Leonardo Fornaroli's reserve profile, Rafael Câmara's database-only profile, Invicta Racing's junior entrant profile, cross-profile links, browser history, reload and both interface layouts.
