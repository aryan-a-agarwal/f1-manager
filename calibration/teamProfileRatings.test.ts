import assert from "node:assert/strict";
import fs from "node:fs";
import {isTeamRatingField,matchingTeamRecord,teamAttributeDisplay,teamRatingGroups} from "../lib/teamProfileData";

const schema=fs.readFileSync("supabase/migrations/20260831001000_expand_teams_schema.sql","utf8");
const ratings=[...schema.matchAll(/add column if not exists (\w+) integer not null default (\d+)/g)].map(match=>({key:match[1],value:Number(match[2])})).filter(field=>isTeamRatingField(field.key));
assert.ok(ratings.length>100);
const row=Object.fromEntries(ratings.map(field=>[field.key,field.value]));
for(const {key} of ratings)for(const value of [0,50,70,100,null])assert.equal(teamAttributeDisplay(key,value),"Unrated");
const groups=teamRatingGroups(row),fields=groups.flatMap(group=>group.fields);
assert.equal(fields.length,ratings.length);assert.equal(new Set(fields.map(field=>field.key)).size,ratings.length);
assert.ok(fields.every(field=>field.text==="Unrated"));
for(const key of ["all_time_wins","constructor_points","constructors_championships","first_f1_entry_year","annual_budget_usd_millions"]){assert.equal(isTeamRatingField(key),false);assert.equal(teamAttributeDisplay(key,0),"0");}
const teams=[{id:1,slug:"mclaren",short_name:"McLaren"},{id:4,slug:"red-bull-racing",short_name:"Red Bull Racing"}];
assert.equal(matchingTeamRecord(teams,"red-bull")?.id,4);
assert.equal(matchingTeamRecord(teams,"aston-martin","Aston Martin"),undefined,"Never borrow another team's ratings by numeric ID");
console.log(`Team profile rating checks passed: ${ratings.length} unallocated attributes, complete grouping, identity matching and preserved statistics.`);
