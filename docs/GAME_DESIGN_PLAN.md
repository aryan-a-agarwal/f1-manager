# F1 Manager - Master Game Design Plan

This document serves as the master blueprint and tracking roadmap for the core systems of F1 Manager. Each section outlines the mechanics, UI requirements, data structures, and how systems connect into an emergent management loop.

---

## Roadmap & Status Overview

| # | System | Focus Area | Status |
|---|---|---|---|
| **1** | [**TIME**](#1-time) | Event-driven Continue button, advance modes (Next Day, Week, Event, Race Weekend), time-occupying projects & calendar | 🟢 Completed |
| **2** | [**COMMS**](#2-comms) | Decision-driven emails, Engineering / Driver / Pre-race meetings, Board confidence (4 pillars), News & social feed | 🟢 Completed |
| **3** | [**COMMERCIAL**](#3-commercial) | Sponsors with trade-offs & milestones, Constructor prize money scaling, Merchandising & driver popularity | 🟢 Completed |
| **4** | [**CAR DEVELOPMENT**](#4-car-development) | Multi-attribute car model, 4-stage pipeline (Design → Production → Testing → Installation), CFD & Wind Tunnel allowances, uncertainty | 🟢 Completed |
| **5** | [**FACILITIES**](#5-facilities) | Factory throughput & error rates, Wind Tunnel correlation, Design Centre capacity, Power Unit supplier deals | 🟢 Completed |
| **6** | [**CHAMPIONSHIP**](#6-championship) | Driver form badges & head-to-head, Constructor prize gap indicators, Track sensitivity profiles | 🟢 Completed |
| **7** | [**TEAM**](#7-team) | Driver core + mental + commercial attributes & traits, key specialized staff roles with multi-dimensional stats | 🟢 Completed |
| **8** | [**FINANCE**](#8-finance) | Operating budget, cashflow forecast, driver/staff contracts & bonuses, cost cap limits, facility build vs upkeep | 🟢 Completed |
| **★** | [**MAIN SEASON RUNNER**](#system-connectivity) | Fully runnable Grand Prix season runner, simulated session engine with 22-car realistic classifications, official FIA championship points | 🟢 Completed |

---

## 1. TIME

Time is the backbone connecting every other system in the game.

### The Continue & Advancement System
- **Continue Button**: Rather than advancing one arbitrary day, Continue advances time to the **next meaningful event** requiring player attention or decision.
- **Three Event Types**:
  1. **Mandatory**: Time pauses automatically; player must act or acknowledge before advancing.
  2. **Important**: Player configurable whether the simulation pauses (e.g., car dev completion, sponsor proposal, contract expiry).
  3. **Informational**: Appears in inbox/news without interrupting time flow.
- **Granular Advancement Options**:
  - **Continue**: Jump to the next active/interrupting event.
  - **Next Day**: Advance exactly 1 day (24 hours).
  - **Next Week**: Advance 7 days, stopping early if an important event triggers.
  - **Next Race Weekend**: Process factory/simulation forward directly to the start of the next Grand Prix weekend.
- **Configurable Stop Criteria**:
  - Car development completion (Design / Production / Testing)
  - Driver & staff contract decisions
  - Sponsor proposals & milestone deadlines
  - Engineering & driver briefings
  - Financial threshold warnings / cost cap alerts
  - Major regulation or world news

### Calendar System
A comprehensive calendar screen that visualizes physical time occupation:
- **Race Weekends**: Practice, Qualifying, Sprint, Race sessions.
- **Factory Timelines**:
  - *Example*: Front Wing v3 — Design (12 days) → Production (5 days) → Testing (3 days) = 20 days total.
  - Compares directly against upcoming races (e.g., "Monaco in 17 days: will it make the cut, or must we rush production?").
- **Facility Construction**: Ground-breaking to completion countdowns.
- **Commercial & Governance Deadlines**: Sponsor promotional days, contract expiry dates, board reviews, and pre-season testing.

---

## 2. COMMS

Communications make the game world feel alive without requiring massive scene overhead.

### Decision-Driven Emails
Emails are not merely flavor text—key messages require management choices with trade-offs.
- *Example*: Technical Director warns that the new floor is running behind schedule:
  - **Option A (Add engineers)**: Faster floor completion, but slows down rear-wing project.
  - **Option B (Authorise overtime)**: Accelerates project, but incurs extra budget cost and decreases factory morale.
  - **Option C (Maintain current pace)**: No extra cost, but part misses the next Grand Prix.
- Categories: Team, FIA/Regulations, Drivers, Staff, Sponsors, Board, Media, Contracts, Finance, Development.

### Meetings
Interactive decision hubs held periodically:
- **Engineering Meetings**: Allocate engineering capacity points (e.g., 100 points) across Aerodynamics, Mechanical Grip, Cooling, Reliability, Weight Reduction, and Next-Season Research. Technical Director offers recommendations based on car weakness.
- **Driver Briefings**: Drivers voice feedback, complaints, and preferences (e.g., Driver A wants high-speed stability while Driver B wants low-speed braking). Affects morale, confidence, loyalty, and contract talks.
- **Pre-Race Briefings**: Choose weekend objective (Conservative, Balanced, Aggressive), development focus (Setup data, Component testing, Component preservation), and driver pressure targets.
- **Board Meetings**: Quarterly and crisis reviews evaluating 4 confidence metrics:
  1. Board Confidence
  2. Financial Confidence
  3. Performance Confidence
  4. Long-Term Confidence

### News & Social Feed
- **World News**: Reactions to car upgrades, rival moves, paddock politics.
- **Social Media Sentiment**: Snappy, varied fan/media commentary with mixed reliability (some true rumors, some paddock gossip).

---

## 3. COMMERCIAL

### Sponsors with Real Commitments
- Not just static payments: sponsors provide base fees + performance milestones + sponsor commitments.
- *Example*: Volt Energy provides £4m base + £500k podium bonus + £1m for 5 consecutive points finishes + £300k promotional event.
- **Trade-offs**: Mandating driver promotional days earns sponsor cash but removes drivers from simulator preparation.
- Tiers: Title Sponsor, Major Sponsors, Technical Partners, Minor Suppliers.

### Constructors' Championship Prize Money
- Strict tiered payout scale based on final championship placement (e.g., P1: £100m down to P11: participation minimum).
- Live HUD tracking: "Current: P6 | P5 is 12 points ahead | Estimated prize-money difference: +£7.4M".

### Merchandising
- Driven by team prestige and driver popularity/marketability.
- Signing a superstar driver brings millions in merchandise sales to partially offset high salary demands.

---

## 4. CAR DEVELOPMENT

### Granular Car Attributes
Cars are evaluated across detailed operational vectors rather than a single rating:
- **Aerodynamics**: Low-speed downforce, Medium-speed downforce, High-speed downforce, Drag efficiency, DRS efficiency.
- **Mechanical**: Braking efficiency, Traction, Tyre preservation, Suspension compliance, Kerb handling.
- **Powertrain**: Top speed power, Fuel efficiency, Thermal cooling, Reliability.
- **Chassis/General**: Weight vs minimum weight, Overall reliability, Weight distribution.
- Grid comparative ranking (e.g., "High-speed downforce: 3rd | Low-speed downforce: 9th | Tyre wear: 10th").

### 4-Stage Development Pipeline
1. **Design**: Assign engineers, target attributes (Downforce / Drag / Weight / Balanced), and allocate CFD/Wind Tunnel hours.
2. **Production**: Manufacture specific quantities (Car 1, Car 2, Spares). Option to standard-build or rush (+50% cost, -30% time, slight error risk).
3. **Testing**: Correlation verification. Discovers actual gain vs predicted gain (reducing uncertainty based on wind tunnel level).
4. **Installation**: Fit to specific cars for upcoming race weekends.

### Regulatory Resource Allocation (ATR)
- Sliding scale CFD & Wind Tunnel hours allocated per testing period based on reverse championship standing.

---

## 5. FACILITIES

Facilities directly scale team capabilities rather than acting as simple percentage buffs:
- **Factory**: Determines active production lines, monthly part manufacturing capacity, and manufacturing error rates.
- **Wind Tunnel**: Controls correlation accuracy between computer simulations and on-track performance; reduces design uncertainty.
- **Design Centre**: Determines maximum engineering headcount, simultaneous design slots, and R&D velocity.
- **Engine Supplier Agreements**: Choose between high-performance expensive works engines (e.g., Titan: £22m/yr) or budget-friendly customer power units (e.g., Nova: £12m/yr) to free up chassis capital.

---

## 6. CHAMPIONSHIP

- **Drivers' Standings**: Standings table with recent form badges (`P3`, `P5`, `DNF`, `P2`), head-to-head qualifying/race records, and points-per-race stats.
- **Constructors' Standings**: Points gaps, prize money differentials, and financial stakes visualized.
- **Circuit Profiles**: Each circuit features distinct attribute weighting (e.g., Monza = High Power / Low Drag; Monaco = Maximum Downforce; Silverstone = High-speed Cornering & Tyre Stress).

---

## 7. TEAM

### Drivers
- **Core Attributes**: Pace, Qualifying, Racecraft, Consistency, Tyre Management, Wet-Weather Skill, Feedback, Adaptability.
- **Mental & Attitude**: Morale, Confidence, Pressure Handling, Aggression, Loyalty.
- **Commercial**: Popularity, Marketability.
- **Traits & Archetypes**: *Technical Driver* (+Dev feedback), *Hot Head* (Morale volatility), *Veteran* (Consistent, slower growth), *Young Prospect* (High potential ceiling).

### Staff Structure
- Dedicated staff positions with distinct traits:
  - **Technical Director**: Technical Skill, Project Leadership, Innovation.
  - **Head of Aerodynamics**: Aero Design, Correlation Skill.
  - **Chief Designer**: Packaging, Weight Reduction, Build Time Efficiency.
  - **Race Engineers**: Driver Chemistry, Setup Speed, Calm under pressure.
  - **Scouts**: Talent identification accuracy.

---

## 8. FINANCE & COST CAP

- **Annual Budget & Forecasting**: Starting balance, projected sponsor/prize income, ongoing payroll, and year-end projected surplus/deficit.
- **Salaries & Contracts**: Base pay, contract length, milestone bonuses (points, podiums, titles).
- **Development & Cost Cap**: Tracking expenditures strictly against the FIA Cost Cap limit (e.g., £135m cap). Dilemmas on whether to spend remaining cap on current car or transition to next season's chassis.
- **Facility Capital Expenditure vs Operational Upkeep**: High-tier facilities require ongoing annual maintenance costs.

---

## System Connectivity: The Complete Management Loop

```
Board Objectives & Confidence (Demands P5 finish)
       │
       ▼
Championship Standings (P6, -15 pts behind)
       │
       ▼
Engineering Team (Proposes new floor upgrade)
       │
       ▼
Car Development Pipeline (Design -> Production -> Testing = 24 days)
       │
       ▼
Facilities Bottleneck (Factory level 2 cannot produce in time)
       │
       ▼
Finance Dilemma (Rush production costs +£1.2M against Cost Cap)
       │
       ▼
Calendar Pressure (Target Grand Prix is in 19 days)
       │
       ▼
Driver Feedback (Unhappy with car, demands high-speed stability)
       │
       ▼
PLAYER MANAGEMENT DECISION (Authorize overtime, compromise rear wing, hit deadline)
```

---

## Implementation Roadmap & Progress Tracker

| Section | System | Status | Calibration Test Suite | Key Features Implemented |
| :--- | :--- | :---: | :--- | :--- |
| **1** | **TIME** | **COMPLETED** | `calibration/timelineAdvance.test.ts` | Multi-category timeline engine, mandatory/important/informational event stops, car dev pipeline (Design $\rightarrow$ Production $\rightarrow$ Testing), user stop settings, dynamic NEXT EVENT advance button, factory timeline tab. |
| **2** | **COMMS** | **COMPLETED** | `calibration/commsDecisions.test.ts` | Decision-driven email memos with trade-off dilemmas (budget, morale, schedule), 100-pt factory engineering capacity allocation, driver debriefs with morale/confidence impact, tactical pre-race directives, 4-pillar board confidence HUD, paddock dispatches & social sentiment feed. |
| **3** | **COMMERCIAL** | **COMPLETED** | `calibration/commercialFinance.test.ts` | 7 chassis sponsor slots with base fees, performance bonuses, and PR day trade-offs; Concorde 11-position prize pool engine (£125M down to £32M) with point/prize deltas; driver marketability merchandise revenue. |
| **4** | **CAR DEV** | **COMPLETED** | `calibration/carDevFacilities.test.ts` | 12-channel performance vector, 11-team comparative rankings, 4-stage pipeline (Design, Production, Testing, Installation), ATR limits (Wind Tunnel & CFD), standard vs rush builds. |
| **5** | **DRIVERS & STAFF**| **COMPLETED** | `calibration/workforceContracts.test.ts` | 8-channel driver skills, 5-channel mental attributes, personality traits, key staff hierarchy (Newey, Waché, Bono, GP), term sheet contract negotiations with counter-offers and FIA buyout release clauses. |
| **6** | **FINANCES** | **COMPLETED** | `calibration/commercialFinance.test.ts` | £135.0M FIA cost cap enforcement, strict Cap-Exempt (driver salaries, top-3 execs) vs Cap-Counted accounting, multi-tiered warnings, operating cash reserves, and financial ledger. |
| **7** | **FACILITIES** | **COMPLETED** | `calibration/carDevFacilities.test.ts` | 6 campus facilities (Factory, Wind Tunnel, Design Centre, CFD Supercomputer, Driver Simulator, Youth Academy) with levels 1-5, wear degradation, and refurbishment maintenance. |
| **8** | **MAIN SEASON** | **COMPLETED** | `calibration/seasonRunner.test.ts` | Fully runnable Grand Prix season runner, simulated session engine with 22-car realistic classifications, official FIA championship points (25-18-15-12-10-8-6-4-2-1), sprint scoring, podium showcase, 1-click full GP simulation, and multi-year season transition. |
