-- Expand the fixed circuit registry using the FIA Grade 1 licence list.
-- Grade 1 means objectively licensed/listed by the FIA; it does not claim that
-- a venue has or will receive a Formula 1 calendar slot.
alter table public.track_facts add column if not exists fia_grade text;
alter table public.track_facts add column if not exists fia_licence_expiry date;
alter table public.track_facts add column if not exists fia_source_key text references public.data_sources(source_key);

insert into public.data_sources (source_key,publisher,title,url,retrieved_on) values
('fia-licensed-circuits-2025-07','FIA','List of FIA Licensed Circuits updated 2025-07-07','https://www.fia.com/sites/default/files/circuits_fia20250707.pdf','2026-08-31')
on conflict (source_key) do update set publisher=excluded.publisher,title=excluded.title,url=excluded.url,retrieved_on=excluded.retrieved_on;

-- The originally announced 24-round 2026 calendar included Bahrain and Jeddah.
-- Sepang remains in the registry as an FIA-listed Grade 1 venue, but is not one
-- of those 24 originally announced venues.
update public.track_facts set official_2026_calendar=false where slug='sepang';

update public.track_facts as t set
  lap_length_km=v.lap_length, fia_grade='1', fia_licence_expiry=v.expiry,
  fia_source_key='fia-licensed-circuits-2025-07'
from (values
  ('yas-marina',5.281::numeric,'2027-12-03'::date),('albert-park',5.278,'2028-03-24'),
  ('hermanos-rodriguez',4.304,'2025-12-15'),('baku',6.003,'2026-04-27'),
  ('barcelona-catalunya',4.657,'2028-02-18'),('circuit-of-the-americas',5.513,'2025-12-31'),
  ('hungaroring',4.381,'2027-06-12'),('las-vegas',6.200,'2026-11-16'),
  ('miami',5.412,'2028-05-04'),('monaco',3.340,'2026-05-20'),('monza',5.793,'2027-09-29'),
  ('lusail',5.418,'2026-10-04'),('spielberg',4.326,'2026-07-02'),('sepang',5.543,'2026-03-15'),
  ('shanghai',5.451,'2026-03-21'),('silverstone',5.901,'2028-07-05'),
  ('marina-bay',5.077,'2025-09-29'),('spa-francorchamps',7.004,'2026-07-15'),
  ('suzuka',5.807,'2026-03-07'),('zandvoort',4.259,'2026-08-31')
) v(slug,lap_length,expiry) where t.slug=v.slug;

insert into public.track_facts
  (slug,circuit_name,display_name,city,country,circuit_type,lap_length_km,official_2026_calendar,confirmed_future_event,fia_grade,fia_licence_expiry,source_key,verified_on)
values
('bahrain','Bahrain International Circuit','Bahrain International Circuit','Sakhir','Bahrain','permanent',5.412,true,false,'1','2028-04-18','fia-licensed-circuits-2025-07','2026-08-31'),
('jeddah','Jeddah Corniche Circuit','Jeddah Corniche Circuit','Jeddah','Saudi Arabia','street',6.176,true,false,'1','2028-03-29','fia-licensed-circuits-2025-07','2026-08-31'),
('algarve','Algarve International Circuit','Algarve International Circuit',null,'Portugal','permanent',4.684,false,false,'1','2026-01-31','fia-licensed-circuits-2025-07','2026-08-31'),
('buriram','Chang International Circuit','Buriram',null,'Thailand','permanent',4.554,false,false,'1','2026-07-07','fia-licensed-circuits-2025-07','2026-08-31'),
('dubai-autodrome','Dubai Autodrome Grand Prix Circuit','Dubai Grand Prix Circuit',null,'United Arab Emirates','permanent',5.390,false,false,'1','2025-11-09','fia-licensed-circuits-2025-07','2026-08-31'),
('estoril','Circuito do Estoril','Estoril',null,'Portugal','permanent',4.182,false,false,'1','2026-01-31','fia-licensed-circuits-2025-07','2026-08-31'),
('fuji','Fuji Speedway','Fuji Speedway',null,'Japan','permanent',4.563,false,false,'1','2026-04-11','fia-licensed-circuits-2025-07','2026-08-31'),
('hockenheim','Hockenheimring Grand Prix Circuit','Hockenheim',null,'Germany','permanent',4.574,false,false,'1','2028-04-03','fia-licensed-circuits-2025-07','2026-08-31'),
('igora-drive','Igora Drive','Igora Drive',null,'Russia','permanent',5.183,false,false,'1','2026-11-09','fia-licensed-circuits-2025-07','2026-08-31'),
('imola','Autodromo Internazionale Enzo e Dino Ferrari','Imola',null,'Italy','permanent',4.909,false,false,'1','2027-03-15','fia-licensed-circuits-2025-07','2026-08-31'),
('indianapolis-grand-prix','Indianapolis Motor Speedway Grand Prix Circuit','Indianapolis Grand Prix',null,'United States','permanent',4.192,false,false,'1','2028-05-10','fia-licensed-circuits-2025-07','2026-08-31'),
('korea','Korea International Circuit','Korea International Circuit',null,'South Korea','permanent',5.615,false,false,'1','2026-01-01','fia-licensed-circuits-2025-07','2026-08-31'),
('magny-cours','Circuit de Nevers Magny-Cours','Magny-Cours',null,'France','permanent',4.411,false,false,'1','2028-05-15','fia-licensed-circuits-2025-07','2026-08-31'),
('motorland-aragon','MotorLand Aragon','MotorLand Aragon',null,'Spain','permanent',5.346,false,false,'1','2028-02-14','fia-licensed-circuits-2025-07','2026-08-31'),
('mugello','Mugello Circuit','Mugello',null,'Italy','permanent',5.245,false,false,'1','2028-05-08','fia-licensed-circuits-2025-07','2026-08-31'),
('nurburgring-grand-prix','Nurburgring Grand Prix Circuit','Nurburgring Grand Prix',null,'Germany','permanent',5.148,false,false,'1','2028-07-04','fia-licensed-circuits-2025-07','2026-08-31'),
('paul-ricard','Circuit Paul Ricard','Paul Ricard',null,'France','permanent',5.822,false,false,'1','2027-07-26','fia-licensed-circuits-2025-07','2026-08-31')
on conflict (slug) do update set
  circuit_name=excluded.circuit_name,display_name=excluded.display_name,city=excluded.city,country=excluded.country,
  circuit_type=excluded.circuit_type,lap_length_km=excluded.lap_length_km,official_2026_calendar=excluded.official_2026_calendar,
  confirmed_future_event=excluded.confirmed_future_event,fia_grade=excluded.fia_grade,fia_licence_expiry=excluded.fia_licence_expiry,
  source_key=excluded.source_key,verified_on=excluded.verified_on;

update public.track_facts set fia_source_key='fia-licensed-circuits-2025-07' where fia_grade='1';

do $$
begin
  if (select count(*) from public.track_facts where official_2026_calendar) <> 24 then
    raise exception 'Track validation failed: expected 24 originally announced 2026 venues';
  end if;
  if (select count(*) from public.track_facts) <> 41 then
    raise exception 'Track validation failed: expected 41 distinct circuit venues';
  end if;
end $$;
