const fs=require("node:fs");
const rows=[
["Freddie Slater","2008-08-09","freddie-slater"],["Matteo De Palo","2007-11-08","matteo-de-palo"],
["Mattia Colnaghi","2008-07-26","mattia-colnaghi"],["Tuukka Taponen","2006-10-26","tuukka-taponen"],
["Alessandro Giusti","2006-09-10","alessandro-giusti"],["Hiyu Yamakoshi","2006-10-13","hiyu-yamakoshi"],
["Enzo Deligny","2008-04-17","enzo-deligny"],["Bruno del Pino","2006-06-20","bruno-del-pino"],
["Pedro Clerot","2007-01-22","pedro-clerot"],["Brando Badoer","2006-09-15","brando-badoer"],
["Christian Ho","2006-10-31","christian-ho"],["Louis Sharp","2007-05-11","louis-sharp"],
["James Wharton","2006-07-08","james-wharton"],["Jose Garfias","2004-10-26","jose-garfias"],
["Fionn McLaughlin","2007-10-29","fionn-mclaughlin"],["Jin Nakamura","2006-02-01","jin-nakamura"],
["Brad Benavides","2001-07-20","brad-benavides"],["Yevan David","2007-07-11","yevan-david"],
["Fernando Barrichello","2005-09-12","fernando-barrichello"],["Nicola Lacorte","2007-06-01","nicola-lacorte"],
["Gerrard Xie","2006-09-24","gerrard-xie"],["Ernesto Rivera","2008-12-01","ernesto-rivera"],
["Noah Stromsted","2007-07-29","noah-stromsted"]
];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const values=rows.map(([name,date,slug])=>`(${quote(name)},${quote(date)},${quote("https://www.fiaformula3.com/en/drivers/"+slug)})`).join(",\n");
const table=(name,field)=>`update public.${name} d set date_of_birth=v.dob::date from (values\n${values}\n) v(name,dob,source_url) where d.${field}=v.name and d.date_of_birth is null;\n`;
fs.writeFileSync("supabase/migrations/20261026041000_verified_f3_birth_dates.sql","-- Source: individual FIA Formula 3 driver profiles.\nbegin;\n"+table("drivers",'"driver-name"')+table("people","display_name")+"commit;\n");
