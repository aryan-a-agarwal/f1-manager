"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { findTeam, teams, type Driver, type Team } from "@/lib/data/grid";
import {
  advanceCareerWeekend,
  compareStandings,
  completeCurrentSeason,
  deleteCareer,
  getPendingDecisionCount,
  getUnreadEmailCount,
  loadCareer,
  nextCalendarSession,
  recoverInterruptedSession,
  resolveTimelineEvent,
  saveCareer,
  startNextSeason,
  simulatedSessionEngine,
  simulateNextSession,
  simulateEntireWeekend,
  DEFAULT_STOP_SETTINGS,
  type CareerState,
  type TimelineEvent,
  type SimulationStopSettings,
} from "@/lib/career";
import DriverDatabaseTable from "@/components/game/DriverDatabaseTable";
import CommercialFinancePage from '@/components/game/CommercialFinancePage';
import ManufacturingPage from '@/components/game/ManufacturingPage';
import FinancesPage from '@/components/game/FinancesPage';
import {ProfileProvider,ProfilePage,DriverLink,TeamLink,useProfiles} from "@/components/game/Profiles";
import {teamRatingGroups} from "@/lib/teamProfileData";
import {databaseFieldLabel} from "@/lib/driverProfileData";
import StaffDatabaseTable from "@/components/game/StaffDatabaseTable";
import {HistoryArrows,useGameNavigation} from "@/components/game/useGameNavigation";
import {profileFromSearch,profileUrl,type ProfileTarget} from "@/lib/profileNavigation";
import SaveRecovery from "@/components/game/SaveRecovery";
import {ensureCareerReserves} from "@/lib/career/reserves";
import ContractDesk from "@/components/game/ContractDesk";
import DayProgressControl from "@/components/game/DayProgressControl";
import CalendarFeature from "@/components/game/CalendarFeature";
import { supabase } from "@/lib/supabaseClient";
import { InterfaceLayoutPicker, ManagementOverview, ManagementShell, SectionTabProvider, locationForPage, resolveManagementLocation, useSectionTab, type InterfaceLayout, type ManagementLocation } from "@/components/game/ManagementShell";

type Page = "home" | "comms" | "team" | "race" | "drivers" | "calendar" | "finance" | "commercial" | "standings" | "market" | "database" | "settings";
type Skin = "light" | "dark" | "retro" | "team";
const skins: readonly Skin[] = ["light", "dark", "retro", "team"];
const nav: { id: Page; label: string; icon: string }[] = [
  { id:"home", label:"Home", icon:"⌂" }, { id:"comms", label:"Comms", icon:"✉" }, { id:"team", label:"Team", icon:"◆" },
  { id:"race", label:"Race Centre", icon:"⚑" }, { id:"drivers", label:"Drivers", icon:"●" },
  { id:"calendar", label:"Calendar", icon:"▦" }, { id:"finance", label:"Finance", icon:"$" },
  { id:'commercial', label:'Commercial', icon:'$' },
  { id:"standings", label:"Standings", icon:"▥" }, { id:"market", label:"Market", icon:"+" },
  { id:"database", label:"Database", icon:"DB" }, { id:"settings", label:"Settings", icon:"⚙" },
];

