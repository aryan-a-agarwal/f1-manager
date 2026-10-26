# 2027 reserve appointments

Applied dataset `f1-2027-starting-grid-2026-10-26-v2` to Supabase and the game's starting scenario. All 11 teams have two assigned reserve positions with annual salaries. The 22 race seats and their contracts are unchanged.

| Team | Reserve 1 / annual USD | Reserve 2 / annual USD |
| --- | --- | --- |
| McLaren | Leonardo Fornaroli / $750,000 | Pato O’Ward / $1,000,000 |
| Mercedes | Fred Vesti / $750,000 | Joshua Dürksen / $350,000 |
| Red Bull | Yuki Tsunoda / $750,000 | Sébastien Buemi / $1,000,000 |
| Ferrari | Antonio Giovinazzi / $1,000,000 | Dino Beganovic / $400,000 |
| Williams | Luke Browning / $500,000 | Victor Martins / $500,000 |
| Racing Bulls | Yuki Tsunoda / $750,000 | Ayumu Iwasa / $500,000 |
| Aston Martin | Jak Crawford / $600,000 | Stoffel Vandoorne / $1,000,000 |
| Haas | Jack Doohan / $750,000 | Ryo Hirakawa / $750,000 |
| Audi | Théo Pourchaire / $700,000 | Zane Maloney / $500,000 |
| Alpine | Paul Aron / $500,000 | Kush Maini / $350,000 |
| Cadillac | Zhou Guanyu / $1,000,000 | Colton Herta / $750,000 |

## Facts and assumptions

Every salary is a game estimate for the F1 reserve retainer only, excluding other championships. Reserve agreements run through 2027. Fornaroli's 2027 appointment is publicly confirmed; the remaining appointments are explicit game continuations, promotions or assumed moves. Current affiliations do not prove a 2027 contract.

Tsunoda is one person shared between Red Bull and Racing Bulls, with two $750,000 retainers ($1.5 million total). Availability conflicts and substitutions are not implemented.

Dürksen, Buemi, Beganovic, Martins and Herta are promoted from development/test affiliations for the game's second reserve position. Audi's choices use former Sauber reserve connections; they are not announced Audi 2027 appointments. Pourchaire's move from his Mercedes development affiliation and any required release are assumptions.

Source context:

- [Formula 1 reserve-driver overview](https://www.formula1.com/en/latest/article/who-are-the-reserve-drivers-for-each-f1-team-in-2026.Ce8YvwuVJGLkVNgERX21U)
- [Mercedes 2026 launch and development roster](https://www.mercedesamgf1.com/news/mercedes-amg-f1-season-launch-2026-a-new-era-begins)
- [Red Bull reserve role and shared arrangements](https://www.redbull.com/int-en/red-bull-reserve-driver-role)
- [Williams appoints Victor Martins](https://www.williamsf1.com/articles/fabfd57a-aa43-455e-b8a8-f93fca838071/atlassian-williams-f1-team-victor-martins-test-development-driver)
- [Former Sauber reserve appointments](https://www.formula1.com/en/latest/article/sauber-announce-new-f1-reserve-driver-ahead-of-2024-season.ZA2hMYCskJZBwsbJEpyrH)

## Persistence and verification

Migration `20261026010000_reserve_driver_contracts.sql` is additive and versioned. The v1 scenario remains stored and its seed is archived as `2027-starting-grid-v1.json`. The current view exposes 44 agreements and 44 filled positions. Public access remains read-only. Minimal identity records were added where needed; unknown biographical fields were not invented.

New careers include reserve workforce agreements. Existing 2027 careers with a contract desk receive an additive update on load, using the normal save backup. Race lineups, clock, results, offers, existing salary choices and later custom reserve choices are preserved. Reserve cards appear in Contracts and full-page team/driver profiles. Payroll, race eligibility, licensing and reserve substitutions remain future work.

Verification covers SQL upgrade/repeatability, constraints and read-only access; live REST parity (`RESERVE_ROSTER_2027_VERIFICATION.json`); all teams' appointments and salary consistency; shared identity; legacy-save preservation, persistence and idempotence.

Final validation: all 20 game test suites passed, including the 20-season calendar soak; production build passed. Browser verification confirmed the existing career's date and race lineup were retained, both Aston Martin reserves appeared with salaries, a newly added Vandoorne profile opened correctly, and McLaren's Contracts page showed Fornaroli and O’Ward with annual retainers. The local production server runs on port 3110.
