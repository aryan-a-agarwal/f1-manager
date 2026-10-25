# Switchable game interfaces

The default game interface now follows IPL-Simulator's original structure: compact main navigation, contextual subsection navigation, persistent date/time controls, and a shared content area. Its cream/ink palette, condensed headings and monospace labels are adapted to F1.

## Navigation

| Main section | Subsections |
| --- | --- |
| Home | Overview, Inbox, Meetings & board, Paddock news |
| Team | Driver line-up |
| Car | Performance, Development, Facilities, Power unit & ATR |
| Commercial | Prize money & merchandise, Sponsors, Finance & cost cap |
| Scouting | Driver market, Free agents & prospects, Staff & engineers |
| Season | Race centre, Calendar, Factory timeline, Team agenda |
| Championship | Constructors, Drivers |
| Database | Drivers, Staff, Teams, Circuits |
| Settings | Interface & appearance |

These destinations use the existing game screens and actions. The new headquarters derives cash, championship progress, roster, messages, projects and partners from the loaded career.

Management destinations use `/game?section=car&view=projects` style addresses, supporting refresh and browser history. Unknown destinations fall back to Home. Subsection navigation controls the existing page tab state through a context; those screens keep their local tab controls in the original interface.

## Restore the original F1 interface

Open **Settings → Interface layout → Original F1**. Select **Management** to return to the new default.

The original sidebar, dashboard, page layouts, skins and controls remain in the original rendering branch of the game page. Original CSS remains in `app/globals.css`. New screen styling is scoped beneath `.management-shell` in `app/management.css`; only the interface selector also appears within the original layout.

Layout preference is stored in `f1-manager-ui-layout`. Management colour preference is stored separately in `f1-manager-management-skin`; the original retains `f1-manager-skin`. Changing interfaces does not replace or recreate the career save.

## Implementation boundaries

- Shared shell, navigation configuration, subsection context and headquarters: `components/game/ManagementShell.tsx`.
- Existing screen integration and layout selection: `app/game/page.tsx`.
- Scoped management styles: `app/management.css`, imported after the original stylesheet.

The IPL project was read for design reference and was not changed. No new package dependencies were introduced. Existing management-engine behavior and the database connection remain outside this interface change.

## Verification

TypeScript check and production build passed. Browser checks covered the eight main content sections, 14 secondary destinations, original-layout selection and reload persistence, original facility tabs, subsection refresh, browser back/forward, and the Continue/event-acknowledgement flow. Navigation resets the content scroll position without resetting the career. Final visual checks also covered the headquarters, development, appearance settings and the independent dark skin. Screenshot artifacts are in `docs/ui-previews/`.
