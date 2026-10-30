"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CareerState } from "@/lib/career";
import { compareStandings, getPendingDecisionCount, getUnreadEmailCount, nextCalendarSession } from "@/lib/career";
import {DriverLink,TeamLink} from "./Profiles";
import type { Team } from "@/lib/data/grid";

export type GamePageId = "home" | "comms" | "team" | "race" | "drivers" | "calendar" | "finance" | "commercial" | "standings" | "market" | "database" | "settings";
export type InterfaceLayout = "management" | "original";
export type ManagementLocation = { section: string; view: string };
type View = { id: string; label: string; page: GamePageId; tab?: string };
type Section = { id: string; label: string; icon: string; views: View[] };

export const MANAGEMENT_SECTIONS: Section[] = [
  { id: "home", label: "Home", icon: "home", views: [
    { id: "overview", label: "Overview", page: "home" },
    { id: "races", label: "Calendar", page: "calendar", tab: "races" },
    { id: "weekend", label: "Race centre", page: "race" },
    { id: "inbox", label: "Inbox", page: "comms", tab: "inbox" },
    { id: "meetings", label: "Meetings & board", page: "comms", tab: "meetings" },
    { id: "paddock", label: "Paddock news", page: "comms", tab: "paddock" },
  ] },
  { id: "team", label: "Team", icon: "team", views: [
    { id: "drivers", label: "Driver line-up", page: "drivers", tab:"lineup" },
    { id: "contracts", label: "Contracts", page: "drivers", tab:"contracts" },
  ] },
  { id: "car", label: "Manufacturing", icon: "car", views: [
    { id: "performance", label: "Performance", page: "team", tab: "performance" },
    { id: "projects", label: "Development", page: "team", tab: "projects" },
    { id: "facilities", label: "Facilities", page: "team", tab: "facilities" },
    { id: "powertrain", label: "Power unit & ATR", page: "team", tab: "powertrain" },
  ] },
  { id: "finances", label: "Finances", icon: "commercial", views: [
    { id: "overview", label: "Overview", page: "finance", tab: "overview" },
    { id: "payments", label: "Payments & commitments", page: "finance", tab: "payments" },
    { id: "ledger", label: "Ledger", page: "finance", tab: "ledger" },
    { id: "forecast", label: "Forecast", page: "finance", tab: "forecast" },
    { id: "cost_cap", label: "Cost cap & rules", page: "finance", tab: "cost_cap" },
    { id: "setup", label: "Opening position", page: "finance", tab: "setup" },
    { id: "agreements", label: "Agreements", page: "finance", tab: "agreements" },
    { id: "invoices", label: "Invoices", page: "finance", tab: "invoices" },
    { id: "budgets", label: "Budgets & scenarios", page: "finance", tab: "budgets" },
    { id: "assets", label: "Assets", page: "finance", tab: "assets" },
    { id: "ownership", label: "Ownership", page: "finance", tab: "ownership" },
    { id: "reporting", label: "Reporting", page: "finance", tab: "reporting" },
    { id: "personnel", label: "Personnel", page: "finance", tab: "personnel" },
    { id: "rivals", label: "Other teams", page: "finance", tab: "rivals" },
  ] },
  { id: "commercial", label: "Commercial", icon: "commercial", views: [
    { id: "prize", label: "Prize money & merchandise", page: "commercial", tab: "prize" },
    { id: "sponsors", label: "Sponsors", page: "commercial", tab: "sponsors" },
  ] },
  { id: "scouting", label: "Scouting", icon: "scouting", views: [
    { id: "grid_drivers", label: "Driver market", page: "market", tab: "grid_drivers" },
    { id: "prospects", label: "Free agents & prospects", page: "market", tab: "prospects" },
    { id: "staff", label: "Staff & engineers", page: "market", tab: "staff" },
  ] },
  { id: "championship", label: "Championship", icon: "championship", views: [
    { id: "teams", label: "Constructors", page: "standings", tab: "teams" },
    { id: "drivers", label: "Drivers", page: "standings", tab: "drivers" },
  ] },
  { id: "database", label: "Database", icon: "database", views: [
    { id: "drivers", label: "Drivers", page: "database", tab: "drivers" },
    { id: "staff", label: "Staff", page: "database", tab: "staff" },
    { id: "teams", label: "Teams", page: "database", tab: "teams" },
    { id: "tracks", label: "Circuits", page: "database", tab: "tracks" },
  ] },
  { id: "settings", label: "Settings", icon: "settings", views: [
    { id: "appearance", label: "Interface & appearance", page: "settings" },
  ] },
];

