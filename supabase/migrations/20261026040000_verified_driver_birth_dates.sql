-- Birth dates verified against FIA Formula 2 / Formula 3 driver profiles.
-- Naël's FIA F3 profile and Campos Racing's signing announcement agree on 22 June;
-- other published pages give conflicting dates.
begin;
update public.drivers d set date_of_birth = v.dob::date from (values
('Dino Beganovic','2004-01-19','https://www.fiaformula2.com/en/drivers/dino-beganovic'),
('Rafael Câmara','2005-05-05','https://www.fiaformula2.com/en/drivers/rafael-camara'),
('Alexander Dunne','2005-11-11','https://www.fiaformula2.com/en/drivers/alexander-dunne'),
('Théophile Naël','2007-06-22','https://www.fiaformula3.com/en/drivers/theophile-nael'),
('Gabriele Minì','2005-03-20','https://www.fiaformula2.com/en/drivers/gabriele-mini'),
('Nikola Tsolov','2006-12-21','https://www.fiaformula2.com/en/drivers/nikola-tsolov'),
('Joshua Dürksen','2003-10-27','https://www.fiaformula2.com/en/drivers/joshua-durksen'),
('Oliver Goethe','2004-10-14','https://www.fiaformula2.com/en/drivers/oliver-goethe'),
('Ritomo Miyata','1999-08-10','https://www.fiaformula2.com/en/drivers/ritomo-miyata'),
('John Bennett','2003-09-15','https://www.fiaformula2.com/en/drivers/john-bennett'),
('Kush Maini','2000-09-22','https://www.fiaformula2.com/en/drivers/kush-maini'),
('Martinius Stenshorne','2006-02-02','https://www.fiaformula2.com/en/drivers/martinius-stenshorne'),
('Noel León','2004-12-21','https://www.fiaformula2.com/en/drivers/noel-leon'),
('Roman Bilinski','2004-03-04','https://www.fiaformula2.com/en/drivers/roman-bilinski'),
('Ugo Ugochukwu','2007-04-23','https://www.fiaformula3.com/en/drivers/ugo-ugochukwu')) as v(name,dob,source_url) where d."driver-name" = v.name and d.date_of_birth is null;
update public.people p set date_of_birth = v.dob::date from (values
('Dino Beganovic','2004-01-19','https://www.fiaformula2.com/en/drivers/dino-beganovic'),
('Rafael Câmara','2005-05-05','https://www.fiaformula2.com/en/drivers/rafael-camara'),
('Alexander Dunne','2005-11-11','https://www.fiaformula2.com/en/drivers/alexander-dunne'),
('Théophile Naël','2007-06-22','https://www.fiaformula3.com/en/drivers/theophile-nael'),
('Gabriele Minì','2005-03-20','https://www.fiaformula2.com/en/drivers/gabriele-mini'),
('Nikola Tsolov','2006-12-21','https://www.fiaformula2.com/en/drivers/nikola-tsolov'),
('Joshua Dürksen','2003-10-27','https://www.fiaformula2.com/en/drivers/joshua-durksen'),
('Oliver Goethe','2004-10-14','https://www.fiaformula2.com/en/drivers/oliver-goethe'),
('Ritomo Miyata','1999-08-10','https://www.fiaformula2.com/en/drivers/ritomo-miyata'),
('John Bennett','2003-09-15','https://www.fiaformula2.com/en/drivers/john-bennett'),
('Kush Maini','2000-09-22','https://www.fiaformula2.com/en/drivers/kush-maini'),
('Martinius Stenshorne','2006-02-02','https://www.fiaformula2.com/en/drivers/martinius-stenshorne'),
('Noel León','2004-12-21','https://www.fiaformula2.com/en/drivers/noel-leon'),
('Roman Bilinski','2004-03-04','https://www.fiaformula2.com/en/drivers/roman-bilinski'),
('Ugo Ugochukwu','2007-04-23','https://www.fiaformula3.com/en/drivers/ugo-ugochukwu')) as v(name,dob,source_url) where p.display_name = v.name and p.date_of_birth is null;
commit;
