"""Generate reviewable 2027 team assumptions; never modify live reference facts."""
import json,re,hashlib
from pathlib import Path
schema=Path('supabase/migrations/20260831001000_expand_teams_schema.sql').read_text(encoding='utf-8')
fields=[m.group(1) for m in re.finditer(r'add column if not exists (\w+) integer not null default \d+',schema)]
ratings=[f for f in fields if f.endswith('_rating') or f.startswith('ai_') or f in ('staff_morale','driver_morale','board_confidence','financial_risk_tolerance')]
levels=[f for f in fields if f.endswith('_level')]
conditions=[f for f in fields if f.endswith('_condition')]
# Order: current sporting strength, heritage, infrastructure, commercial power, ambition, youth preference, loyalty, risk.
profiles={
 'mercedes':[93,91,94,91,96,83,78,57], 'ferrari':[91,99,92,99,99,67,75,62],
 'red-bull-racing':[90,93,91,94,97,91,68,79], 'mclaren':[89,96,91,94,96,88,82,62],
 'racing-bulls':[77,68,72,72,74,96,67,76], 'alpine':[75,78,82,78,83,86,63,69],
 'haas':[72,60,64,69,72,77,70,59], 'audi':[71,72,83,84,86,88,67,62],
 'williams':[70,89,76,81,80,86,76,63], 'aston-martin':[69,79,90,86,89,69,73,66],
 'cadillac':[64,53,73,79,77,80,67,65],
}
contracts=json.loads(Path('supabase/seed-data/2027-starting-grid.json').read_text(encoding='utf8'))['contracts']
finance_fields=re.findall(r'add column if not exists (\w+_usd_millions) numeric\(12, 2\)',schema)
def group(k):
 if k.startswith('ai_'):
  if 'youth' in k:return 'youth'
  if 'loyalty' in k:return 'loyalty'
  if 'risk' in k or 'aggression' in k:return 'risk'
  if 'star' in k or 'planning' in k:return 'ambition'
  if 'facility' in k or 'research' in k:return 'infra'
  if 'sponsor' in k:return 'commercial'
  return 'sport'
 if any(x in k for x in ['heritage','prestige','reputation','fanbase','popularity','media_interest','employer_attractiveness']):return 'heritage'
 if any(x in k for x in ['facility','research','manufactur','design_capacity','development_','prototype','correlation','intellectual','quality','upgrade','knowledge','technical_data','regulation_research']):return 'infra'
 if any(x in k for x in ['commercial','sponsor','merchandise','hospitality','digital','media_management','crisis_management','financial','cost_efficiency','sustainability']):return 'commercial'
 if any(x in k for x in ['championship_expectation','board_confidence','board_patience','job_security','leadership','team_cohesion','communication','retention','workplace','political','morale']):return 'ambition'
 return 'sport'
def variation(team,field):return int.from_bytes(hashlib.sha256((team+':'+field).encode()).digest()[:2],'big')%7-3
def clamp(n,a,b):return max(a,min(b,round(n)))
def row(team,idx,v):
 sport,heritage,infra,commercial,ambition,youth,loyalty,risk=v
 dimensions=dict(sport=sport,heritage=heritage,infra=infra,commercial=commercial,ambition=ambition,youth=youth,loyalty=loyalty,risk=risk)
 data={}
 for field in ratings:
  base=dimensions[group(field)]
  if field in ('grid_penalty_risk_rating','internal_pressure_rating','blame_culture_rating'):
   base={'grid_penalty_risk_rating':12,'internal_pressure_rating':55+(ambition-75)*.7,'blame_culture_rating':35}[field]
  elif 'compliance_rating' in field:base=91
  elif field in ('staff_morale','driver_morale','board_confidence','sponsor_satisfaction_rating','job_security_rating'):base=72+(sport-75)*.25
  elif field in ('recent_form_rating','momentum_rating','season_progress_rating'):base=50
  data[field]=clamp(base+variation(team,field),1,99)
 facility={f:clamp((infra-50)/10+variation(team,f)*.2,1,5) for f in levels}
 facility.update({f:clamp(85+variation(team,f),1,100) for f in conditions})
 budget=round(170+(commercial-65)*3.1); finances={k:0 for k in finance_fields}
 driver_cost=round(sum(c['annual_salary_usd_cents'] for c in contracts if c['team_slug']==team)/100_000_000,2)
 finances.update(annual_budget_usd_millions=budget,cash_balance_usd_millions=round(budget*.20),budget_cap_limit_usd_millions=250,cost_cap_headroom_usd_millions=250,owner_funding_usd_millions=round(budget*.2),sponsorship_income_usd_millions=round(budget*.35),prize_money_usd_millions=round(budget*.27),merchandise_income_usd_millions=round(budget*.04),hospitality_income_usd_millions=round(budget*.02),licensing_income_usd_millions=round(budget*.01),staff_cost_usd_millions=round(budget*.27),driver_cost_usd_millions=driver_cost,facility_upkeep_usd_millions=round(budget*.05),manufacturing_cost_usd_millions=round(budget*.16),research_cost_usd_millions=round(budget*.16),travel_cost_usd_millions=round(budget*.07),projected_season_spend_usd_millions=round(budget*.71+driver_cost,2),target_budget_balance_usd_millions=0)
 return {'team_slug':team,'season':2027,'dataset_version':'f1-team-baseline-2027-v1','basis':'game_assumption','rating_scale':'0-100','dimensions':dimensions,'ratings':data,'facilities':facility,'financial_assumptions_usd_millions':finances,'objectives':{'target_constructor_position':idx+1,'minimum_constructor_position':min(11,idx+3),'championship_contender':idx<4,'rebuilding_team':idx>=5},'method':'Initial game balance based on 2026 team order and broad team characteristics; not private team data or actual 2027 results.'}
output={'dataset_version':'f1-team-baseline-2027-v1','season':2027,'basis':'game_assumption','reference_as_of':'2026-10-27','reference_url':'https://www.formula1.com/en/results/2026/team','rating_fields':ratings,'teams':[row(team,i,v) for i,(team,v) in enumerate(profiles.items())]}
Path('supabase/seed-data/2027-team-baselines.json').write_text(json.dumps(output,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(f'{len(output["teams"])} teams; {len(ratings)} ratings; {len(levels)} facility levels; {len(conditions)} conditions; {len(finance_fields)} finance fields')
