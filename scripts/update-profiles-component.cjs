const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/game/Profiles.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Types
const oldType = `type Catalogue={people:Person[];entries:Entry[];teams:TeamFact[];staff:Staff[];contracts:Contract[];slots:Slot[];sources:Source[];datasets:Dataset[]};
const EMPTY:Catalogue={people:[],entries:[],teams:[],staff:[],contracts:[],slots:[],sources:[],datasets:[]};`.replace(/\r?\n/g, '\r\n');

const newType = `type TeamAchievement={team_id:number|null;team_slug:string;constructors_championships:number;drivers_championships:number;race_wins:number;podiums:number;pole_positions:number;fastest_laps:number;first_win_year:number|null;last_win_year:number|null;last_championship_year:number|null;notable_achievements:string|null};
type DriverCareerStint={person_id:number|null;driver_slug:string;season:number;team_name:string;team_slug:string|null;starts:number;wins:number;podiums:number;poles:number;points:number;championship_position:number|null;titles_won:number};
type Catalogue={people:Person[];entries:Entry[];teams:TeamFact[];staff:Staff[];contracts:Contract[];slots:Slot[];sources:Source[];datasets:Dataset[];teamAchievements:TeamAchievement[];driverHistory:DriverCareerStint[]};
const EMPTY:Catalogue={people:[],entries:[],teams:[],staff:[],contracts:[],slots:[],sources:[],datasets:[],teamAchievements:[],driverHistory:[]};`.replace(/\r?\n/g, '\r\n');

if (!content.includes(oldType)) {
  console.error('Could not find oldType in Profiles.tsx');
  process.exit(1);
}
content = content.replace(oldType, newType);

// 2. Query map
const oldQueries = `const queries={people:"people",entries:"series_entries",teams:"f1_team_facts",staff:"f1_team_staff",contracts:"driver_contracts_2027",slots:"f1_team_driver_slots",sources:"data_sources",datasets:"f1_contract_reference_datasets"};`;
const newQueries = `const queries={people:"people",entries:"series_entries",teams:"f1_team_facts",staff:"f1_team_staff",contracts:"driver_contracts_2027",slots:"f1_team_driver_slots",sources:"data_sources",datasets:"f1_contract_reference_datasets",teamAchievements:"f1_team_achievements",driverHistory:"f1_driver_career_history"};`;

if (!content.includes(oldQueries)) {
  console.error('Could not find oldQueries in Profiles.tsx');
  process.exit(1);
}
content = content.replace(oldQueries, newQueries);

// 3. Driver Profile display
const oldDriverHistory = `<Card title="Career history">{history.length?<div className="profile-record-list">{history.map(row=><article key={row.year}><small>{row.year} SEASON</small><strong>{row.standing!.points} points · {row.standing!.wins} wins · {row.standing!.podiums} podiums</strong><TeamLink id={row.standing!.teamId} name={teams.find(team=>team.id===row.standing!.teamId)?.shortName??row.standing!.teamId}/></article>)}</div>:<p>No completed seasons recorded for this driver.</p>}</Card>`;

const newDriverHistory = `<Card title="Career history">{history.length?<div className="profile-record-list">{history.map(row=><article key={row.year}><small>{row.year} SEASON</small><strong>{row.standing!.points} points · {row.standing!.wins} wins · {row.standing!.podiums} podiums</strong><TeamLink id={row.standing!.teamId} name={teams.find(team=>team.id===row.standing!.teamId)?.shortName??row.standing!.teamId}/></article>)}</div>:<p>No completed seasons recorded for this driver.</p>}</Card>
    <div className="profile-wide"><DriverHistoricalStints driverSlug={reference?.slug} /></div>`;

if (!content.includes(oldDriverHistory)) {
  console.error('Could not find oldDriverHistory in Profiles.tsx');
  process.exit(1);
}
content = content.replace(oldDriverHistory, newDriverHistory);

