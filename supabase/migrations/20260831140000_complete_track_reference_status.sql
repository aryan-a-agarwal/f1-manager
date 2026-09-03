-- Close remaining ambiguity: distinguish verified future contracts and venues
-- that have never hosted F1 from facts that are simply unavailable.
alter table public.track_facts add column if not exists future_confirmed_through_year integer;
alter table public.track_facts add column if not exists future_event_source_url text;
alter table public.track_facts add column if not exists f1_history_status text
  check (f1_history_status in ('hosted_f1_world_championship','never_hosted_f1_world_championship'));
alter table public.track_facts add column if not exists fia_status_note text;

update public.track_facts set f1_history_status=case
  when slug in ('madrid-ifema','buriram','dubai-autodrome','igora-drive','motorland-aragon')
    then 'never_hosted_f1_world_championship'
  else 'hosted_f1_world_championship'
end;

update public.track_facts set first_f1_grand_prix_year=2000 where slug='indianapolis-grand-prix';
update public.track_facts set first_f1_grand_prix_year=1984 where slug='nurburgring-grand-prix';

update public.track_facts as t set
  confirmed_future_event=true,
  future_confirmed_through_year=v.through_year,
  future_event_source_url=v.source_url
from (values
('albert-park',2035,'https://corp.formula1.com/formula-1-to-race-in-melbourne-until-2035-under-new-agreement/'),
('shanghai',2030,'https://www.formula1.com/en/latest/article/formula-1-to-race-in-shanghai-until-2030-with-new-five-year-extension.773NjupGSMZ1sBQZUfTgY3.html'),
('suzuka',2029,'https://www.formula1.com/en/latest/article/formula-1-to-race-in-japan-until-2029-after-new-five-year-extension-2025.7yAlDYf8uDZBUBZn5fBcLx'),
('bahrain',2036,'https://corp.formula1.com/formula-1-announces-it-will-race-in-bahrain-until-2036/'),
('miami',2041,'https://corp.formula1.com/search/contract%2Brace/'),
('montreal',2035,'https://www.formula1.com/en/latest/article/records-growth-and-unforgettable-moments-the-2025-formula-1-season-so-far.1usXKBpUsYIndrYz22GQTq'),
('monaco',2035,'https://www.formula1.com/en/latest/article/f1-to-race-in-monaco-through-2035-after-contract-extension.6djpsN0QD5Zygd4SIcrSZO'),
('barcelona-catalunya',2032,'https://www.formula1.com/en/latest/article/f1-announces-multi-year-extension-with-the-circuit-de-barcelona-catalunya-to.34PBcnuzB9vYVzFIwdEgf4'),
('spielberg',2041,'https://www.formula1.com/en/latest/article/records-growth-and-unforgettable-moments-the-2025-formula-1-season-so-far.1usXKBpUsYIndrYz22GQTq'),
('silverstone',2034,'https://www.formula1.com/en/latest/article/british-grand-prix-to-enter-ninth-decade-with-new-10-year-deal-through-2034.42KhYNFxQuktQQs1OnSnUL.42KhYNFxQuktQQs1OnSnUL'),
('spa-francorchamps',2031,'https://www.formula1.com/en/latest/article/formula-1-announces-multi-year-extension-with-the-belgian-grand-prix.7FR5zJUgLAB7htZrRQUB07'),
('hungaroring',2032,'https://www.formula1.com/en/latest/article/formula-1-to-race-in-hungary-until-2032.hKn4fTq1yH00eDOYi3Pbg.hKn4fTq1yH00eDOYi3Pbg'),
('monza',2031,'https://www.formula1.com/en/latest/article/formula-1-to-race-in-monza-until-2031-with-new-six-year-extension.1ICunI10PkuvLwuozkjxQ8'),
('madrid-ifema',2035,'https://www.formula1.com/en/latest/article/madrid-formula-1-calendar-2026-spanish-grand-prix.rKwSPJ74MczwzDhHVxdQz'),
('baku',2030,'https://corp.formula1.com/formula-1-2025-season-review/'),
('marina-bay',2028,'https://corp.formula1.com/formula-1-announces-seven-year-singapore-grand-prix-extension/'),
('circuit-of-the-americas',2034,'https://www.formula1.com/en/latest/article/formula-1-announces-extension-of-the-united-states-grand-prix-through-2034.1Qxc1oXyrxaSVLKn2IPvRu.1Qxc1oXyrxaSVLKn2IPvRu'),
('hermanos-rodriguez',2028,'https://www.formula1.com/en/latest/article/formula-1-race-in-mexico-city-until-2028-with-new-three-year-extension.5ulR004lsElEueJ1pZQnJV'),
('interlagos',2030,'https://corp.formula1.com/formula-1-to-race-in-sao-paulo-until-2030/'),
('las-vegas',2037,'https://corp.formula1.com/formula-1-to-race-on-the-streets-of-las-vegas-through-2037/'),
('lusail',2032,'https://www.formula1.com/en/latest/article/breaking-qatar-to-join-f1-calendar-in-2021-as-country-signs-additional-10.50lbiJcZfoo6udNWZMDAn6.50lbiJcZfoo6udNWZMDAn6'),
('yas-marina',2030,'https://corp.formula1.com/formula-1-renews-contract-with-abu-dhabi-until-2030/'),
('istanbul-park',2031,'https://www.formula1.com/en/latest/article/formula-1-returns-to-turkeys-istanbul-park-from-2027-as-part-of-new-five-year-agreement.1I7OZGeDPoC6Vysv3iqadY.1I7OZGeDPoC6Vysv3iqadY'),
('algarve',2028,'https://www.formula1.com/en/latest/article/formula-1-to-return-to-portugal-in-2027-and-2028.6kRRgAnvEoGiOkJMkzp1Cr.6kRRgAnvEoGiOkJMkzp1Cr')
) v(slug,through_year,source_url) where t.slug=v.slug;

update public.track_facts set fia_status_note='Not listed as a Grade 1 road circuit in the FIA register dated 2025-07-07; no replacement official licence record found.'
where fia_grade is null;

do $$
begin
  if (select count(*) from public.track_facts where f1_history_status is null) <> 0 then
    raise exception 'Track completion failed: history status missing';
  end if;
  if (select count(*) from public.track_facts where confirmed_future_event and future_confirmed_through_year is null) <> 0 then
    raise exception 'Track completion failed: confirmed future event lacks through-year';
  end if;
  if (select count(*) from public.track_facts where f1_history_status='hosted_f1_world_championship' and first_f1_grand_prix_year is null) <> 0 then
    raise exception 'Track completion failed: hosted venue lacks first GP year';
  end if;
end $$;