export function resolveManagementLocation(location: ManagementLocation) {
  if(location.section==='commercial'&&location.view==='cost_cap')location={section:'finances',view:'cost_cap'};
  if(location.section==="season")location={section:"home",view:location.view==="weekend"?"weekend":"races"};
  const section = MANAGEMENT_SECTIONS.find((item) => item.id === location.section) ?? MANAGEMENT_SECTIONS[0];
  const view = section.views.find((item) => item.id === location.view) ?? section.views[0];
  return { section, view };
}

export function locationForPage(page: GamePageId): ManagementLocation {
  const section = MANAGEMENT_SECTIONS.find((item) => item.views.some((view) => view.page === page))!;
  return { section: section.id, view: section.views.find((view) => view.page === page)!.id };
}

const SectionTabContext = createContext<{ tab?: string; changeTab: (tab: string) => void } | null>(null);
export const SectionTabProvider = SectionTabContext.Provider;

/** Existing screens retain their own tabs when rendered in the original interface. */
export function useSectionTab<T extends string>(initial: T): [T, (tab: T) => void] {
  const context = useContext(SectionTabContext);
  const [localTab, setLocalTab] = useState<T>(initial);
  return context ? [(context.tab ?? initial) as T, context.changeTab] : [localTab, setLocalTab];
}

export function InterfaceLayoutPicker({ layout, onChange }: { layout: InterfaceLayout; onChange: (layout: InterfaceLayout) => void }) {
  return <section className="interface-layout-picker" aria-label="Interface layout">
    <div><small>PERSONALISE YOUR WORKSPACE</small><h2>Interface layout</h2><p>Choose your navigation and workspace. Your career continues in either layout.</p></div>
    <div className="interface-layout-options">
      <button type="button" aria-pressed={layout === "management"} onClick={() => onChange("management")}><span className="layout-preview layout-preview-management"><i/><i/><i/></span><strong>Management</strong><small>IPL-style navigation · Default</small></button>
      <button type="button" aria-pressed={layout === "original"} onClick={() => onChange("original")}><span className="layout-preview layout-preview-original"><i/><i/><i/></span><strong>Original F1</strong><small>Original sidebar & dashboard</small></button>
    </div>
  </section>;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></>,
    team: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/></>,
    car: <><path d="m5 8 2-4h10l2 4m-16 8V9h18v7H3Zm2 0v4m14-4v4M6 12h2m8 0h2"/></>,
    commercial: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18m-11 0v3h4v-3"/></>,
    scouting: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/></>,
    season: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3m-10 3h3"/></>,
    championship: <><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm8 2h5v3a5 5 0 0 1-5 5M8 5H3v3a5 5 0 0 0 5 5m4 0v6m-5 2h10"/></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/></>,
    settings: <><path d="M10.5 2.5h3l.5 2.1 1.7.7 1.9-1.2 2.1 2.1-1.2 1.9.7 1.7 2.1.5v3l-2.1.5-.7 1.7 1.2 1.9-2.1 2.1-1.9-1.2-1.7.7-.5 2.1h-3l-.5-2.1-1.7-.7-1.9 1.2-2.1-2.1 1.2-1.9-.7-1.7-2.1-.5v-3l2.1-.5.7-1.7-1.2-1.9 2.1-2.1 1.9 1.2 1.7-.7z"/><circle cx="12" cy="12" r="3"/></>,
  };
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.home}</svg>;
}

