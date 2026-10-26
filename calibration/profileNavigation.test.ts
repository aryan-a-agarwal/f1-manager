import assert from "node:assert/strict";
import test from "node:test";
import {normalizedName,profileFromSearch,profileUrl,pushTrail} from "../lib/profileNavigation";

test("profile links retain their source page and round-trip reference and entry identities",()=>{
  for(const target of [{kind:"driver" as const,id:"person:33"},{kind:"team" as const,id:"entry:ART Grand Prix"},{kind:"driver" as const,id:"hulkenberg"}]){
    const url=profileUrl("/game?section=championship&view=drivers",target);
    const parsed=new URL(url,"http://game.local");
    assert.equal(parsed.searchParams.get("section"),"championship");
    assert.equal(parsed.searchParams.get("view"),"drivers");
    assert.deepEqual(profileFromSearch(parsed.search),target);
  }
  assert.deepEqual(profileFromSearch("?profile=staff&profileId=person%3A1"),{kind:"staff",id:"person:1"});
  assert.equal(profileFromSearch("?profile=driver"),null);
});
test("history preserves forward pages and drops them only when opening a different page",()=>{
  const start={entries:["/game?section=championship&view=teams"],cursor:0};
  const team=pushTrail(start,"/game?profile=team&profileId=mclaren");
  const driver=pushTrail(team,"/game?profile=driver&profileId=norris");
  const back={...driver,cursor:1};
  assert.equal(back.entries[back.cursor+1],driver.entries[2]);
  const branch=pushTrail(back,"/game?profile=driver&profileId=piastri");
  assert.equal(branch.entries.length,3);
  assert.equal(branch.entries.includes(driver.entries[2]),false);
  assert.equal(pushTrail(branch,branch.entries[2]),branch);
});
test("reference names can be compared without accents or punctuation changing identity",()=>{
  assert.equal(normalizedName("Nico Hülkenberg"),normalizedName("Nico Hulkenberg"));
  assert.equal(normalizedName("Pato O’Ward"),normalizedName("Pato O'Ward"));
  assert.notEqual(normalizedName("Lando Norris"),normalizedName("Oscar Piastri"));
});
