# Driver negotiations v2 — implementation handoff for Terra

Status: design only. Prepared 27 October 2026 against the current working tree. No gameplay implementation is included in this document. Numerical values below are initial game-balance settings, not claims about real driver personalities or private contracts.

## 1. Required outcome and boundaries

Implement instant, persistent negotiations in which a driver evaluates the complete package, explains the important objections, changes or adds relevant clauses in counteroffers, and reacts to the player's conduct. Talks end in driver acceptance, player cancellation, or driver withdrawal. A rejected individual offer can leave talks open; distinguish that from ending negotiations.

Preserve the current three-column page and automatic replacement of the middle-column form with the driver's counteroffer. Preserve Today and event-based start dates, 1–5 seasons, reserve appointments alongside another team's main appointment, and financial-impact estimates. There is no affordability restriction. Team release costs and outgoing compensation remain relevant estimates but do not count as money paid to the incoming driver.

Responses are immediate. Do not implement response timers, email filler, fabricated competing offers, race simulation, or finance-ledger deductions in this work. Standard obligations remain implicit; only negotiable commitments and exceptions appear in the clause editor.

## 2. What exists and must change

| Current location | Verified behavior | Required change |
|---|---|---|
| `lib/career/offerNegotiation.ts` | Values salary plus signing payment divided by calendar seasons; fixed frustration increments; ends after six offers or frustration 70; counters only salary | Replace with a versioned package evaluator, conduct history, preference model and counteroffer generator |
| `lib/career/negotiation.ts` | Defines 15 editable clauses, date/proration conventions, incoming release and outgoing termination estimates | Share clause semantics and payment schedules with the evaluator; do not duplicate financial arithmetic |
| `lib/career/contracts.ts` | Stores negotiation state inside drafts; validates saves; blocks modifying ended sessions | Version/migrate negotiation state and add independent session/relationship persistence |
| `components/game/ContractNegotiation.tsx` | Immediate responses, colored heading, counteroffer fills form, accepts exact displayed counter | Retain interaction; add issue feedback, patience labels, changed-field markers and clearer terminal states |
| `lib/career/contractClauses.ts` and starting clause seed | Starting-contract clause packages have different identifiers/parameters from editable clauses | Add a tested normalization adapter; do not assume the two representations are interchangeable |
| `calibration/offerNegotiation.test.ts` | Four basic tests | Replace/extend with scenario, invariant, migration and UI coverage |

Important gaps: no-reference drivers currently anchor their demand to the player's own offer; role changes use a fixed 0.2/5 salary multiplier; any active major-team racer or racer aged 30+ refuses a reserve role. These shortcuts must be replaced. Legacy `paddockMarket.ts` contains personality-like numbers: do not treat them as deliberately allocated database ratings without checking their provenance.

Acceptance currently records an accepted draft; it does not activate an appointment. Keep driver agreement and contract execution distinct throughout the work. Existing documentation that says acceptance is entirely unimplemented is also outdated and must be revised.

## 3. Resolve context before opening talks

Build one canonical context resolver, used by evaluation, the editor and acceptance. Resolve stable person/team IDs, current and future appointments, expiry, actual playing date, proposed start date, reserve commitments, current pay, deliberately allocated attributes, and known team competitiveness. Prefer saved-career state over the imported starting baseline; baseline data is a fallback, not permanent truth.

Create and persist a context snapshot when talks start. Record input provenance: recorded, calculated, game assumption or unknown. Evaluate role willingness at the proposed start date: a driver whose race contract expires before then is not still an active racer for this purpose. Changing role/start/duration recomputes relevant demands without clearing conduct history.

Missing salary must never make the first offer the driver's expectation. Use a configurable role-specific market model from comparable recorded salaries, ability/experience where known, and a declared fallback band when evidence is sparse. Clamp extrapolation and log its provenance. Reserve retainers have their own bands and duties; never multiply an elite salary by 20% as the universal reserve price.

Freeze demand inputs during a session to prevent reloads or unrelated reference refreshes moving the goalposts. A material career change invalidates stale counters and triggers an explicit re-evaluation. Never silently accept an obsolete appointment or date.

## 4. Preferences, willingness and demands

Each session has a persistent negotiating profile with these axes:

- Security: guaranteed compensation, termination protection and a suitable term.
- Earnings: total credible compensation, wage growth and signing payment.
- Sporting ambition: race opportunity, competitive team and equipment commitments.
- Development: useful practice, promotion consideration, flexibility and salary progression.
- Autonomy: workload, commercial duties, release flexibility and other appointments.
- Negotiating temperament: initial patience, insult sensitivity and willingness to compromise.