export default function GamePage() {
  const router = useRouter();
  const navigation=useGameNavigation();
  const [profile,setProfile]=useState<ProfileTarget|null>(null);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [career, setCareer] = useState<CareerState | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [skin, setSkin] = useState<Skin>("dark");
  const [interfaceLayout, setInterfaceLayout] = useState<InterfaceLayout>("management");
  const [managementSkin, setManagementSkin] = useState<Skin>("light");
  const [managementLocation, setManagementLocation] = useState<ManagementLocation>({ section: "home", view: "overview" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [activeEventModal, setActiveEventModal] = useState<TimelineEvent | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    try {
    const storedCareer = loadCareer();
    const loadedCareer = storedCareer ? recoverInterruptedSession(storedCareer) : null;
    const reserveCareer=loadedCareer?ensureCareerReserves(loadedCareer):null;
    const syncedCareer=reserveCareer&&reserveCareer!==loadedCareer?saveCareer(reserveCareer):reserveCareer;
    const selected = findTeam(syncedCareer?.player.teamId ?? null);
    if (!selected) router.replace("/setup"); else setTeam(selected);
    setCareer(syncedCareer);
    const savedSkin = localStorage.getItem("f1-manager-skin");
    const nextSkin = skins.includes(savedSkin as Skin) ? savedSkin as Skin : "dark";
    setSkin(nextSkin); document.documentElement.dataset.skin = nextSkin;
    const storedLayout = localStorage.getItem("f1-manager-ui-layout") === "original" ? "original" : "management";
    const storedManagementSkin = localStorage.getItem("f1-manager-management-skin");
    const nextManagementSkin = skins.includes(storedManagementSkin as Skin) ? storedManagementSkin as Skin : "light";
    setInterfaceLayout(storedLayout);
    setManagementSkin(nextManagementSkin);
    document.documentElement.dataset.skin = storedLayout === "management" ? nextManagementSkin : nextSkin;
    const readLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const resolved = resolveManagementLocation({ section: params.get("section") ?? "home", view: params.get("view") ?? "overview" });
      setManagementLocation({ section: resolved.section.id, view: resolved.view.id });
      setPage(resolved.view.page);
      setProfile(profileFromSearch(window.location.search));
    };
    readLocation();
    window.addEventListener("popstate", readLocation);
    const savedShortlist = localStorage.getItem("f1-manager-shortlist");
    if (savedShortlist) { try { const parsed: unknown = JSON.parse(savedShortlist); if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) setShortlist(parsed); } catch { /* Ignore malformed optional display preferences. */ } }
    return () => window.removeEventListener("popstate", readLocation);
    } catch(error) { setLoadError(error instanceof Error?error.message:"The career could not be loaded."); }
  }, [router]);

  useEffect(()=>{document.querySelector(".workspace")?.scrollTo(0,0);},[profile?.kind,profile?.id,managementLocation.section,managementLocation.view]);

  function navigateManagement(location: ManagementLocation) {
    const resolved = resolveManagementLocation(location);
    const nextLocation = { section: resolved.section.id, view: resolved.view.id };
    setManagementLocation(nextLocation);
    setPage(resolved.view.page);
    setSettingsOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("section", nextLocation.section);
    url.searchParams.set("view", nextLocation.view);
    url.searchParams.delete("profile");url.searchParams.delete("profileId");
    setProfile(null);
    navigation.push(url.pathname+url.search);
  }
  function goTo(next: Page) {
    navigateManagement(locationForPage(next));
  }
  function changeInterfaceLayout(next: InterfaceLayout) {
    localStorage.setItem("f1-manager-ui-layout", next);
    setInterfaceLayout(next);
    setSettingsOpen(false);
    document.documentElement.dataset.skin = next === "management" ? managementSkin : skin;
    // Layout changes retain the current page and profile URL.
  }
  function changeManagementSkin(next: Skin) { setManagementSkin(next); localStorage.setItem("f1-manager-management-skin", next); document.documentElement.dataset.skin = next; }
  function changeSkin(next: Skin) { setSkin(next); localStorage.setItem("f1-manager-skin",next); document.documentElement.dataset.skin = next; }
  function restartGame() { deleteCareer(); router.push("/setup"); }
  function toggleShortlist(name: string) { setShortlist((current) => { const next = current.includes(name) ? current.filter((item) => item !== name) : [...current,name]; localStorage.setItem("f1-manager-shortlist",JSON.stringify(next)); return next; }); }

  function handleBlockedReached(updatedCareer: CareerState, eventId: string) {
    if(updatedCareer.season.calendar.rounds.some(round=>round.sessions.some(session=>session.id===eventId))){goTo("race");return;}
    const found = updatedCareer.scheduler.pendingEvent?.id===eventId ? updatedCareer.scheduler.pendingEvent : updatedCareer.events?.find((e) => e.id === eventId);
    if (found) {
      setActiveEventModal(found);
    } else if (eventId.includes("-complete")) {
      const proj = updatedCareer.projects?.find((p) => eventId.startsWith(p.id));
      setActiveEventModal({
        id: eventId,
        title: `${proj?.name ?? "Car Upgrade"} Milestone`,
        category: "car_development",
        severity: "important",
        date: updatedCareer.clock.date,
        minuteOfDay: updatedCareer.clock.minuteOfDay,
        description: `Component phase updated to ${proj?.phase ?? "next stage"}. Aerodynamic and mechanical gains are verified in the factory.`,
        actionLabel: "View in Team",
        actionPage: "team",
        resolved: false,
      });
    } else {
      goTo("race");
    }
  }

  function handleResolveEvent(eventId: string) {
    if (!career) return;
    try { const resolved = resolveTimelineEvent(career, eventId); setCareer(resolved); setActiveEventModal(null); } catch(error) { setTimeError(error instanceof Error?error.message:"Resolve the required decision first."); }
  }

  if(loadError)return <SaveRecovery message={loadError}/>;
  if (!team || !career) return <main className="loading-screen">Loading headquarters…</main>;

  const gameDate = new Date(`${career.clock.date}T00:00:00Z`);
  const date = new Intl.DateTimeFormat("en-GB",{ weekday:"short",day:"2-digit",month:"short",year:"numeric",timeZone:"UTC" }).format(gameDate).toUpperCase();
  const time = `${String(Math.floor(career.clock.minuteOfDay/60)).padStart(2,"0")}:${String(career.clock.minuteOfDay%60).padStart(2,"0")}`;
  const headerLineup=career.workforce.lineups.find(l=>l.season===career.season.year&&l.teamId===team.id);
  const headerDrivers=(headerLineup?.driverIds??[]).map(id=>career.workforce.people.find(p=>p.id===id)).filter(p=>p!==undefined);
  const phase = career.season.phase.replace("preseason","pre-season").replace("offseason","off-season").toUpperCase();

  const {view,section}=resolveManagementLocation(managementLocation);
  const tabContext={tab:view.tab,changeTab:(tab:string)=>{
    const target=section.views.find(item=>item.page===page&&item.tab===tab);
    if(target)navigateManagement({section:section.id,view:target.id});
  }};
  function openProfile(target:ProfileTarget){setSettingsOpen(false);navigation.push(profileUrl(window.location.href,target));}
  const historyControls=<HistoryArrows navigation={navigation}/>;
  const timeControls=<DayProgressControl career={career} updateCareer={setCareer} onBlocked={handleBlockedReached} onError={setTimeError}/>;
  if (interfaceLayout === "management") {
    return <ProfileProvider career={career} updateCareer={setCareer} open={openProfile}><ManagementShell historyControls={historyControls} profileKey={profile?`${profile.kind}:${profile.id}`:undefined} team={team} career={career} location={managementLocation} onNavigate={navigateManagement} controls={timeControls}>
      {timeError && <div className="management-error" role="alert"><span>{timeError}</span><button onClick={() => setTimeError(null)} aria-label="Dismiss error">×</button></div>}
      {profile&&<ProfilePage target={profile}/>}
      <div className="game-screen" hidden={!!profile}><SectionTabProvider value={tabContext}>
        {page === "home" && <ManagementOverview team={team} career={career} onNavigate={navigateManagement}/>}
        {page === "comms" && <CommsPage career={career} updateCareer={setCareer} open={goTo}/>}
        {page === "team" && <TeamPage team={team} career={career} updateCareer={setCareer}/>}
        {page === "race" && <RacePage career={career} updateCareer={setCareer}/>}
        {page === "drivers" && <DriversPage career={career} updateCareer={setCareer}/>}
        {page === "calendar" && <CalendarPage career={career} open={goTo}/>}
        {page === "finance" && <FinancesPage career={career} updateCareer={setCareer}/>}
        {page === "commercial" && <CommercialFinancePage career={career} updateCareer={setCareer}/>}
        {page === "standings" && <StandingsPage career={career}/>}
        {page === "market" && <MarketPage career={career} updateCareer={setCareer} shortlist={shortlist} toggle={toggleShortlist}/>}
        {page === "database" && <DatabasePage/>}
        {page === "settings" && <SettingsPage skin={managementSkin} changeSkin={changeManagementSkin} restartGame={restartGame} layoutControl={<InterfaceLayoutPicker layout={interfaceLayout} onChange={changeInterfaceLayout}/>}/>}
      </SectionTabProvider></div>
      {activeEventModal && <EventAlertModal event={activeEventModal} onAcknowledge={() => handleResolveEvent(activeEventModal.id)} onOpenPage={(pg) => { if(!activeEventModal.metadata?.requiresDecision)handleResolveEvent(activeEventModal.id); else setActiveEventModal(null); goTo(pg); }}/>}
    </ManagementShell></ProfileProvider>;
  }

  return <ProfileProvider career={career} updateCareer={setCareer} open={openProfile}><main className="dashboard" style={{ "--team":team.primary,"--team-secondary":team.secondary } as React.CSSProperties}>
    <aside className="sidebar"><div className="dashboard-logo"><span>F1</span><strong>MANAGER</strong><small>2027</small></div><nav>{nav.map((item) => {
      const unreadCount = item.id === "comms" && career ? getUnreadEmailCount(career) : 0;
      return <button key={item.id} className={`${page===item.id?"active ":""}${item.id==="database"?"database-nav":""}`} onClick={() => goTo(item.id)}><i>{item.icon}</i>{item.label}{unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}</button>;
    })}</nav></aside>
    <section className="dashboard-main">
      <header className="topbar">
        {historyControls}
        <div><small>TEAM PRINCIPAL</small><strong>{team.principal}</strong></div>
        <div className="top-drivers"><small>DRIVER LINE-UP</small><strong>{headerDrivers.map(driver=><DriverLink key={driver.id} id={driver.id} name={driver.name}/>)}</strong></div>

        <div className="game-clock"><small>{phase}</small><strong>{date}</strong><time>{time}</time></div>

        {timeControls}

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="topbar-mail-btn"
            onClick={() => goTo("comms")}
            title={`Communications: ${career ? getUnreadEmailCount(career) : 0} unread`}
            aria-label="Open communications"
          >
            ✉
            {career && getUnreadEmailCount(career) > 0 && (
              <span className="mail-pill-badge">{getUnreadEmailCount(career)}</span>
            )}
          </button>
          <div className="settings-wrap">
            <button className="settings-button" onClick={() => { setSettingsOpen(!settingsOpen);setConfirmRestart(false); }} aria-label="Open settings">⚙</button>
            {settingsOpen&&<><button className="settings-dismiss" onClick={()=>setSettingsOpen(false)} aria-label="Close settings"/><SettingsPanel skin={skin} changeSkin={changeSkin} confirmRestart={confirmRestart} setConfirmRestart={setConfirmRestart} restartGame={restartGame}/></>}
          </div>
        </div>
      </header>

      {timeError && (
        <div style={{ background: "#73241b", color: "#ffdcd8", padding: "8px 24px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{timeError}</span>
          <button onClick={() => setTimeError(null)} style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer", fontWeight: "bold" }}>✕</button>
        </div>
      )}

      <div className="workspace">
        {profile&&<ProfilePage target={profile}/>}
        <div className="game-screen" hidden={!!profile}><SectionTabProvider value={tabContext}>
        {page!=="home"&&<button className="back-home" onClick={()=>goTo("home")}>← BACK TO HOME</button>}
        {page==="home"&&<Home team={team} career={career} open={goTo}/>}
        {page==="comms"&&<CommsPage career={career} updateCareer={setCareer} open={goTo}/>}
        {page==="team"&&<TeamPage team={team} career={career} updateCareer={setCareer}/>}
        {page==="race"&&<RacePage career={career} updateCareer={setCareer}/>}
        {page==="drivers"&&<DriversPage career={career} updateCareer={setCareer}/>}
        {page==="calendar"&&<CalendarPage career={career} open={goTo}/>}
        {page==="finance"&&<FinancesPage career={career} updateCareer={setCareer}/>}
        {page==="commercial"&&<CommercialFinancePage career={career} updateCareer={setCareer}/>}
        {page==="standings"&&<StandingsPage career={career}/>}
        {page==="market"&&<MarketPage career={career} updateCareer={setCareer} shortlist={shortlist} toggle={toggleShortlist}/>}
        {page==="database"&&<DatabasePage/>}
        {page==="settings"&&<SettingsPage skin={skin} changeSkin={changeSkin} restartGame={restartGame} layoutControl={<InterfaceLayoutPicker layout={interfaceLayout} onChange={changeInterfaceLayout}/>}/>}
        </SectionTabProvider></div>
      </div>

      {activeEventModal && (
        <EventAlertModal
          event={activeEventModal}
          onAcknowledge={() => handleResolveEvent(activeEventModal.id)}
          onOpenPage={(pg) => {
            if(!activeEventModal.metadata?.requiresDecision)handleResolveEvent(activeEventModal.id); else setActiveEventModal(null);
            goTo(pg);
          }}
        />
      )}

    </section>
  </main></ProfileProvider>;
}

function PageTitle({ eyebrow,title,children }:{ eyebrow:string;title:React.ReactNode;children?:React.ReactNode }) { return <header className="page-title"><div><small>{eyebrow}</small><h1>{title}</h1></div>{children}</header>; }
function Home({ team,career,open }:{ team:Team;career:CareerState;open:(page:Page)=>void }) { const next=nextCalendarSession(career.season.calendar); const round=next?.round; const session=next?.session; const unread=getUnreadEmailCount(career); const pending=getPendingDecisionCount(career); return <><PageTitle eyebrow="TEAM HEADQUARTERS" title={<>Welcome to <TeamLink id={team.id} name={team.shortName}/></>}/><div className="home-grid"><Tile title="Next event" meta={round?`Round ${round.roundNumber} · Weekend ${round.weekendNumber}`:"Season complete"} action={()=>open("race")} wide><h2>{round?.grandPrixName??"No remaining event"}</h2><p>{round?`${round.location} · ${formatGameDate(round.weekendEndDate)}`:"The calendar is complete."}</p><div className="tile-stats"><span><small>SESSION</small><b>{session?session.kind.replaceAll("_"," ").toUpperCase():"—"}</b></span><span><small>STATUS</small><b>{round?.status.replaceAll("_"," ").toUpperCase()??"COMPLETE"}</b></span></div></Tile><Tile title="Communications & Board" meta={`${unread} unread`} action={()=>open("comms")}><div className="home-team-mark">✉</div><h2>Executive Office</h2><p>{pending > 0 ? `${pending} decision dilemmas requiring attention` : "No decisions waiting"}</p></Tile><Tile title="Your team" meta={team.base} action={()=>open("team")}><div className="home-team-mark">{team.shortName.slice(0,3).toUpperCase()}</div><h2><TeamLink id={team.id} name={team.shortName}/></h2><p>{team.powerUnit} power unit</p></Tile><Tile title="Driver line-up" meta={`${career.season.year} line-up`} action={()=>open("drivers")}>{team.drivers.map((driver)=><div className="mini-driver" key={driver.id}><b>{driver.number}</b><span><DriverLink id={driver.id} name={driver.name}/><small>{driver.abbreviation} · {driver.nationality}</small></span></div>)}</Tile><Tile title="Season calendar" meta={`${career.season.calendar.rounds.length} rounds`} action={()=>open("calendar")}><h2>{career.season.year} campaign</h2><p>View the generated weekend schedule</p></Tile><Tile title="Championship" meta={`${career.season.year} standings`} action={()=>open("standings")}><h2>{career.championship.teams.find(entry=>entry.teamId===team.id)?.points ?? 0} points</h2><p>View the current championship.</p></Tile></div></>; }
function Tile({ title,meta,action,wide,children }:{ title:string;meta:string;action:()=>void;wide?:boolean;children:React.ReactNode }) { return <article className={`work-tile${wide?" wide":""}`}><div className="tile-head"><span>{title}</span><small>{meta}</small></div><div className="tile-body">{children}</div><button className="open-tile" onClick={action}>OPEN →</button></article>; }

function TeamPage(props: {team:Team;career:CareerState;updateCareer:(career:CareerState)=>void}) {
  return <ManufacturingPage career={props.career} updateCareer={props.updateCareer}/>;
}

function RacePage({ career, updateCareer }: { career: CareerState; updateCareer: (career: CareerState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = nextCalendarSession(career.season.calendar);
  const activeRound = career.weekendOperations.activeWeekendId
    ? career.season.calendar.rounds.find((round) => round.id === career.weekendOperations.activeWeekendId)
    : next?.round;
  const session = next?.session;

  async function handleSimulateNext() {
    setBusy(true);
    setError("");
    try {
      const updated = await simulateNextSession(career, simulatedSessionEngine);
      updateCareer(updated);
      if(updated.clock.status==="blocked" && updated.scheduler.pendingEvent?.actionPage!=="race")setError(`Paused for: ${updated.scheduler.pendingEvent?.title??"management action"}. Use Continue to review it.`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Session simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateWeekend(roundId: string) {
    setBusy(true);
    setError("");
    try {
      const updated = await simulateEntireWeekend(career, roundId, simulatedSessionEngine);
      updateCareer(updated);
      if(updated.clock.status==="blocked" && updated.scheduler.pendingEvent?.actionPage!=="race")setError(`Paused for: ${updated.scheduler.pendingEvent?.title??"management action"}. Use Continue to review it.`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Weekend simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleAdvanceRound() {
    setBusy(true);
    setError("");
    try {
      const res = advanceCareerWeekend(career);
      if (!res.changed) throw new Error("No further rounds scheduled.");
      updateCareer(res.career);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Advancement failed.");
    } finally {
      setBusy(false);
    }
  }

  function seasonAction() {
    setError("");
    try {
      updateCareer(career.season.phase === "offseason" ? startNextSeason(career) : completeCurrentSeason(career));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Season transition failed.");
    }
  }

  if (!activeRound && !next) {
    const isOffseason = career.season.phase === "offseason";
    const driverChamp = [...career.championship.drivers].sort(compareStandings)[0];
    const teamChamp = [...career.championship.teams].sort(compareStandings)[0];

    return (
      <>
        <PageTitle
          eyebrow={`${career.season.year} CHAMPIONSHIP SEASON`}
          title={isOffseason ? "Season Concluded · Off-Season" : "Season Finale Complete"}
        >
          <span className="status-chip">{isOffseason ? "OFF-SEASON ARCHIVE" : "FINAL ROUND ARCHIVED"}</span>
        </PageTitle>
        <section className="detail-card" style={{ maxWidth: 840, margin: "20px auto" }}>
          <h2>🏆 World Championship Honours</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, margin: "16px 0 24px" }}>
            <div style={{ background: "#1b1c21", padding: 18, borderRadius: 6, border: "1px solid #d4af37" }}>
              <small style={{ color: "#d4af37", fontWeight: 700, letterSpacing: "0.1em" }}>WORLD DRIVERS&apos; CHAMPION</small>
              <h3 style={{ margin: "6px 0 2px", font: "700 24px 'Barlow Condensed'", color: "#fff" }}>
                {driverChamp?<DriverLink id={driverChamp.driverId} name={driverChamp.driverName}/>:"Champion"}
              </h3>
              <span style={{ color: "#bbb", fontSize: 13 }}>
                {driverChamp&&<TeamLink id={driverChamp.teamId} name={career.championship.teams.find(t=>t.teamId===driverChamp.teamId)?.teamName}/>} · {driverChamp?.points ?? 0} PTS ({driverChamp?.wins ?? 0} Wins)
              </span>
            </div>
            <div style={{ background: "#1b1c21", padding: 18, borderRadius: 6, border: "1px solid #d4af37" }}>
              <small style={{ color: "#d4af37", fontWeight: 700, letterSpacing: "0.1em" }}>WORLD CONSTRUCTORS&apos; CHAMPION</small>
              <h3 style={{ margin: "6px 0 2px", font: "700 24px 'Barlow Condensed'", color: "#fff" }}>
                {teamChamp?<TeamLink id={teamChamp.teamId} name={teamChamp.teamName}/>:"Constructor"}
              </h3>
              <span style={{ color: "#bbb", fontSize: 13 }}>
                {teamChamp?.points ?? 0} Championship Points · {teamChamp?.wins ?? 0} Victories
              </span>
            </div>
          </div>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.6 }}>
            {isOffseason
              ? "The season record has been permanently archived. Prepare your workforce, facilities, and commercial partnerships for the upcoming season."
              : "All 24 Grand Prix events have concluded. Seal the season results to distribute Concorde prize money, enforce Cost Cap audit compliance, and transition to the off-season."}
          </p>
          {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
          <button className="page-restart" style={{ marginTop: 16 }} onClick={seasonAction}>
            {isOffseason ? "BEGIN NEXT CHAMPIONSHIP SEASON →" : "SEAL CHAMPIONSHIP & COMPLETE SEASON"}
          </button>
        </section>
      </>
    );
  }

  const shown = activeRound ?? next!.round;
  const isWeekendArchived = shown.status === "archived";
  const isWeekendCompleted = shown.status === "race_completed" || isWeekendArchived;

  const roundOutputs = career.weekendOperations.outputs.filter((o) =>
    shown.sessions.some((s) => s.id === o.sessionId)
  );
  const raceOutput = roundOutputs.find((o) => o.sessionId.includes("-race"));
  const sprintOutput = roundOutputs.find((o) => o.sessionId.includes("-sprint") && !o.sessionId.includes("qualifying"));
  const qualOutput = roundOutputs.find((o) => o.sessionId.includes("-qualifying"));
  const activeOutput = raceOutput ?? sprintOutput ?? qualOutput ?? roundOutputs.at(-1);

  const top3 = activeOutput?.classification.slice(0, 3) ?? [];
  const getDriver = (driverId: string) => {
    return teams.flatMap((t) => t.drivers).find((d) => d.id === driverId);
  };
  const getTeamOfDriver = (driverId: string) => {
    return teams.find((t) => t.drivers.some((d) => d.id === driverId));
  };

  const pointsScale: Record<number, number> = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };

  return (
    <>
      <PageTitle
        eyebrow={`ROUND ${String(shown.roundNumber).padStart(2, "0")} · ${shown.weekendId}`}
        title={shown.grandPrixName}
      >
        <span className={`status-chip ${isWeekendArchived ? "archived" : ""}`}>
          {shown.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </PageTitle>

      <div className="race-action-banner">
        <div className="race-banner-info">
          <h3>
            {isWeekendArchived
              ? "Grand Prix Weekend Archived"
              : isWeekendCompleted
              ? "Grand Prix Concluded · Ready to Archive"
              : session
              ? `Next Session: ${session.kind.replaceAll("_", " ").toUpperCase()}`
              : "Weekend in Progress"}
          </h3>
          <p>
            {isWeekendArchived
              ? "Points and prize standings updated in the World Championship. Advance to the next round."
              : isWeekendCompleted
              ? "The race is finished and classifications are verified. Click to finalize and archive."
              : `Scheduled at ${formatGameDate(session?.date ?? shown.sessions[0].date)} · ${shown.sprint ? "Sprint Weekend" : "Standard Format"}`}
          </p>
        </div>

        <div className="race-banner-actions">
          {isWeekendArchived ? (
            <button
              className="primary-adv-btn"
              disabled={busy}
              onClick={handleAdvanceRound}
            >
              {busy ? "ADVANCING…" : "CONTINUE TO NEXT ROUND →"}
            </button>
          ) : (
            <>
              <button
                className="secondary-adv-btn"
                disabled={busy}
                onClick={handleSimulateNext}
                title="Simulate the immediate upcoming session"
              >
                {busy ? "SIMULATING…" : `SIMULATE ${session?.kind ? session.kind.replace("_", " ").toUpperCase() : "NEXT SESSION"}`}
              </button>
              <button
                className="primary-adv-btn"
                disabled={busy}
                onClick={() => handleSimulateWeekend(shown.id)}
                title="Simulate all remaining sessions and archive the Grand Prix in one click"
              >
                {busy ? "SIMULATING GP…" : "⚡ SIMULATE ENTIRE GRAND PRIX"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#7f1d1d", color: "#fecaca", padding: "10px 18px", borderRadius: 4, margin: "14px 0", fontSize: 13 }}>
          {error}
        </div>
      )}

      {activeOutput && top3.length === 3 && (
        <div className="podium-showcase">
          <div className="podium-card podium-silver">
            <span className="podium-pos">2ND</span>
            <span className="podium-medal">🥈</span>
            <h4><DriverLink id={top3[1].driverId} name={getDriver(top3[1].driverId)?.name ?? top3[1].driverId}/></h4>
            <small><TeamLink id={getTeamOfDriver(top3[1].driverId)?.id} name={getTeamOfDriver(top3[1].driverId)?.name}/></small>
            <strong className="podium-pts">+{activeOutput.sessionId.includes("-race") ? 18 : 0} PTS</strong>
          </div>

          <div className="podium-card podium-gold">
            <span className="podium-pos">WINNER</span>
            <span className="podium-medal">🥇</span>
            <h4><DriverLink id={top3[0].driverId} name={getDriver(top3[0].driverId)?.name ?? top3[0].driverId}/></h4>
            <small><TeamLink id={getTeamOfDriver(top3[0].driverId)?.id} name={getTeamOfDriver(top3[0].driverId)?.name}/></small>
            <strong className="podium-pts">+{activeOutput.sessionId.includes("-race") ? 25 : 0} PTS</strong>
          </div>

          <div className="podium-card podium-bronze">
            <span className="podium-pos">3RD</span>
            <span className="podium-medal">🥉</span>
            <h4><DriverLink id={top3[2].driverId} name={getDriver(top3[2].driverId)?.name ?? top3[2].driverId}/></h4>
            <small><TeamLink id={getTeamOfDriver(top3[2].driverId)?.id} name={getTeamOfDriver(top3[2].driverId)?.name}/></small>
            <strong className="podium-pts">+{activeOutput.sessionId.includes("-race") ? 15 : 0} PTS</strong>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <section className="detail-card">
          <h2>Event Schedule</h2>
          {shown.sessions.map((entry) => {
            const isDone = entry.status === "completed";
            return (
              <div className="schedule-row" key={entry.id}>
                <div>
                  <b style={{ color: isDone ? "#4ade80" : "#fff" }}>
                    {isDone ? "✓ " : ""}{entry.kind.replaceAll("_", " ").toUpperCase()}
                  </b>
                  <small style={{ display: "block", color: "#888", fontSize: 10 }}>
                    {formatGameDate(entry.date)} · {String(Math.floor(entry.minuteOfDay / 60)).padStart(2, "0")}:{String(entry.minuteOfDay % 60).padStart(2, "0")}
                  </small>
                </div>
                <span className={`session-status-badge ${entry.status}`}>
                  {entry.status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </section>

        <section className="detail-card span-two">
          <h2>
            {activeOutput
              ? `Official Classification (${activeOutput.sessionId.split("-").at(-1)?.toUpperCase()})`
              : "Weekend Status & Preview"}
          </h2>

          {activeOutput && activeOutput.classification.length > 0 ? (
            <div className="classification-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>POS</th>
                    <th>DRIVER</th>
                    <th>CONSTRUCTOR</th>
                    <th>STATUS / GAP</th>
                    <th style={{ textAlign: "right" }}>POINTS</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOutput.classification.map((row) => {
                    const drv = getDriver(row.driverId);
                    const tm = getTeamOfDriver(row.driverId);
                    const isPlayerDriver = tm?.id === career.player.teamId;
                    const pts = activeOutput.sessionId.includes("-race") ? pointsScale[row.position] ?? 0 : 0;

                    return (
                      <tr key={row.driverId} className={isPlayerDriver ? "player-driver-row" : ""}>
                        <td className="pos-cell">
                          <span className={`pos-pill pos-${row.position}`}>
                            {row.position}
                          </span>
                        </td>
                        <td className="driver-cell">
                          <strong><DriverLink id={row.driverId} name={drv?.name ?? row.driverId}/></strong>
                          {isPlayerDriver && <span className="player-tag">YOUR DRIVER</span>}
                        </td>
                        <td className="team-cell">
                          <span style={{ color: tm?.primary ?? "#fff" }}><TeamLink id={tm?.id} name={tm?.shortName??"F1 Team"}/></span>
                        </td>
                        <td className="gap-cell">
                          {row.status === "retired" ? (
                            <span style={{ color: "#ef4444", fontWeight: 700 }}>DNF (Retired)</span>
                          ) : row.position === 1 ? (
                            <span style={{ color: "#22c55e", fontWeight: 700 }}>Winner ({row.laps} Laps)</span>
                          ) : (
                            <span>+{((row.gapMs ?? 0) / 1000).toFixed(3)}s</span>
                          )}
                        </td>
                        <td className="pts-cell" style={{ textAlign: "right" }}>
                          {pts > 0 ? (
                            <strong style={{ color: "#f59e0b", font: "700 15px 'Barlow Condensed'" }}>
                              +{pts}
                            </strong>
                          ) : (
                            <span style={{ color: "#555" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "20px 0" }}>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>
                The race weekend is ready. Click <strong>SIMULATE NEXT SESSION</strong> to advance through practice and qualifying, or click <strong>⚡ SIMULATE ENTIRE GRAND PRIX</strong> to run all sessions, establish the winner, and award official FIA championship points in one click.
              </p>
              <dl style={{ marginTop: 20 }}>
                <Fact label="Format" value={shown.sprint ? "Sprint Weekend (Sprint + GP)" : "Standard Format (3x Practice, Qual, GP)"} />
                <Fact label="Total Laps" value={shown.sessions.find((s) => s.kind === "race") ? "Full Grand Prix Distance" : "Standard"} />
                <Fact label="Championship Rules" value="FIA 2026 Sporting Regulations (25-18-15-12-10-8-6-4-2-1)" />
                <Fact label="Engine" value="Basic quick simulator" />
              </dl>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function DriversPage({career,updateCareer}: {career:CareerState;updateCareer:(career:CareerState)=>void}) {
  const [tab,setTab]=useSectionTab<"lineup"|"contracts">("lineup");
  const tabs=<div className="calendar-tabs-bar"><button className={`calendar-tab-btn${tab==="lineup"?" active":""}`} onClick={()=>setTab("lineup")}>Driver line-up</button><button className={`calendar-tab-btn${tab==="contracts"?" active":""}`} onClick={()=>setTab("contracts")}>Contracts</button></div>;
  if(tab==="contracts")return <>{tabs}<ContractDesk career={career} updateCareer={updateCareer}/></>;
  const lineup=career.workforce.lineups.find(item=>item.teamId===career.player.teamId&&item.season===career.season.year);
  const drivers=(lineup?.driverIds??[]).map(id=>career.workforce.people.find(person=>person.id===id)).filter(person=>person!==undefined);
  return <>{tabs}<PageTitle eyebrow="TEAM" title="Driver line-up"/><section className="detail-card">{drivers.map(driver=><p key={driver.id}><strong><DriverLink id={driver.id} name={driver.name}/></strong>{driver.carNumber!=null&&<span> · #{driver.carNumber}</span>}</p>)}<p>Race line-up from this saved career. Open Contracts to review reference commitments and plan future offers.</p></section></>;
}

function formatGameDate(date:string) { return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`)); }
function CalendarPage({career,open}:{career:CareerState;open:(page:Page)=>void}) {
  return <><PageTitle eyebrow={`${career.season.year} SEASON · UTC GAME CLOCK`} title="Calendar"/>
    <CalendarFeature career={career} open={open} section="races"/></>;
}

function EventAlertModal({
  event,
  onAcknowledge,
  onOpenPage,
}: {
  event: TimelineEvent;
  onAcknowledge: () => void;
  onOpenPage: (page: Page) => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <span className={`modal-chip ${event.severity}`}>{event.severity} EVENT</span>
          <span className="modal-chip">{event.category.replace("_", " ")}</span>
        </div>
        <h2>{event.title}</h2>
        <div className="modal-date">DATE: {formatGameDate(event.date)}</div>
        <p className="modal-desc">{event.description || "Management decision and action required."}</p>
        <div className="modal-actions">
          {event.actionPage && (
            <button className="btn-secondary" onClick={() => onOpenPage(event.actionPage!)}>
              {event.actionLabel || `Open ${event.actionPage}`} →
            </button>
          )}
          {!event.metadata?.requiresDecision && <button className="btn-primary" onClick={onAcknowledge}>Acknowledge & Continue</button>}
        </div>
      </div>
    </div>
  );
}

function FinancePage(_props:{career:CareerState;updateCareer:(career:CareerState)=>void}) {
  return <UnbuiltSection eyebrow="COMMERCIAL" initial="prize" views={[['prize','Prize money & merchandise'],['sponsors','Sponsors']]}/>;
}

function StandingsPage({career}:{career:CareerState}) {
  const [tab,setTab]=useSectionTab<"teams"|"drivers">("teams");
  const rows=tab==="teams"?[...career.championship.teams].sort(compareStandings):[...career.championship.drivers].sort(compareStandings);
  return <><PageTitle eyebrow={`${career.championship.year} CHAMPIONSHIP`} title="Standings"><div className="tabs"><button className={tab==="teams"?"active":""} onClick={()=>setTab("teams")}>CONSTRUCTORS</button><button className={tab==="drivers"?"active":""} onClick={()=>setTab("drivers")}>DRIVERS</button></div></PageTitle><div className="standings-table"><div className="table-head"><span>POS</span><span>{tab==="teams"?"CONSTRUCTOR":"DRIVER"}</span><span>PTS</span></div>{rows.map((item,index)=><div className="table-row" key={'driverId' in item?item.driverId:item.teamId}><b>{index+1}</b><span>{'driverName' in item?<><DriverLink id={item.driverId} name={item.driverName}/><small><TeamLink id={item.teamId} name={career.championship.teams.find(team=>team.teamId===item.teamId)?.teamName??item.teamId}/></small></>:<TeamLink id={item.teamId} name={item.teamName}/>}</span><strong>{item.points}</strong></div>)}</div></>;
}
function MarketPage(_props:{career:CareerState;updateCareer:(career:CareerState)=>void;shortlist:string[];toggle:(name:string)=>void}) {
  return <UnbuiltSection eyebrow="SCOUTING" initial="grid_drivers" views={[['grid_drivers','Driver market'],['prospects','Free agents & prospects'],['staff','Staff & engineers']]}/>;
}

type FactPerson = { id:number;display_name:string;date_of_birth:string|null;racing_nationality:string|null;place_of_birth:string|null;person_type:string;f1_debut_season:number|null;source_key:string;verified_on:string };
type FactEntry = { person_id:number;series:string;season:number;entrant_name:string;car_number:number|null;entry_role:string };
type FactTeam = { id:number;slug:string;short_name:string;official_full_name:string;legal_name:string|null;base_city:string|null;base_country:string|null;team_chief:string|null;technical_chief:string|null;chassis:string|null;power_unit:string|null;first_team_entry:number|null };
type FactStaff = { person_id:number;team_id:number;season:number;role_title:string };
type FactTrack = { id:number;slug:string;circuit_name:string;display_name:string;city:string|null;country:string;circuit_type:string|null;lap_length_km:number|null;race_laps:number|null;race_distance_km:number|null;first_f1_grand_prix_year:number|null;official_2026_calendar:boolean;confirmed_future_event:boolean;future_confirmed_through_year:number|null;future_event_source_url:string|null;f1_history_status:string|null;fia_grade:string|null;fia_licence_expiry:string|null;fia_status_note:string|null;fia_source_key:string|null;f1_facts_source_url:string|null;source_key:string;verified_on:string };
type SelectedFact = { kind:"driver"|"staff";person:FactPerson };

function DatabasePage() {
  const [tab,setTab]=useSectionTab<"drivers"|"staff"|"teams"|"tracks">("drivers");
  const [people,setPeople]=useState<FactPerson[]>([]); const [entries,setEntries]=useState<FactEntry[]>([]);
  const [staff,setStaff]=useState<FactStaff[]>([]); const [factTeams,setFactTeams]=useState<FactTeam[]>([]); const [tracks,setTracks]=useState<FactTrack[]>([]);
  const [selected,setSelected]=useState<SelectedFact|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{ let live=true; (async()=>{ const [p,e,s,t,c]=await Promise.all([
    supabase.from("people").select("id,display_name,date_of_birth,racing_nationality,place_of_birth,person_type,f1_debut_season,source_key,verified_on").order("display_name"),
    supabase.from("series_entries").select("person_id,series,season,entrant_name,car_number,entry_role"),
    supabase.from("f1_team_staff").select("person_id,team_id,season,role_title"),
    supabase.from("f1_team_facts").select("id,slug,short_name,official_full_name,legal_name,base_city,base_country,team_chief,technical_chief,chassis,power_unit,first_team_entry").order("short_name"),
    supabase.from("track_facts").select("id,slug,circuit_name,display_name,city,country,circuit_type,lap_length_km,race_laps,race_distance_km,first_f1_grand_prix_year,official_2026_calendar,confirmed_future_event,future_confirmed_through_year,future_event_source_url,f1_history_status,fia_grade,fia_licence_expiry,fia_status_note,fia_source_key,f1_facts_source_url,source_key,verified_on").order("display_name")
  ]); if(!live)return; const failed=[p,e,s,t,c].find(x=>x.error); if(failed?.error)setError(failed.error.message); else { setPeople((p.data||[]) as FactPerson[]);setEntries((e.data||[]) as FactEntry[]);setStaff((s.data||[]) as FactStaff[]);setFactTeams((t.data||[]) as FactTeam[]);setTracks((c.data||[]) as FactTrack[]); } setLoading(false); })(); return()=>{live=false}; },[]);
  const drivers=people.filter(p=>p.person_type.includes("driver")); const staffPeople=people.filter(p=>staff.some(a=>a.person_id===p.id));
  const teamName=(id:number)=>factTeams.find(t=>t.id===id)?.short_name||"Unknown team";
  return <><div className="database-tabs">{(["drivers","staff","teams","tracks"] as const).map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {tab==="drivers"?<DriverDatabaseTable/>:tab==="staff"?<StaffDatabaseTable/>:loading?<section className="database-message">Loading verified records…</section>:error?<section className="database-message">Database unavailable: {error}</section>:tab==="teams"?<TeamDatabaseTable teams={factTeams}/>:<div className="database-list">
      {tab==="tracks"&&tracks.map(x=><TrackFactCard key={x.id} track={x}/>)}
    </div>}{selected&&<PersonFactModal selected={selected} entries={entries} assignments={staff} teams={factTeams} close={()=>setSelected(null)}/>}</>;
}
function TeamDatabaseTable({teams}:{teams:FactTeam[]}) {
  const {catalogue}=useProfiles();
  const [search,setSearch]=useState(''),[view,setView]=useState('overview'),[sort,setSort]=useState('short_name'),[ascending,setAscending]=useState(true);
  const views:Record<string,{label:string;fields:[string,string][]}>={overview:{label:'Overview',fields:[['official_full_name','Official name'],['base_city','Base city'],['base_country','Country'],['first_team_entry','First entry']]},technical:{label:'Technical',fields:[['chassis','Chassis'],['power_unit','Power unit'],['technical_chief','Technical chief']]},organisation:{label:'Organisation',fields:[['legal_name','Legal name'],['team_chief','Team chief'],['technical_chief','Technical chief']]}};
  const template=catalogue.legacyTeams[0];
  if(template)for(const group of teamRatingGroups(template))for(let offset=0;offset<group.fields.length;offset+=6){
    const subset=group.fields.slice(offset,offset+6),suffix=group.fields.length>6?` ${Math.floor(offset/6)+1}`:'';
    views[`rating:${group.title}:${offset}`]={label:`${group.title}${suffix}`,fields:subset.map(f=>[f.key,f.label])};
  }
  const first=catalogue.teamBaselines.find(row=>row.dataset_version==='f1-team-baseline-2027-v1');
  for(const [key,label] of [['facilities','Facilities'],['financial_assumptions_usd_millions','Finance assumptions'],['objectives','Objectives']] as const){
    const obj=first?.[key];if(!obj||typeof obj!=='object')continue;const keys=Object.keys(obj);
    for(let offset=0;offset<keys.length;offset+=6)views[`${key}:${offset}`]={label:`${label}${keys.length>6?` ${Math.floor(offset/6)+1}`:''}`,fields:keys.slice(offset,offset+6).map(k=>[k,databaseFieldLabel(k)])};
  }
  const current=views[view]??views.overview;
  const data=teams.map(team=>{
    const baseline=catalogue.teamBaselines.find(row=>row.team_slug===team.slug&&row.dataset_version==='f1-team-baseline-2027-v1');
    return {...team,...(baseline?.ratings as Record<string,unknown>??{}),...(baseline?.facilities as Record<string,unknown>??{}),...(baseline?.financial_assumptions_usd_millions as Record<string,unknown>??{}),...(baseline?.objectives as Record<string,unknown>??{})} as Record<string,unknown>&FactTeam;
  });
  const rows=data.filter(team=>Object.values(team).some(value=>String(value??'').toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>{const av=a[sort],bv=b[sort];if(av==null)return bv==null?0:1;if(bv==null)return -1;const comparison=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true});return ascending?comparison:-comparison;});
  const columns:[string,string][]=[['short_name','Team'],...current.fields];
  return <section className="driver-database" aria-label="Teams database"><div className="driver-database-tools"><label className="driver-database-search"><span className="driver-database-control-label">Search teams</span><input type="search" aria-label="Search teams" placeholder="Search teams" value={search} onChange={e=>setSearch(e.target.value)}/></label><label><span className="driver-database-control-label">Team view</span><select aria-label="Team view" value={view} onChange={e=>{setView(e.target.value);setSort('short_name');setAscending(true);}}>{Object.entries(views).map(([id,v])=><option key={id} value={id}>{v.label}</option>)}</select></label><button className="driver-database-reset" onClick={()=>{setSearch('');setView('overview');setSort('short_name');setAscending(true);}}>Reset view</button></div><section className="driver-database-block"><h2>{current.label}</h2>{first?.storage==="local_preview"&&<p>Local preview · team database migration pending</p>}<div className="driver-database-scroll"><table><caption>Teams and selected database details. Select a column heading to sort. Starting ratings and financial values are game assumptions.</caption><thead><tr>{columns.map(([key,label])=><th scope="col" key={key} aria-sort={sort===key?ascending?'ascending':'descending':'none'}><button onClick={()=>{setAscending(sort===key?!ascending:true);setSort(key);}}>{label}<span aria-hidden="true">{sort===key?ascending?' ↑':' ↓':' ↕'}</span></button></th>)}</tr></thead><tbody>{rows.map(team=><tr key={team.id}>{columns.map(([key])=><td key={key} className={team[key]==null?'driver-database-missing':undefined}>{key==='short_name'?<TeamLink id={`ref:${team.id}`} name={team.short_name}/>:team[key]==null?'Not recorded':typeof team[key]==='boolean'?(team[key]?'Yes':'No'):String(team[key])}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="driver-database-empty">No teams match this search.</p>}</div></section></section>;
}
function Fact({label,value}:{label:string;value:string|number|null|undefined}) { return <div><dt>{label}</dt><dd>{value??"Not recorded"}</dd></div>; }
function TrackFactCard({track:x}:{track:FactTrack}) { return <article><b>{x.display_name}</b><span>{x.circuit_name}</span><dl><Fact label="Database ID" value={x.slug}/><Fact label="Location" value={[x.city,x.country].filter(Boolean).join(", ")}/><Fact label="Type" value={x.circuit_type}/><Fact label="Lap length" value={x.lap_length_km&&`${x.lap_length_km} km`}/><Fact label="Race laps" value={x.race_laps}/><Fact label="Race distance" value={x.race_distance_km&&`${x.race_distance_km} km`}/><Fact label="F1 history status" value={x.f1_history_status?.replaceAll("_"," ")}/><Fact label="First F1 GP" value={x.first_f1_grand_prix_year}/><Fact label="2026 calendar" value={x.official_2026_calendar?"Yes":"No"}/><Fact label="Confirmed future event" value={x.confirmed_future_event?"Yes":"No"}/><Fact label="Confirmed through" value={x.future_confirmed_through_year}/><Fact label="FIA grade" value={x.fia_grade}/><Fact label="Licence expiry in source" value={x.fia_licence_expiry}/><Fact label="FIA status" value={x.fia_status_note}/><Fact label="Primary source" value={x.source_key}/><Fact label="FIA source" value={x.fia_source_key}/><Fact label="F1 facts source" value={x.f1_facts_source_url}/><Fact label="Future-event source" value={x.future_event_source_url}/><Fact label="Verified on" value={x.verified_on}/></dl></article>; }
function PersonFactModal({selected,entries,assignments,teams,close}:{selected:SelectedFact;entries:FactEntry[];assignments:FactStaff[];teams:FactTeam[];close:()=>void}) { const p=selected.person; const roles=assignments.filter(x=>x.person_id===p.id); const drives=entries.filter(x=>x.person_id===p.id); return <div className="fact-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="fact-modal" role="dialog" aria-modal="true" aria-label={`${p.display_name} details`}><button className="fact-modal-close" onClick={close}>CLOSE ×</button><small>{selected.kind.toUpperCase()} RECORD</small><h2>{p.display_name}</h2><dl><Fact label="Date of birth" value={p.date_of_birth?new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${p.date_of_birth}T00:00:00Z`)):null}/><Fact label="Nationality" value={p.racing_nationality}/><Fact label="Place of birth" value={p.place_of_birth}/><Fact label="F1 debut season" value={p.f1_debut_season}/><Fact label="Verified on" value={p.verified_on}/><Fact label="Source record" value={p.source_key}/></dl>{drives.length>0&&<div className="fact-history"><h3>Entries and roles</h3>{drives.map((x,i)=><p key={`${x.series}-${x.entrant_name}-${i}`}><b>{x.season} {x.series}</b><span><TeamLink name={x.entrant_name}/> · {x.entry_role.replace("_"," ")}{x.car_number?` · #${x.car_number}`:""}</span></p>)}</div>}{roles.length>0&&<div className="fact-history"><h3>Team roles</h3>{roles.map((x,i)=><p key={i}><b>{x.season}</b><span>{x.role_title} · <TeamLink id={`ref:${x.team_id}`} name={teams.find(t=>t.id===x.team_id)?.official_full_name||"Unknown team"}/></span></p>)}</div>}</section></div>; }

function SettingsPage({ skin,changeSkin,restartGame,layoutControl }:{ skin:Skin;changeSkin:(skin:Skin)=>void;restartGame:()=>void;layoutControl?:React.ReactNode }) { const [confirm,setConfirm]=useState(false); return <><PageTitle eyebrow="GAME" title="Settings"/>{layoutControl}<section className="detail-card settings-page"><h2>Appearance</h2><p>Choose how the management interface is presented.</p><SkinButtons skin={skin} changeSkin={changeSkin}/><h2>Career</h2>{confirm?<div className="page-restart-confirm"><p>This removes the current team selection and starts a new career.</p><button onClick={()=>setConfirm(false)}>CANCEL</button><button onClick={restartGame}>CONFIRM RESTART</button></div>:<button className="page-restart" onClick={()=>setConfirm(true)}>RESTART GAME</button>}</section></>; }
function SkinButtons({ skin,changeSkin }:{ skin:Skin;changeSkin:(skin:Skin)=>void }) { return <div className="skin-grid">{skins.map(option=><button key={option} className={skin===option?"selected":""} onClick={()=>changeSkin(option)}><i className={`skin-swatch ${option}`}/>{option}</button>)}</div>; }
function SettingsPanel({ skin,changeSkin,confirmRestart,setConfirmRestart,restartGame }:{ skin:Skin;changeSkin:(skin:Skin)=>void;confirmRestart:boolean;setConfirmRestart:(value:boolean)=>void;restartGame:()=>void }) { return <section className="settings-menu"><span>GAME SETTINGS</span><label className="skin-label">APPEARANCE</label><SkinButtons skin={skin} changeSkin={changeSkin}/>{confirmRestart?<div className="restart-confirm"><p>Restart this career and choose a new team?</p><div><button onClick={()=>setConfirmRestart(false)}>CANCEL</button><button className="danger" onClick={restartGame}>RESTART</button></div></div>:<button className="restart-button" onClick={()=>setConfirmRestart(true)}><b>↻</b><span><strong>Restart game</strong><small>Return to team selection</small></span></button>}</section>; }

function CommsPage(_props:{career:CareerState;updateCareer:(career:CareerState)=>void;open:(page:Page)=>void}) {
  return <UnbuiltSection eyebrow="HOME" initial="inbox" views={[['inbox','Inbox'],['meetings','Meetings & board'],['paddock','Paddock news']]}/>;
}

function UnbuiltSection({eyebrow,initial,views}:{eyebrow:string;initial:string;views:[string,string][]}) {
  const [tab,setTab]=useSectionTab(initial);
  const title=views.find(([id])=>id===tab)?.[1]??views[0][1];
  return <><PageTitle eyebrow={eyebrow} title={title}/><div className="team-subtabs">{views.map(([id,label])=><button key={id} className={`team-subtab-btn${id===tab?' active':''}`} onClick={()=>setTab(id)}>{label}</button>)}</div><section className="detail-card"><h2>Not implemented yet</h2><p>This section is empty and ready to be built.</p></section></>;
}
