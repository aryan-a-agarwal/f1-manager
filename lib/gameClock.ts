const CLOCK_KEY = "f1-manager-clock";
const START_DATE = new Date("2027-01-04T09:00:00").getTime();
type SavedClock = { gameTime: number; savedAt: number };

export function startGameClock() {
  const clock: SavedClock = { gameTime: START_DATE, savedAt: Date.now() };
  localStorage.setItem(CLOCK_KEY, JSON.stringify(clock));
  return clock.gameTime;
}

export function getGameTime() {
  const stored = localStorage.getItem(CLOCK_KEY);
  if (!stored) return startGameClock();
  try {
    const clock = JSON.parse(stored) as SavedClock;
    if (!Number.isFinite(clock.gameTime) || !Number.isFinite(clock.savedAt)) return startGameClock();
    return clock.gameTime + Math.max(0, Date.now() - clock.savedAt);
  } catch { return startGameClock(); }
}

export function resetGameClock() { localStorage.removeItem(CLOCK_KEY); }
