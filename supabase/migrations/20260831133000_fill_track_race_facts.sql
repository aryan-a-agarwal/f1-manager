-- User-supplied official-source research, imported only into previously empty
-- fact fields. Existing sourced values are preserved for conflict review.
alter table public.track_facts add column if not exists f1_facts_source_url text;

update public.track_facts as t set
  city=coalesce(t.city,v.city),
  lap_length_km=coalesce(t.lap_length_km,v.lap_length),
  race_laps=coalesce(t.race_laps,v.race_laps),
  race_distance_km=coalesce(t.race_distance_km,v.race_distance),
  first_f1_grand_prix_year=coalesce(t.first_f1_grand_prix_year,v.first_year),
  f1_facts_source_url=v.source_url,
  verified_on='2026-08-31'
from (values
('albert-park','Melbourne',5.278::numeric,58,306.124::numeric,1996,'https://www.formula1.com/en/racing/2026/Australia/Circuit.html'),
('shanghai','Shanghai',5.451,56,305.066,2004,'https://www.formula1.com/en/racing/2026/China/Circuit.html'),
('suzuka','Suzuka',5.807,53,307.471,1987,'https://www.formula1.com/en/racing/2026/Japan/Circuit.html'),
('bahrain','Sakhir',5.412,57,308.238,2004,'https://www.formula1.com/en/racing/2026/Bahrain/Circuit.html'),
('jeddah','Jeddah',6.174,50,308.450,2021,'https://www.formula1.com/en/racing/2026/Saudi_Arabia/Circuit.html'),
('miami','Miami Gardens',5.412,57,308.326,2022,'https://www.formula1.com/en/racing/2026/Miami/Circuit.html'),
('montreal','Montreal',4.361,70,305.270,1978,'https://www.formula1.com/en/racing/2026/Canada/Circuit.html'),
('monaco','Monte Carlo',3.337,78,260.286,1950,'https://www.formula1.com/en/racing/2026/Monaco/Circuit.html'),
('barcelona-catalunya','Montmelo',4.657,66,307.236,1991,'https://www.formula1.com/en/racing/2026/Spain/Circuit.html'),
('spielberg','Spielberg',4.318,71,306.452,1970,'https://www.formula1.com/en/racing/2026/Austria/Circuit.html'),
('silverstone','Silverstone',5.891,52,306.198,1950,'https://www.formula1.com/en/racing/2026/Great_Britain/Circuit.html'),
('spa-francorchamps','Stavelot',7.004,44,308.052,1950,'https://www.formula1.com/en/racing/2026/Belgium/Circuit.html'),
('hungaroring','Mogyorod',4.381,70,306.630,1986,'https://www.formula1.com/en/racing/2026/Hungary/Circuit.html'),
('zandvoort','Zandvoort',4.259,72,306.587,1952,'https://www.formula1.com/en/racing/2026/Netherlands/Circuit.html'),
('monza','Monza',5.793,53,306.720,1950,'https://www.formula1.com/en/racing/2026/Italy/Circuit.html'),
('madrid-ifema','Madrid',5.474,null,null,null,'https://www.formula1.com/en/latest/article/all-the-key-highlights-from-the-2026-f1-calendar.E5wcfIMV1oTFuEUg74H7J'),
('baku','Baku',6.003,51,306.049,2016,'https://www.formula1.com/en/racing/2026/Azerbaijan/Circuit.html'),
('marina-bay','Singapore',4.940,62,306.143,2008,'https://www.formula1.com/en/racing/2026/Singapore/Circuit.html'),
('circuit-of-the-americas','Austin',5.513,56,308.405,2012,'https://www.formula1.com/en/racing/2026/United_States/Circuit.html'),
('hermanos-rodriguez','Mexico City',4.304,71,305.354,1963,'https://www.formula1.com/en/racing/2026/Mexico/Circuit.html'),
('interlagos','Sao Paulo',4.309,71,305.879,1973,'https://www.formula1.com/en/racing/2026/Brazil/Circuit.html'),
('las-vegas','Las Vegas',6.201,50,310.050,2023,'https://www.formula1.com/en/racing/2026/Las_Vegas/Circuit.html'),
('lusail','Lusail',5.419,57,308.611,2021,'https://www.formula1.com/en/racing/2026/Qatar/Circuit.html'),
('yas-marina','Abu Dhabi',5.281,58,306.183,2009,'https://www.formula1.com/en/racing/2026/United_Arab_Emirates/Circuit.html'),
('istanbul-park','Istanbul',5.338,58,309.396,2005,'https://www.formula1.com/en/results.html'),
('sepang','Sepang',5.543,56,310.408,1999,'https://www.sepangcircuit.com'),
('algarve','Portimao',4.653,66,306.822,2020,'https://autodromodoalgarve.com'),
('buriram','Buriram',4.554,null,null,null,'https://www.bric.co.th'),
('dubai-autodrome','Dubai',5.390,null,null,null,'https://dubaiautodrome.ae'),
('estoril','Estoril',4.182,70,305.200,1984,'https://circuito-estoril.pt'),
('fuji','Oyama',4.563,67,305.721,1976,'https://www.fsw.tv'),
('hockenheim','Hockenheim',4.574,67,306.458,1970,'https://www.hockenheimring.de'),
('igora-drive','Novozhilovo',5.183,null,null,null,'https://drive-igora.ru'),
('imola','Imola',4.909,63,309.047,1980,'https://www.autodromoimola.it'),
-- The submitted 1950 value refers to the Indianapolis 500/oval, not this GP circuit.
('indianapolis-grand-prix','Indianapolis',4.192,73,306.016,null,'https://www.indianapolismotorspeedway.com'),
('korea','Yeongam',5.615,55,308.630,2010,'https://www.koreacircuit.kr'),
('magny-cours','Magny-Cours',4.411,70,308.586,1991,'https://www.circuitmagnycours.com'),
('motorland-aragon','Alcaniz',5.346,null,null,null,'https://www.motorlandaragon.com'),
('mugello','Scarperia e San Piero',5.245,59,309.455,2020,'https://mugellocircuit.com'),
-- The submitted 1951 value refers to the Nordschleife, not this GP circuit.
('nurburgring-grand-prix','Nurburg',5.148,60,308.617,null,'https://nuerburgring.de'),
('paul-ricard','Le Castellet',5.842,53,309.690,1971,'https://www.circuitpaulricard.com')
) v(slug,city,lap_length,race_laps,race_distance,first_year,source_url)
where t.slug=v.slug;

do $$
begin
  if (select count(*) from public.track_facts where race_laps is not null) <> 36 then
    raise exception 'Track race-fact validation failed: expected 36 venues with documented F1 race data';
  end if;
  if (select count(*) from public.track_facts where city is null) <> 0 then
    raise exception 'Track race-fact validation failed: expected all cities filled';
  end if;
end $$;