// 4. Team Profile display
const oldTeamHero = `<header className="profile-hero" style={{"--profile-accent":game?.primary??"#4779bd"} as React.CSSProperties}><div className="profile-monogram team">{(fact?.short_name??game?.shortName??entryName).slice(0,3).toUpperCase()}</div><div><small>TEAM PROFILE</small><h1>{name}</h1><p>{fact?[fact.base_city,fact.base_country].filter(Boolean).join(", "):game?.base??"Reference entry team"}</p><span className="profile-muted">{game?\`\${career.season.year} career constructor\`:"Series entry catalogue"}</span></div></header>`;

const newTeamHero = `<header className="profile-hero" style={{"--profile-accent":game?.primary??"#4779bd"} as React.CSSProperties}><div className="profile-monogram team">{(fact?.short_name??game?.shortName??entryName).slice(0,3).toUpperCase()}</div><div><small>TEAM PROFILE</small><h1>{name}</h1><p>{fact?[fact.base_city,fact.base_country].filter(Boolean).join(", "):game?.base??"Reference entry team"}</p><span className="profile-muted">{game?\`\${career.season.year} career constructor\`:"Series entry catalogue"}</span></div></header>
    <TeamPalmaresBanner teamSlug={fact?.slug??game?.id} />`;

if (!content.includes(oldTeamHero)) {
  console.error('Could not find oldTeamHero in Profiles.tsx');
  process.exit(1);
}
content = content.replace(oldTeamHero, newTeamHero);

// 5. Add Helper Components at bottom
const helperComponents = `
function TeamPalmaresBanner({teamSlug}:{teamSlug?:string}){
  const {catalogue}=useProfiles();
  const achievement=catalogue.teamAchievements?.find(t=>t.team_slug===teamSlug||(teamSlug==="red-bull"&&t.team_slug==="red-bull-racing"));
  if(!achievement)return null;
  return <div className="profile-wide"><Card title="Formula One Palmarès & Achievements">
    <dl className="profile-stat-grid">
      <Detail label="Constructors' Titles" value={achievement.constructors_championships} />
      <Detail label="Drivers' Titles" value={achievement.drivers_championships} />
      <Detail label="All-time Wins" value={achievement.race_wins} />
      <Detail label="Podiums" value={achievement.podiums} />
      <Detail label="Pole Positions" value={achievement.pole_positions} />
      <Detail label="Fastest Laps" value={achievement.fastest_laps} />
    </dl>
    {achievement.notable_achievements&&<p className="profile-muted" style={{marginTop:"0.5rem"}}>{achievement.notable_achievements}</p>}
  </Card></div>;
}

function DriverHistoricalStints({driverSlug}:{driverSlug?:string}){
  const {catalogue}=useProfiles();
  const stints=(catalogue.driverHistory??[]).filter(s=>s.driver_slug===driverSlug).sort((a,b)=>b.season-a.season);
  if(!stints.length)return null;
  return <Card title="Official F1 Career Stints & Records">
    <div className="profile-record-list">
      {stints.map((stint,idx)=>(
        <article key={\`\${stint.season}-\${stint.team_name}-\${idx}\`}>
          <div className="profile-record-heading">
            <small>{stint.season} SEASON · {stint.team_slug?<TeamLink id={stint.team_slug} name={stint.team_name}/>:stint.team_name}</small>
            {stint.titles_won>0&&<span className="profile-status confirmed">🏆 World Champion</span>}
          </div>
          <p>
            <strong>{stint.starts} starts</strong> · {stint.wins} wins · {stint.podiums} podiums · {stint.poles} poles · {stint.points} points
            {stint.championship_position!=null?(" (P" + stint.championship_position + " in WDC)"):""}
          </p>
        </article>
      ))}
    </div>
  </Card>;
}
`.replace(/\r?\n/g, '\r\n');

content += helperComponents;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated Profiles.tsx with Palmarès and Career Stints!');
