import assert from "node:assert/strict";
import {
  CAREER_BACKUP_KEY,
  CAREER_STORAGE_KEY,
  CareerSaveError,
  createCareer,
  deleteCareer,
  exportCareer,
  importCareer,
  loadCareer,
  saveCareer,
  type CareerStorage,
} from "../lib/career";

class MemoryStorage implements CareerStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const storage = new MemoryStorage();
storage.setItem("f1-manager-skin", "retro");
const created = createCareer("ferrari", {
  now: new Date("2026-09-01T12:00:00.000Z"),
  careerId: "career-test",
});
const firstSave = saveCareer(created, storage, new Date("2026-09-01T12:01:00.000Z"));
assert.equal(firstSave.metadata.revision, 1);
assert.equal(loadCareer(storage)?.player.teamId, "ferrari");
assert.equal(loadCareer(storage)?.clock.date, "2027-01-04");

const secondSave = saveCareer(firstSave, storage, new Date("2026-09-01T12:02:00.000Z"));
assert.equal(secondSave.metadata.revision, 2);
assert.ok(storage.getItem(CAREER_BACKUP_KEY));

storage.setItem(CAREER_STORAGE_KEY, "{corrupted");
const recovered = loadCareer(storage);
assert.equal(recovered?.metadata.revision, 1);
assert.equal(JSON.parse(storage.getItem(CAREER_STORAGE_KEY) ?? "null").metadata.revision, 1);

const exported = exportCareer(storage);
const importedStorage = new MemoryStorage();
const imported = importCareer(exported, importedStorage);
assert.equal(imported.player.teamId, "ferrari");
assert.throws(() => importCareer("{}", importedStorage), CareerSaveError);

deleteCareer(storage);
assert.equal(loadCareer(storage), null);
assert.equal(storage.getItem(CAREER_BACKUP_KEY), null);
assert.equal(storage.getItem("f1-manager-skin"), "retro");

const legacyStorage = new MemoryStorage();
legacyStorage.setItem("f1-manager-team", "mclaren");
assert.equal(loadCareer(legacyStorage)?.player.teamId, "mclaren");
assert.equal(legacyStorage.getItem("f1-manager-team"), null);

const versionOneStorage = new MemoryStorage();
versionOneStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify({
  ...created,
  schemaVersion: 1,
  clock: { date: "2027-01-04", minuteOfDay: 540 },
}));
const migrated = loadCareer(versionOneStorage);
assert.equal(migrated?.schemaVersion, 5);
assert.equal(migrated?.clock.status, "paused");
assert.equal(migrated?.season.calendar.rounds.length, 24);
assert.equal(migrated?.championship.drivers.length,22);
assert.equal(migrated?.workforce.lineups.length,11);
assert.equal(JSON.parse(versionOneStorage.getItem(CAREER_STORAGE_KEY) ?? "null").schemaVersion, 5);

console.log("Career save calibration passed.");
