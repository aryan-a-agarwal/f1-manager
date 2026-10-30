export type ProfileTarget={kind:"driver"|"team"|"staff"|"negotiation";id:string};
export type NavigationTrail={entries:string[];cursor:number};
export function profileFromSearch(search:string):ProfileTarget|null {
  const params=new URLSearchParams(search),kind=params.get("profile"),id=params.get("profileId");
  return (kind==="driver"||kind==="team"||kind==="staff"||kind==="negotiation")&&id?{kind,id}:null;
}
export function profileUrl(current:string,target:ProfileTarget){
  const url=new URL(current,"http://game.local");
  url.searchParams.set("profile",target.kind);url.searchParams.set("profileId",target.id);
  return url.pathname+url.search;
}
export function pushTrail(trail:NavigationTrail,url:string):NavigationTrail {
  if(trail.entries[trail.cursor]===url)return trail;
  return {entries:[...trail.entries.slice(0,trail.cursor+1),url],cursor:trail.cursor+1};
}
export function normalizedName(value:string){return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
