"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { teams } from "@/lib/data/grid";
import { startGameClock } from "@/lib/gameClock";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"team" | "confirm">("team");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => teams.find((team) => team.id === selectedId), [selectedId]);
  function beginSeason() { if (selected) { localStorage.setItem("f1-manager-team", selected.id); startGameClock(); router.push("/game"); } }
  return <main className="setup-shell">
    <header className="setup-header"><div className="wordmark"><span>F1</span> MANAGER</div><div className="season-label">2027 SEASON · 11 TEAMS · 22 DRIVERS</div></header>
    <section className="setup-content"><div className="eyebrow">STEP {step === "team" ? "1" : "2"} OF 2</div>
      {step === "team" ? <><h1>Choose your constructor</h1><p className="intro">Take control of one of the eleven teams on the 2027 grid. Each team begins with its 2026 driver pairing.</p>
        <div className="team-grid">{teams.map((team) => { const active = team.id === selectedId; return <button className={`team-card${active ? " selected" : ""}`} key={team.id} onClick={() => setSelectedId(team.id)} style={{ "--team": team.primary, "--team-secondary": team.secondary } as React.CSSProperties}>
          <div className="team-stripe"/><div className="team-card-top"><span className="team-monogram">{team.shortName.slice(0, 3).toUpperCase()}</span>{active && <span className="check">✓</span>}</div><h2>{team.shortName}</h2><div className="driver-pair">{team.drivers.map((driver) => <span key={driver.id}><b>{driver.number}</b> {driver.name}</span>)}</div><small>{team.base}</small>
        </button>})}</div><div className="setup-actions"><button className="primary-action" disabled={!selected} onClick={() => setStep("confirm")}>NEXT: CONFIRM <span>→</span></button></div></>
      : selected ? <div className="confirm-wrap" style={{ "--team": selected.primary, "--team-secondary": selected.secondary } as React.CSSProperties}><h1>Confirm your team</h1><p className="intro">This will be your constructor for the beginning of the 2027 season.</p>
        <div className="confirm-card"><div className="confirm-banner"><span className="confirm-mark">{selected.shortName.slice(0, 3).toUpperCase()}</span><div><h2>{selected.name}</h2><p>{selected.base}</p></div></div><div className="confirm-details"><div><label>TEAM PRINCIPAL</label><strong>{selected.principal}</strong></div><div><label>POWER UNIT</label><strong>{selected.powerUnit}</strong></div></div><div className="confirm-drivers">{selected.drivers.map((driver) => <div key={driver.id}><span className="number">{driver.number}</span><span><small>{driver.abbreviation} · {driver.nationality}</small><strong>{driver.name}</strong></span></div>)}</div></div>
        <div className="setup-actions split"><button className="secondary-action" onClick={() => setStep("team")}>← BACK</button><button className="primary-action" onClick={beginSeason}>BEGIN SEASON <span>→</span></button></div></div> : null}
    </section>
  </main>;
}
