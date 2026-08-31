-- Public game clients may read verified reference facts. Writes remain restricted.
create policy "read data sources" on public.data_sources for select using (true);
create policy "read team facts" on public.f1_team_facts for select using (true);
create policy "read people facts" on public.people for select using (true);
create policy "read series entries" on public.series_entries for select using (true);
create policy "read team staff" on public.f1_team_staff for select using (true);
create policy "read track facts" on public.track_facts for select using (true);
