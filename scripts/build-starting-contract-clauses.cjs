// Game-design assumptions, not a reconstruction of private real-world agreements.
const fs = require('node:fs');
const seed = require('../supabase/seed-data/2027-starting-grid.json');
const version = '2027-contract-clauses-v1';
const elite = new Set(['norris','piastri','russell','verstappen','leclerc','hamilton','alonso']);
const prospects = new Set(['antonelli','hadjar','lawson','lindblad','camara','bearman','bortoleto','colapinto']);
const experiencedReserves = new Set(['yuki-tsunoda','sebastien-buemi','antonio-giovinazzi','stoffel-vandoorne','jack-doohan','ryo-hirakawa','zhou-guanyu']);
const outside = new Set(['pato-oward','sebastien-buemi','antonio-giovinazzi','ryo-hirakawa','colton-herta','leonardo-fornaroli']);
const packages = seed.contracts.map(r => {
  const reserve = r.role === 'reserve_driver';
  const category = reserve ? (experiencedReserves.has(r.person_slug) ? 'Experienced reserve' : 'Development reserve') : elite.has(r.driver_id) ? 'Established race driver' : prospects.has(r.driver_id) ? 'Developing race driver' : 'Team-building race driver';
  const clauses = [];
  function add(kind,title,terms,parameters={}) { clauses.push({kind,title,terms,parameters,basis:'game_assumption',execution:'recorded_only'}); }
  const salary = r.annual_salary_usd_cents;
  const amount = fraction => Math.round(salary*fraction/100)*100;
  const usd = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents/100);
  add('role_commitment',reserve?'Reserve appointment':'Race-seat commitment',reserve?'Reserve duties only; no automatic race-seat promotion. Substitution requires availability and sporting eligibility.':'Race seat for the recorded contract term, subject to fitness, eligibility and agreed termination.',{role:r.role});
  if (!reserve) {
    const win=amount(.03),podium=amount(.01),points=amount(.002),cap=amount(.25);
    add('race_bonus','Grand Prix result bonuses',`${usd(win)} per win; ${usd(podium)} for second or third; ${usd(points)} for any other points finish. Only the highest tier pays per Grand Prix; sprints excluded. Annual cap ${usd(cap)}. Final classified results after penalties apply.`,{winCents:win,podiumCents:podium,pointsFinishCents:points,annualCapCents:cap,stacking:'highest_only',sprints:false});
    const target = elite.has(r.driver_id)?3:prospects.has(r.driver_id)?12:10;
    const bonus=amount(elite.has(r.driver_id)?.15:.1);
    add('championship_bonus','Championship position bonus',`${usd(bonus)} once per season for finishing ${target===3?"3rd":`${target}th`} or better in the final drivers’ standings. Separate from the race bonus cap.`,{maximumPosition:target,amountCents:bonus});
    add('equipment_parity','Equal equipment access','Equal specification when two serviceable sets are available. Manufacturing shortages or accident damage allow a maximum two-Grand-Prix delay; no promise of lead-driver status.',{maximumDelayGrandsPrix:2});
    if(prospects.has(r.driver_id)) {
      add('development_support','Development programme','At least 12 scheduled simulator/coaching days per season, agreed around race duties and medical availability.',{daysPerSeason:12});
      if(r.end_season>2027)add('salary_escalator','Annual salary progression','Base salary increases by 10% each 1 January from 2028, compounded within the existing term. This does not extend the contract.',{annualPercent:10,firstSeason:2028});
    } else {
      add('commercial_duties','Commercial appearance limit','Up to eight scheduled sponsor days per season, with at least 14 days’ notice and no clash with race duties.',{daysPerSeason:8,noticeDays:14});
    }
  } else {
    const fee=amount(.05);
    add('substitution_fee','Race substitution fee',`${usd(fee)} per Grand Prix started as a substitute, additional to the reserve retainer. Practice sessions and sprints do not trigger this fee.`,{perGrandPrixStartCents:fee});
    add('simulator_duties','Simulator programme',`${experiencedReserves.has(r.person_slug)?16:20} scheduled simulator days per season, subject to agreed event availability.`,{daysPerSeason:experiencedReserves.has(r.person_slug)?16:20});
    if(!experiencedReserves.has(r.person_slug))add('practice_opportunity','Practice opportunities','Two practice appearances per season, conditional on licence eligibility, sporting rules and a serviceable car; an unavailable appearance must be rescheduled within the season.',{sessionsPerSeason:2});
    add('outside_racing','Outside racing permission',outside.has(r.person_slug)?'Outside racing is permitted under an agreed calendar. Conflicts must be declared before the season; this appointment does not guarantee simultaneous availability.':'Outside racing requires advance team agreement and must not conflict with confirmed reserve call-up dates.',{priorCalendarAgreement:true});
    if(r.person_slug==='yuki-tsunoda')add('shared_reserve','Shared reserve priority','Shared Red Bull / Racing Bulls appointment: Red Bull has priority if both require a substitute at the same event. Racing Bulls must use its other available reserve.',{priorityTeamId:'red-bull',secondaryTeamId:'racing-bulls'});
    add('promotion_review','Race-seat consideration','A review of race-seat suitability by 30 September each season. This is consideration only, not a guaranteed promotion.',{reviewMonth:9,reviewDay:30,guaranteedPromotion:false});
  }
  const loyalty=amount(reserve?.1:r.end_season>2027?.1:.05);
  add('loyalty_bonus','Season-completion payment',`${usd(loyalty)} after each completed contracted season on 31 December. Voluntary early departure forfeits that season’s payment; team-initiated termination without driver breach does not.`,{annualCents:loyalty,paymentMonth:12,paymentDay:31});
  add('termination_protection','Guaranteed-pay protection','Team-initiated termination without driver breach requires payment of the remaining scheduled base salary. Untriggered performance bonuses are excluded.',{remainingBaseSalaryPercent:100});
  add('confidentiality','Technical confidentiality','Technical and strategic information remains confidential during the appointment and for 24 months after departure. This does not prohibit joining another team.',{monthsAfterDeparture:24});
  return {personSlug:r.person_slug,teamId:r.team_id,role:r.role,startSeason:r.start_season,endSeason:r.end_season,version,category,rationale:`${r.driver_name}: ${category.toLowerCase()} package for the existing ${r.start_season}–${r.end_season} ${r.team_id} appointment. Values are design assumptions scaled to its recorded salary, not inferred personality ratings or verified private terms.`,clauses};
});
const output={version,datasetId:seed.dataset_id,packages};
fs.writeFileSync('supabase/seed-data/2027-contract-clauses.json',JSON.stringify(output,null,2)+'\n');
const payload=JSON.stringify(packages).replaceAll("'","''");
fs.writeFileSync('supabase/migrations/20261027010000_starting_contract_clauses.sql',`-- Assumed game terms only. No salaries, durations, public facts or career saves are rewritten.\nbegin;\nalter table public.f1_starting_driver_contracts add column if not exists clause_package jsonb;\nupdate public.f1_starting_driver_contracts c set clause_package=p.value\nfrom jsonb_array_elements('${payload}'::jsonb) p(value), public.people person, public.f1_team_facts team\nwhere c.dataset_id='${seed.dataset_id}' and c.person_id=person.id and person.slug=p.value->>'personSlug'\nand c.team_id=team.id and team.slug=(case p.value->>'teamId' when 'red-bull' then 'red-bull-racing' else p.value->>'teamId' end)\nand c.role=p.value->>'role' and c.clause_package is null;\ndo $$ begin\n if (select count(*) from public.f1_starting_driver_contracts where dataset_id='${seed.dataset_id}' and clause_package->>'version'='${version}')<>44 then\n raise exception 'Expected 44 starting contract clause packages; rollback to inspect identity mappings';\n end if;\nend $$;\ncommit;\n`);
console.log(`Generated ${packages.length} packages / ${packages.reduce((n,p)=>n+p.clauses.length,0)} clauses.`);
