const fs=require('node:fs'),assert=require('node:assert/strict');
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const seed=JSON.parse(fs.readFileSync('supabase/seed-data/2027-starting-grid.json','utf8'));
async function read(table){const response=await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=*`,{headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`}});if(!response.ok)throw new Error(`${table}: HTTP ${response.status}`);return response.json();}
(async()=>{
 const [rows,allSlots]=await Promise.all([read('f1_starting_grid_2027'),read('f1_starting_team_slots')]);
 const slots=allSlots.filter(s=>s.dataset_id===seed.dataset_id);
 assert.equal(rows.length,44);assert.equal(slots.length,44);
 for(const expected of seed.contracts){const row=rows.find(r=>r.person_slug===expected.person_slug&&r.team_slug===expected.team_slug&&r.role===expected.role);assert.ok(row);for(const key of ['role','slot_number','seat_basis','reference_status','start_season','end_season','term_basis','annual_salary_usd_cents','salary_basis','source_url'])assert.equal(String(row[key]),String(expected[key]),`${expected.person_slug}: ${key}`);}
 const summary={dataset:seed.dataset_id,verified_at:new Date().toISOString(),public_read:true,race_seats:rows.filter(r=>r.role==='race_driver').length,confirmed_race_seats:rows.filter(r=>r.role==='race_driver'&&r.seat_basis==='confirmed').length,assumed_race_seats:rows.filter(r=>r.role==='race_driver'&&r.seat_basis==='game_assumption').map(r=>r.person_slug),reserve_agreements:rows.filter(r=>r.role==='reserve_driver').length,salaried_agreements:rows.filter(r=>r.annual_salary_usd_cents>0).length,total_slots:slots.length,seed_matches_live:true};
 fs.writeFileSync('docs/RESERVE_ROSTER_2027_VERIFICATION.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
