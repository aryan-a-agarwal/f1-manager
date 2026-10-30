-- Correct display wording in the just-added game assumption packages only.
begin;
update public.f1_starting_driver_contracts
set clause_package=replace(clause_package::text,'3th or better','3rd or better')::jsonb
where clause_package->>'version'='2027-contract-clauses-v1'
and clause_package::text like '%3th or better%';
commit;
