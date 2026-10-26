/** Calculated ratings use only explicitly recorded inputs, never stored overall or potential. */
export function calculateDriverRatings(driver: Record<string, unknown>, birthDate: unknown, asOf: string) {
  const groups: [number, Record<string, number>][] = [
    [.8, {pace:.25, qualifying:.20, racecraft:.20, consistency:.15, overtaking:.10, defending:.05, wet_weather_ability:.05}],
    [.15, {tyre_management:.35, tyre_warm_up_ability:.20, temperature_control:.15, battery_management:.15, reliability:.10, team_orders_understanding:.05}],
    [.05, {braking:.25, cornering:.25, reactions:.15, smoothness:.15, adaptability:.10, incident_proneness:.10}],
  ];
  let raw = 0;
  for (const [groupWeight, fields] of groups) for (const [key, weight] of Object.entries(fields)) {
    const value = driver[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) return {overall:null, potential:null};
    raw += groupWeight * weight * (key === 'incident_proneness' ? 100 - value : value);
  }
  const overall = Math.round(raw);
  const development = driver.development_rate;
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf) || typeof development !== 'number' || !Number.isFinite(development) || development < 0 || development > 100) return {overall, potential:null};
  const birth = new Date(`${birthDate}T00:00:00Z`), current = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0,10) !== birthDate || Number.isNaN(current.getTime()) || current.toISOString().slice(0,10) !== asOf || birth > current) return {overall, potential:null};
  const age = current.getUTCFullYear() - birth.getUTCFullYear() - (asOf.slice(5) < birthDate.slice(5) ? 1 : 0);
  const ageFactor = Math.max(0, Math.min(1, (32 - age) / 12));
  return {overall, potential:Math.round(raw + Math.min(16, 100 - raw) * ageFactor * (development / 100) ** 2)};
}