Each demand is typed: hard requirement, important preference or tradeable preference. It has an opening target, acceptable range, reservation boundary and explanation. Opening demands may be above the minimum acceptable package; repeated submissions must not reveal or ratchet down that minimum automatically.

Use actual allocated personality attributes when available. Otherwise use moderate contextual priors and small stable seeded variation, explicitly stored as game negotiation assumptions. Do not write invented loyalty, ambition or patience ratings back into driver database profiles. Do not interpret on-track aggression as financial greed or fitness as patience.

Career stage changes preferences rather than deciding them alone. A developing driver may prefer escalation, practice and a shorter commitment; a driver seeking stability may value a longer term and protection; a confident competitive driver may favor achievable result bonuses. High recorded loyalty should especially favor continuity with the existing team, not make the driver equally loyal to every bidder.

Role willingness is a separate gate. An established racer under contract can refuse reserve-only employment or a concurrent reserve arrangement that conflicts with race duties. A driver leaving a race seat can consider a reserve future. Declared refusal is not overcome by an unlimited salary. Avoid permanent team-name lists and an automatic age-30 cutoff; use recorded context, proposed start date and a persisted willingness decision. Race seat 1/2 is a slot, not a lead-driver promise: do not infer lead status from its number.

## 5. One clause registry and explicit semantics

Extend the existing registry rather than building a parallel salary-only engine. Each entry needs role eligibility, units, normalization, default/absence meaning, bounds, financial schedule behavior, player-benefit direction, driver preference axes, conditional valuation, counteroffer edits and explanation keys.

| Clause | Evaluation and possible driver counter |
|---|---|
| Signing payment | Guaranteed once at contract start; can trade against recurring pay, with duration and protection considered |
| Annual loyalty payment | Payable at the existing year-end trigger; value survival/forfeiture conditions correctly; increase or add when continuity matters |
| Annual salary increase | Compound on the existing schedule; assess later-year pay, not just year one; young/improving drivers may request it |
| GP win bonus | Value credible wins; can increase instead of some guaranteed pay, within the risk limit |
| GP podium bonus | Value podium outcomes excluding wins where the win tier takes precedence; may be a preferred counter lever |
| GP points-finish bonus | Value points finishes excluding higher paid tiers; can be more useful at a weaker team than a win bonus |
| Championship bonus | A low-probability annual event; never equivalent to guaranteed salary |
| Reserve race-start fee | Conditional on actual substitute race starts; does not assume a full season of starts |
| Guaranteed practice appearances | Positive development value with diminishing returns; validate feasible remaining opportunities and calendar conflicts |
| Simulator/coaching days | Workload obligation, not a cash bonus; excessive days reduce attractiveness; modest development benefit only where the profile supports it |
| Maximum commercial days | Lower cap generally helps autonomy; value relative to implicit standard duties, not raw numeric size |
| Equal equipment | Sporting preference; may be required by some race drivers; never a guarantee of first-driver status |
| Annual promotion review | Modest development value; explicitly a review, never a guaranteed race seat |
| Fixed release fee payable to team | Restricts future mobility; a high fee usually harms driver utility; not income for this driver |
| Termination salary protection | Absence means the established 100% guarantee; reducing it is an exception and may require additional compensation or be refused |

Define defaults centrally before valuation. Missing monetary bonus = zero, missing parity/review = no extra promise, missing practice guarantee = no extra guarantee. For duties, prefer a recorded applicable standard; otherwise use explicitly documented role defaults in configuration (initial defaults: commercial 10 days/year, simulator 10 for race and 20 for reserve). These are game rules, not observed real terms. Missing release clause means ordinary release negotiation, not a free exit or an infinite fee. Zero-valued clauses must have explicitly defined effects and cannot earn benefits merely by existing.

Keep race-result bonuses race-role-only for this release, consistent with the current editor; reserve race starts use the appearance fee. Do not silently expand bonus eligibility. Current highest-tier-only race payments and sprint exclusion remain authoritative. If an outcome reaches a higher tier with no bonus defined, use the highest eligible defined tier consistently in both forecast and settlement.

Optional future terms such as first-driver status or guaranteed promotion need their own schemas and enforcement. Do not pretend existing parity/promotion clauses already provide them.

## 6. Package valuation

