const fs=require("node:fs");
const rows=[
["Antonio Giovinazzi","1993-12-14","https://www.fia.com/sites/default/files/final_saudi_media_kit_20211130_.pdf"],
["Ayumu Iwasa","2001-09-22","https://www.fiaformula2.com/en/latest/article/in-profile-ayumu-iwasa.D8rowcdeNOlf08g3iCigW"],
["Cian Shields","2005-03-07","https://www.fiaformula2.com/en/drivers/cian-shields"],
["Colton Herta","2000-03-30","https://www.fiaformula2.com/en/drivers/colton-herta"],
["Emerson Fittipaldi","2007-03-07","https://www.fiaformula2.com/en/drivers/emerson-fittipaldi-jr"],
["Fred Vesti","2002-01-13","https://www.mercedesamgf1.com/drivers/driver/fred-vesti"],
["Jack Doohan","2003-01-20","https://www.fiaformula3.com/en/latest/article/in-profile-jack-doohan.1WXVNzAbZrVimAzxry6Xwk"],
["Jak Crawford","2005-05-02","https://www.fiaformula3.com/en/latest/article/in-profile-jak-crawford.4jQlo2Zfs9OEFFDIFD01DA"],
["Kanato Le","2007-07-04","https://www.macau.grandprix.gov.mo/uploads/media/official_programme/71mgp_programme.pdf"],
["Laurens van Hoepen","2005-09-06","https://www.fiaformula2.com/en/drivers/laurens-van-hoepen"],
["Leonardo Fornaroli","2004-12-03","https://www.fiaformula3.com/en/latest/article/in-profile-leonardo-fornaroli.41m3gVN6N8Zek7FxLF1Sp"],
["Luke Browning","2002-01-31","https://www.fiaformula3.com/en/latest/article/in-profile-luke-browning.4B2vACj6feMGdmRmU2bZW9"],
["Maciej Gładysz","2008-04-28","https://en.wikipedia.org/wiki/Maciej_G%C5%82adysz"],
["Mari Boya","2004-04-13","https://www.macau.grandprix.gov.mo/uploads/media/official_programme/72mgp_programme.pdf"],
["Michael Shin","2004-08-23","https://www.fiaformula3.com/en/drivers/michael-woohyun-shin"],
["Nandhavud Bhirombhakdi","2006-06-07","https://www.fiaformula3.com/en/drivers/nandhavud-bhirombhakdi"],
["Nicolás Varrone","2000-12-06","https://www.fiawec.com/en/driver/2025/9853"],
["Pato O'Ward","1999-05-06","https://www.indycar.com/Drivers/Pato-OWard"],
["Paul Aron","2004-02-04","https://www.alpinef1.com/drivers/paul-aron"],
["Rafael Villagómez","2001-11-10","https://www.fiaformula3.com/en/latest/article/in-profile-rafael-villagomez.04YWRGHwxAtNFomLv86Le"],
["Ryo Hirakawa","1994-03-07","https://www.fiawec.com/en/driver/2026/8166"],
["Sebastián Montoya","2005-04-11","https://premaracing.com/en/driver/58-sebastian-montoya"],
["Sébastien Buemi","1988-10-31","https://www.fiaformulae.com/en/drivers/sebastien-buemi"],
["Stoffel Vandoorne","1992-03-26","https://www.fiaformulae.com/en/drivers/stoffel-vandoorne"],
["Taito Kato","2007-11-25","https://taitokato.com/?lang=en"],
["Tasanapol Inthraphuvasak","2005-11-14","https://www.fiaformula2.com/en/drivers/tasanapol-inthraphuvasak"],
["Théo Pourchaire","2003-08-20","https://www.theopourchaire.com/presentation/"],
["Victor Martins","2001-06-16","https://www.fiaformula3.com/en/latest/article/in-profile-victor-martins.3DdOn8Mdins8valJKuNE1p"],
["Yuki Tsunoda","2000-05-11","https://global.honda/en/F1/driver/YukiTsunoda/"],
["Zane Maloney","2003-10-02","https://www.fiaformulae.com/en/drivers/zane-maloney?tab=bio"],
["Zhou Guanyu","1999-05-30","https://www.zhou-guanyu.com/en/news/detail/283"]
];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const values=rows.map(row=>`(${row.map(quote).join(",")})`).join(",\n");
const update=(table,field)=>`update public.${table} d set date_of_birth=v.dob::date from (values\n${values}\n) v(name,dob,source_url) where d.${field}=v.name and d.date_of_birth is null;\n`;
fs.writeFileSync("supabase/migrations/20261026042000_remaining_verified_birth_dates.sql","-- Sources are provided alongside each date.\nbegin;\n"+update("drivers",'"driver-name"')+update("people","display_name")+"commit;\n");
