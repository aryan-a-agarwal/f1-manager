# Annual driver salaries

The player requested salary values for everyone contracted. `2027-game-salaries-v1` provides annual USD game-balance assumptions for all 23 current contract references, including Leonardo Fornaroli's reserve agreement. It also defines a race salary for Esteban Ocon if a scenario commitment is later resolved. These numbers are intentional gameplay values, not verified or reported private compensation. Vacant reserve positions receive no salary and no driver appointment is created.

The named values live in `lib/career/driverSalaries.ts`. Race and reserve roles use separate mappings; an unknown identity receives no invented fallback. Reference facts, including their null private salaries, remain intact. The career stores a separate, versioned `contractDesk.salaryModel` alongside its frozen reference baseline. Existing contract desks fill only missing salary assumptions; previously saved values and player-entered draft salaries are preserved. A non-null reference salary takes priority in presentation. Driver/team profiles and the Contracts table label assumed amounts as game estimates. No payroll or finance charges run yet.

Values in USD per year:

| Driver | Salary |
| --- | ---: |
| Max Verstappen | 55,000,000 |
| Lewis Hamilton | 50,000,000 |
| Charles Leclerc | 34,000,000 |
| Lando Norris | 25,000,000 |
| George Russell | 20,000,000 |
| Fernando Alonso | 20,000,000 |
| Oscar Piastri | 18,000,000 |
| Carlos Sainz | 13,000,000 |
| Pierre Gasly | 12,000,000 |
| Alexander Albon | 10,000,000 |
| Lance Stroll | 8,000,000 |
| Sergio Pérez | 8,000,000 |
| Valtteri Bottas | 8,000,000 |
| Nico Hülkenberg | 7,000,000 |
| Esteban Ocon (scenario only) | 7,000,000 |
| Kimi Antonelli | 5,000,000 |
| Isack Hadjar | 4,000,000 |
| Oliver Bearman | 3,000,000 |
| Liam Lawson | 2,500,000 |
| Gabriel Bortoleto | 2,000,000 |
| Franco Colapinto | 2,000,000 |
| Arvid Lindblad | 1,500,000 |
| Rafael Câmara | 1,250,000 |
| Leonardo Fornaroli (reserve) | 750,000 |

Checks cover the complete 2027 seed dataset, positive integer cents, separate reserve/race roles, frozen reference preservation, existing salary preservation, source-value precedence and save/reload.