Return a structured assessment, not just one score: guaranteed pay by season, security-adjusted value, conditional expected value, noncash benefits/burdens, hard failures, important shortfalls, total utility, and top reasons.

Reuse `salaryBetween` and the existing payment schedule for exact days, leap years, escalation and year-end loyalty. Normalize comparisons over actual contracted service (sum of each year's contracted days divided by its year length), not simply the number of displayed seasons. Evaluate the minimum guaranteed pay over the term and per covered year, so a huge late escalator cannot hide unacceptable initial pay. Signing money can satisfy part of this requirement but cannot remove basic recurring-pay/security requirements.

Suggested internal normalized model (all tuning lives in config):

```
cashRatio = securityAdjustedPresentValue / referencePackagePresentValue
bonusRatio = riskAdjustedExpectedBonusPresentValue / referencePackagePresentValue
utility = 100 * (cashRatio + min(bonusCreditCap, bonusRatio))
          + sum(weightedNoncashBenefits) - sum(weightedBurdens)
```

Use an initial annual discount rate of 5%, consistently from the proposed start date; uncertainty about a distant start is a separate contextual preference. Salary/signing have scheduled full value; contingent loyalty uses a separately documented retention assumption. Protection affects dismissal exposure through a bounded security modifier and/or security preference, not by multiplying the whole salary by protection percent. Avoid counting the same security benefit twice.

Initial bonus credit cap: 10% of reference value for security-focused profiles, 20% balanced, 30% performance-focused. Bound aggregate noncash utility to ±20 points initially. Driver-specific acceptance thresholds and hard floors are stored in the demand profile and calibrated by fixtures. No combination of speculative bonuses or soft promises can override a hard role refusal or minimum guaranteed-pay floor.

Bonus forecasts use saved results when adequate data exists. Otherwise use a versioned, disclosed game forecast based on team/driver tiers with broad uncertainty. Store race-count and probability assumptions; do not fabricate past results or simulate a season behind the scenes. If competitiveness is unknown, use conservative broad priors and do not make a performance bonus a hard requirement. Valuation uses the new team's prospects, not the old team's.

Compute mutually exclusive win/podium-only/points-only probabilities per eligible GP, then value only the paying tier. Use actual remaining scheduled GPs for partial seasons; explicit assumptions for unbuilt future calendars. Championship probability and substitute-start probability are separate. Apply a risk haircut (initial 0.4–0.8, profile-dependent) and the bonus credit cap. Very large unlikely bonuses must not buy acceptance for a token salary.

Keep the player's overall and first-season financial impact unchanged in meaning. Conditional exposure remains separate and labeled estimated. Incoming release fees and outgoing severance never improve driver utility.

## 7. Patience is about conduct and progress

Store patience (0–100), trust (0–100), stagnation streak, repeated-objection counts, best package evaluation, consecutive improvements, final-warning state and prior offered terms. Initial patience 55–85 and trust 60 are configuration starting points; variation is seeded once and persisted. Show qualitative patience, not hidden numerical acceptance thresholds.

Classify each submission against previous player offers, the best package so far, the latest driver counter and previously explained objections. Canonical comparison sorts clauses, converts money to cents, expands implicit defaults and ignores irrelevant ordering. JSON string equality is insufficient.

Initial conduct policy:

| Conduct | Response and patience consequence |
|---|---|
| Credible first opening below demand | Explain 1–3 main issues; counter; 0–3 loss |
| Meaningful improvement | Counter or accept; 0–2 loss, with limited earned recovery after sustained progress |
| Genuine trade: salary down but useful clauses improve the package | Judge total utility and hard floors; no automatic salary-cut penalty |
| Near miss, first time | Small concession where within limits, or focused counter; no large penalty |
| Near miss repeatedly addressing none of the stated gap | Escalating loss: 4, 8, 12, 16; final warning before withdrawal |
| Same materially equivalent inadequate offer | Escalating loss: 8, 14, 20, 26; changing clause order or pennies does not help |
| Material worsening from the best proposal | 8–16 loss and a specific explanation; do not punish valid like-for-like tradeoffs |
| Removing/reducing an explicitly important term without replacement value | 10–18 loss; explain which demand was ignored |
| Repeating a declared hard-role refusal | First rejection identifies the blocker; repeated insistence loses 15–25 and eventually ends talks |
| Very weak package | 15–25 loss; serious warning or refusal to counter |
| Insultingly low package | Immediate withdrawal when plainly extreme; no meaningless salary counter |
| Invalid amount/date/incompatible clause | Inline validation error; not an offer round; no patience cost |

Select one primary conduct penalty per round, plus at most one distinct ignored-requirement modifier capped at 8; do not stack repeated/weak/worsened penalties for the same behavior. Scale by stored sensitivity. Use `Pnext = clamp(P - penalty + earnedRecovery, 0, 100)`; trust uses smaller deltas. Recovery is earned only for a new best package after two meaningful improvements, at most 3 per round and 6 per session. It must not undo serious insults or enable endless improve/worsen farming.

Meaningful progress: initial threshold is at least 2 normalized utility points of new-best improvement OR closing at least 20% of a currently important shortfall without reopening an equivalent one. Token increases do not reset stagnation. A different equally acceptable trade structure can be explored once without penalty; cycling between equivalent packages counts as stagnation.

Insult test must use role-specific, prorated guaranteed value plus credible package value, not salary alone. Initial immediate-withdrawal rule: guaranteed value below 20% of the role's minimum acceptable guarantee AND total utility below 40% of the acceptance threshold. Values below 50% of the guarantee with a weak overall package are very low, but not automatically insulting. A low-salary/high-signing package may be legitimate; low salary plus impossible championship bonuses is not.

Normal dissatisfaction ends talks at patience 0; give a final warning when projected/remaining patience falls into the last 15 points, except extreme insults or a repeated explicitly final refusal. The warning explains what still needs to change. A complete acceptable package submitted to an open session can still be accepted on the final opportunity. Never randomly reject the exact still-valid counter the driver just proposed.

Remove the six-round automatic exit. Good-faith productive talks can last longer. Stagnation, withdrawals and reservation boundaries terminate fruitless talks; cap persisted display history separately from decision state so storage limits do not become gameplay rules.

## 8. Counteroffers must be coherent and acceptable

Generate candidate packages from the latest player offer and stable demand profile. Candidate actions include increasing/decreasing amounts, adding a relevant clause, removing an objectionable term, changing term length/start option, and proposing compensation tradeoffs. Do not silently change role or seat: explain role refusal and let the player choose a different appointment.

Algorithm:

1. Find hard blockers and the three most important unmet preferences.
2. Repair terms that can be repaired within the selected role/date options.
3. Generate a bounded candidate set: guarantee-led, bonus-led, security/development-led, and a minimal-change version. Each should normally alter only 1–3 terms; more changes need a clearly explained package restructuring.
4. Value each candidate using the same evaluator and hard gates used for player offers. Reject impossible dates, unaffordable-in-schema values, irrelevant clauses or infeasible promises. Do not test team budget.
5. Prefer an acceptable candidate closest to the player's expressed structure with the least unnecessary cost. Apply stable preference-based tie-breaking. Never invent a demanded clause solely for random variety.
6. Re-evaluate the chosen candidate; it MUST be acceptable immediately under its saved context. Store that complete immutable counter and the changed fields/reasons.
7. If no valid counter exists, reject with a useful reason. End talks only under the withdrawal rules or an explicitly final incompatibility.

Concessions are bounded by the stored reservation package. Allow smaller opening premiums as the player makes meaningful concessions; repeated identical offers must not cause the driver's target to drift downward. Avoid greedily increasing both cash and all bonuses when one adjustment already solves the objection.

Example, illustrative rather than a fixed driver demand: the player offers $3m salary plus $25k/podium. A driver willing to trade some guarantees for results might counter $3.2m plus $100k/podium, rather than only demanding $4m salary. At a team unlikely to score podiums, the same driver may prefer a signing payment or higher points-finish bonus. A security-focused driver may instead retain higher guaranteed pay.

If the player edits the displayed counter, Submit offer evaluates the revised package. Accept counteroffer accepts only the exact current counter/version. Providing every asked-for term must not produce new unrelated demands with no material context change.

## 9. State, persistence and re-entry

Proposed v2 session structure:

```
version, engineVersion, sessionId, revision, personId, teamId
status: open | accepted | player_cancelled | driver_withdrawn
seed, contextSnapshot, contextFingerprint, preferenceProfile, demands
patience, trust, stagnation, bestEvaluation, warning, conductMemory
rounds: submittedOffer + assessment + response + reasons + counter + diff
acceptedOffer?, acceptedAt?, appointmentStatus?
```

`response` distinguishes `counter`, `rejected_open`, `accepted`, `driver_withdrawn`. Each valid submit is processed and persisted atomically once, identified by session revision/request ID. Prevent double click, browser-back, duplicate requests, and multi-tab stale writes from making duplicate rounds or resetting patience. Pure engine functions take explicit context and a stable seed; no render-time randomness or network AI calls.

Persist a small person–team relationship record independently of drafts: closed session ID, ending reason, unresolved hard refusal, reopening conditions and conduct consequence. Reloading, deleting a draft, switching role or opening a new page cannot wipe the record. Player cancellation has a smaller consequence than repeated insulting conduct. Do not introduce response delays; reopen after material context change or an explicit permitted new approach with carried trust, never an automatic fresh-patience reset. Examples of qualifying change: correcting a refused role, an actual new season/expiry/appointment change. Merely changing a number or draft ID does not qualify after driver withdrawal.

Migrate v1 deterministically. Preserve old rounds, accepted packages and player withdrawals. For an open legacy negotiation, establish a v2 profile from actual career context and map frustration to patience; preserve any valid outstanding legacy counter as an explicitly grandfathered offer rather than silently replacing it with more expensive terms. Flag impossible/expired legacy counters for re-evaluation. Do not reopen ended talks or discard a career because an optional new field is absent. Reject inconsistent accepted states and keep a recoverable save backup using existing save facilities.

No Supabase reference migration is needed for career-specific temperament and rounds. If later authoring real personality columns, keep that separate with nullable values/provenance. Never update the shared starting dataset from a player's negotiation.

## 10. UI requirements

- Keep the response in the middle-column header: red rejection/end, yellow counteroffer, green acceptance; text and icons also convey state accessibly.
- One concise reason and qualitative patience (`Patient`, `Engaged`, `Impatient`, `Final attempt`) plus expandable explanation/history. Do not repeat counter salary figures in the header.
- Counteroffer instantly updates middle-column fields. Mark `Added by driver`, `Changed by driver`, or `Important to driver` on relevant rows with old/new values available on demand.
- Explain any new start date or duration prominently. Preserve all existing event-date options and full end-date display.
- Distinguish `Offer rejected — talks remain open` from `Driver ended negotiations`, and player cancellation from driver refusal.
- Allow the player to edit requested terms; importance is not a disabled input. Explain the consequence on submission.
- The right panel recalculates from the displayed package; forecasts never appear as guaranteed costs. Maintain overall and first-season impacts.
- Keep the compact desktop layout, with scrolling only for long clause/history content; retain accessible small-screen overflow. Save failures keep the previous persisted negotiation and user's edited offer recoverable.

## 11. Acceptance and contract execution boundary

Use `agreed driver terms` as the negotiation terminal event and pass the exact package to a dedicated commitment service. Driver agreement is not permission from their current team and is not proof of sporting availability. No balance check applies, but identity, overlapping appointments, seat replacement, role compatibility and release permissions still matter.

The commitment service is a separate implementation slice required before labeling anything `Signed`. It must distinguish renewal, amendment, incoming race transfer and concurrent reserve addition; resolve outgoing obligations; persist future appointments; activate Today immediately or later appointments through the game calendar; synchronize roster, profiles and contract desk idempotently. Reserve acceptance must preserve the main appointment and record availability/priority, not promise that the driver will accept every later call-up. Call-up decisions stay a separate workflow.

Where release permission/settlement is not implemented or terms are unresolved, show `Driver terms agreed — release/appointment pending` with the specific blocker. Do not silently invent release consent, claim a completed signing or mutate the baseline. This negotiation redesign is complete only as a negotiation feature; report any still-pending execution slice honestly.

## 12. Implementation order and ownership

1. **Characterize and version:** add tests for current financial conventions, normalize seeded/editor clauses, introduce v2 types and migration fixtures. Preserve existing worktree changes.
2. **Context and preferences:** add `lib/career/negotiationContext.ts`, `negotiationPreferences.ts`, and a central `negotiationConfig.ts`. Implement evidence provenance, independent market anchors, proposed-date willingness and persisted seeds.
3. **Shared clause semantics and evaluator:** extend the registry in `negotiation.ts` or extract it; add `negotiationEvaluation.ts`. Return itemized assessments, exact schedules and conservative conditional forecasts.
4. **Conduct and patience:** add `negotiationPatience.ts`; semantic offer comparison, progress, insults, repetition, recovery, warnings and relationship memory.
5. **Counteroffer search:** add `negotiationCounters.ts`; bounded candidate generation and evaluator validation; preserve exact acceptable counters.
6. **Orchestrate and persist:** replace internals of `offerNegotiation.ts`, update `contracts.ts`, save validators/loaders and session transitions. Remove circular runtime dependencies by placing shared types in a leaf module.
7. **Wire the existing page:** update `ContractNegotiation.tsx`, `ContractDesk.tsx` and `app/contracts.css`; retain automatic field replacement and add explanations/diffs.
8. **Commitment handoff:** implement the explicit agreed-terms event and pending status. Complete the appointment execution slice before claiming full end-to-end signing; no need to wait for a financial ledger.
9. **Calibrate and verify:** scenario suite, seeded sweeps, save migration/round-trip, build, then browser verification on an isolated career copy. Update workspace documentation and clearly report remaining boundaries.

Complete these as reviewable slices in that order; do not combine a rewrite of the rest of the game with this work. The engine, evaluator, clause registry and UI must all share one set of semantics.

## 13. Required tests and acceptance criteria

| Scenario | Required outcome |
|---|---|
| Token offer to a well-paid race driver | Immediate withdrawal if the package meets the insult rule |
| Same numeric offer for a relevant reserve role | Uses reserve-specific demands, not race salary |
| Low base plus credible signing payment | Can be accepted when recurring guarantee/security requirements are met |
| Token base plus enormous unlikely bonuses | Not accepted; capped speculative value cannot bypass guarantees |
| Repeated 98–99% packages without closing the same stated gap | Focused response, stagnation, final warning, eventual withdrawal |
| Several meaningful improvements over more than six rounds | Can continue and reach agreement |
| Lower salary with useful protection/escalation/bonuses | Evaluated as a trade, not automatically punished |
| Reordering clauses, tiny monetary changes, default-equivalent additions | Cannot reset repetition/stagnation |
| Remove a clearly requested important term | Driver identifies it; counters or penalizes appropriately |
| Win/podium/points overlap and missing higher-tier clause | Exactly one consistent paying tier in forecast; sprints excluded |
| Young reserve seeking opportunities | Can request practice, review or lower duties rather than only higher salary |
| Driver seeking security | Can reject higher total expected money with insufficient guarantees |
| Change reserve to race or race to reserve | Rebase relevant demands, preserve conduct history, recheck eligibility |
| Current racer considering a post-expiry reserve contract | Consider future context; no blanket current-team rejection |
| Partial season, leap year, December start, future start, escalator | No annualization/signing/loyalty double counting; correct first-season costs |
| Unknown salary/attributes/team forecast | Stable declared fallback; no anchoring to first offer or invented profile ratings |
| Every generated counter | Valid, eligible and accepted immediately when unchanged/context valid |
| Exact counter near zero patience | Acceptance succeeds while session remains open |
| Context changes after counter or start date passes | Stale-counter warning and explicit re-evaluation; no invalid signing |
| Cancel/reload/new draft/multiple tabs | No state reset, duplicate round or accidental reopening |
| Player cancel vs rejection vs driver walkout | Different persisted reason and correct UI |
| Accepted/withdrawn legacy and active legacy saves | Migrate without silent term changes or data loss |
| No finance system | No budget rejection; cost estimates still correct |
| Accepted concurrent reserve appointment | Main role preserved; no implied automatic future call-up acceptance |

Add seeded matrix tests across roles, career stages, term lengths, package structures and personalities. Check monotonicity for strictly beneficial edits at fixed context, deterministic replay, finite arithmetic, evaluator/counter agreement, terminal-state immutability, and no patience farming. Calibrate to outcomes rather than fitting named real drivers to unverified personalities.

Run relevant negotiation, contract desk, save, calendar and workforce tests for touched integration points, plus `npm run build`. Register new tests with the project's test runner. Browser checks must include a generated new clause, changed clause value, exact counter acceptance, open rejection, final warning, withdrawal, reload and a large clause list. Do not spend time advancing or overwriting the user's live career to test.

## 14. Instructions to the implementing agent

Implement the approved plan in this document using the current working tree. Treat all numbers as centralized tunable game-design defaults. Inspect current files again before editing; they may have changed since this handoff. Prioritize correct package semantics, believable progress-sensitive patience, executable counteroffers, persistence and honest acceptance status. Preserve all user UI requirements. Do not seed invented personal ratings into Supabase or claim that accepted drafts already update the roster. Finish with verified examples of three different negotiating paths and an explicit statement of whether binding appointment execution is complete.
