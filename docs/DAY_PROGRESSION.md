# Day-by-day progression

Adapted from the IPL Simulator overview's ticking calendar: Continue drops down a strip showing yesterday, today and five upcoming days. Each tick advances one saved game day (850 ms between committed days, with a 400 ms tile slide). Stop and Escape cancel progression; the dropdown can also preview the schedule or advance a single day.

The panel enters and leaves with a 650 ms vertical slide. Calendar motion explicitly overrides the broad reduced-motion stylesheet rule for this player-requested animation. A required event closes the panel and displays a short pause notification.

Both F1 interface layouts use the same control. The old instant next-event, next-week and next-GP header shortcuts have been replaced. Time still passes through the existing F1 scheduler, which processes routine milestones and stops at the exact time of mandatory sessions and decisions, including multiple sessions on the same day. Sessions require an explicit action in the race centre; the ticker does not simulate them. Each day is saved; reload returns paused at the last committed date. No remaining actionable events disables progression.

Validation: day-progression regression visits intermediate days and verifies the first mandatory session cannot be bypassed or implicitly completed. Existing timeline, game-time and calendar-integration suites passed. Production build includes TypeScript validation. Browser review checks the populated dropdown on the current Australian GP weekend, Escape dismissal and required-action routing without simulating the user's session.