export function ManagementShell({ team, career, location, onNavigate, controls, children, historyControls, profileKey }: {
  team: Team; career: CareerState; location: ManagementLocation;
  onNavigate: (location: ManagementLocation) => void; controls: ReactNode; children: ReactNode; historyControls?:ReactNode;profileKey?:string;
}) {
  const { section, view } = resolveManagementLocation(location);
  const unread = getUnreadEmailCount(career);
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => { contentRef.current?.scrollTo(0, 0); }, [section.id, view.id, profileKey]);
  return <main className="management-shell" style={{ "--team": team.primary, "--team-secondary": team.secondary } as React.CSSProperties}>
    <header className="management-navbar">
      {historyControls}
      <nav className="management-mainnav" aria-label="Main navigation">
        {MANAGEMENT_SECTIONS.filter((item) => item.id !== "settings").map((item) => <button key={item.id} aria-current={section.id === item.id ? "page" : undefined} onClick={() => onNavigate({ section: item.id, view: item.views[0].id })}><span>{item.label}</span>{item.id === "home" && unread > 0 && <span className="management-count">{unread}</span>}</button>)}
      </nav>
      <button className="management-settings" aria-label="Open settings" aria-current={section.id === "settings" ? "page" : undefined} onClick={() => onNavigate({ section: "settings", view: "appearance" })}><Icon name="settings"/></button>
      {controls}
    </header>
    <div className="management-subnav">
      <nav aria-label={`${section.label} subsections`}>{section.views.filter(item=>section.id!=="finances"||["overview","payments","ledger","forecast","cost_cap"].includes(item.id)).map((item) => <button key={item.id} aria-current={view.id === item.id ? "page" : undefined} onClick={() => onNavigate({ section: section.id, view: item.id })}>{item.label}{item.id === "inbox" && unread > 0 && <span className="management-count">{unread}</span>}</button>)}</nav>
    </div>
    <div className="management-statusbar"><div className="management-status-location"><span className="management-status-team"><i/><TeamLink id={team.id} name={team.name}/></span><span className="management-breadcrumb" aria-label="Current page">{section.label} <b>/</b> {view.label}</span></div><span>{career.season.phase.replace("preseason", "Pre-season").replace("offseason", "Off-season")}<b>·</b><time dateTime={career.clock.date}>{formatDate(career.clock.date)}</time><b>·</b>{String(Math.floor(career.clock.minuteOfDay / 60)).padStart(2, "0")}:{String(career.clock.minuteOfDay % 60).padStart(2, "0")}</span></div>
    <section ref={contentRef} className="management-content" aria-label={profileKey?"Full profile":`${section.label}: ${view.label}`}>{children}</section>
  </main>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
function money(value: number) { return `£${(value / 1_000_000).toFixed(1)}m`; }

