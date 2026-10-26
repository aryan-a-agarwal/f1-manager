# Unallocated team ratings

The team schema defines 123 rating, morale, confidence, risk-tolerance and AI-preference fields using placeholder defaults (including 0, 50, 70 and 100). The identity, driver-rating and achievements migrations do not allocate these team attributes. Team profiles now group these fields and label them **Unrated**, without score bars. Identity/reputation opens initially; other categories expand individually.

`lib/teamProfileData.ts` contains the allocation display policy and slug-based team matching, including the Red Bull alias. This policy must be updated when deliberate team ratings are introduced; changing a stored placeholder alone does not establish an allocation. Missing values are also unrated. No database or career-state values are rewritten.

Team identity, driver appointments, salary estimates, historical achievements and saved-career statistics remain separate and unchanged. No team management functionality is activated by displaying these attribute categories.

Validation: the team profile suite checks all 123 schema-defined attributes, defaults/nulls, unique category coverage, team identity resolution and preservation of numeric statistics. Existing driver profile tests and TypeScript checks pass. Production build and browser preview verify the rendered team profile.