export function ManagementOverview({ team, career, onNavigate }: { team: Team; career: CareerState; onNavigate: (location: ManagementLocation) => void }) {
  const next = nextCalendarSession(career.season.calendar);
  const standings = [...career.championship.teams].sort(compareStandings);
  const position = standings.findIndex((entry) => entry.teamId === team.id) + 1;
  const teamStanding = standings.find((entry) => entry.teamId === team.id);
  const completedRaces = career.season.calendar.rounds.filter((round) => round.status === "archived" || round.status === "race_completed").length;
  const lineup = career.workforce.lineups.find((entry) => entry.teamId === team.id && entry.season === career.season.year);
  const drivers = (lineup?.driverIds ?? []).map((id) => career.workforce.people.find((person) => person.id === id)).filter((person) => person !== undefined);
  const upcoming = career.season.calendar.rounds.filter((round) => round.status !== "archived" && round.status !== "race_completed").slice(0, 4);
  return <div className="management-overview">
    <div className="management-page-heading"><div><small>TEAM PRINCIPAL'S OFFICE</small><h1>Headquarters</h1><p>Your team, your decisions, your season.</p></div><span className="management-season-pill">{career.season.year} championship</span></div>
    <div className="management-summary-grid">
      <article className="management-card management-club-card"><div className="management-card-label">Constructor profile <span>01</span></div><div className="management-club-identity"><span>{team.shortName.slice(0, 3).toUpperCase()}</span><h2><TeamLink id={team.id} name={team.name}/></h2><p>{team.base}</p></div><dl className="management-profile-facts"><div><dt>Power unit</dt><dd>{team.powerUnit}</dd></div><div><dt>Team principal</dt><dd>{career.workforce.people.find((person) => person.id === lineup?.teamPrincipalId)?.name ?? team.principal}</dd></div></dl><button className="management-text-action" onClick={() => onNavigate({ section: "team", view: "drivers" })}>View your team <span>↗</span></button></article>
      <article className="management-card management-next-race"><div className="management-card-label">Next race weekend <span>{next ? `R${String(next.round.roundNumber).padStart(2, "0")}` : "—"}</span></div><small className="management-kicker">{next?.round.location ?? "CHAMPIONSHIP"}</small><h2>{next?.round.grandPrixName ?? "Season complete"}</h2><p>{next ? `${next.round.location} · ${formatDate(next.round.weekendEndDate)}` : "Review the season in the race centre."}</p><div className="management-race-session"><span>Next session</span><strong>{next?.session.kind.replaceAll("_", " ") ?? "Season review"}</strong></div><button className="management-primary" onClick={() => onNavigate({ section: "home", view: "weekend" })}>Open race centre <span>→</span></button></article>
      <article className="management-card"><div className="management-card-label">Office summary <span>03</span></div><div className="management-big-number">{getUnreadEmailCount(career)}</div><p>Unread messages</p><div className="management-office-row"><span>Unread messages</span><b>{getUnreadEmailCount(career)}</b></div><div className="management-office-row"><span>Decisions waiting</span><b>{getPendingDecisionCount(career)}</b></div><button className="management-text-action" onClick={() => onNavigate({ section: "home", view: "inbox" })}>Open inbox <span>↗</span></button></article>
    </div>
    <div className="management-metrics">

      <button onClick={() => onNavigate({ section: "championship", view: "teams" })}><small>Constructors' championship</small><strong>{completedRaces ? `P${position}` : "—"}<em>{teamStanding?.points ?? 0} points</em></strong><span>{completedRaces} / {career.season.calendar.rounds.length} races completed →</span></button>


    </div>
    <div className="management-bottom-grid"><article className="management-card"><div className="management-card-label">Driver line-up <span>{career.season.year}</span></div>{drivers.map((driver, index) => <DriverLink className="management-driver-row" key={driver.id} id={driver.id} name={driver.name}><span>{String(driver.carNumber ?? index + 1).padStart(2, "0")}</span><div><small>Race driver · Seat {index + 1}</small><strong>{driver.name}</strong></div><b>↗</b></DriverLink>)}<button className="management-text-action" onClick={() => onNavigate({ section: "scouting", view: "grid_drivers" })}>Explore driver market <span>↗</span></button></article><article className="management-card"><div className="management-card-label">Upcoming calendar <span>{upcoming.length} weekends</span></div>{upcoming.length ? upcoming.map((round) => <button className="management-fixture-row" key={round.id} onClick={() => onNavigate({ section: "home", view: "races" })}><span>{String(round.roundNumber).padStart(2, "0")}</span><div><strong>{round.grandPrixName}</strong><small>{round.location} · {formatDate(round.weekendEndDate)}</small></div><b>→</b></button>) : <p>All race weekends have been completed.</p>}</article></div>
  </div>;
}
