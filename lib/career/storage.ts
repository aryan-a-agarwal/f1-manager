import { createCareer } from "./createCareer";
import { CAREER_SCHEMA_VERSION, type CareerState } from "./types";
import { isCareerState, parseCareerState } from "./validation";

export const CAREER_STORAGE_KEY = "f1-manager-career";
export const CAREER_BACKUP_KEY = "f1-manager-career-backup";
const LEGACY_TEAM_KEY = "f1-manager-team";
const LEGACY_CLOCK_KEY = "f1-manager-clock";

export type CareerStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class CareerSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CareerSaveError";
  }
}

function browserStorage(): CareerStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function requireStorage(storage?: CareerStorage): CareerStorage {
  const resolved = storage ?? browserStorage();
  if (!resolved) throw new CareerSaveError("Career storage is unavailable in this environment.");
  return resolved;
}

function readValid(storage: CareerStorage, key: string) {
  const raw = storage.getItem(key);
  return raw ? { raw, career: parseCareerState(raw) } : null;
}

function needsMigration(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null
      && "schemaVersion" in value
      && value.schemaVersion !== CAREER_SCHEMA_VERSION;
  } catch {
    return false;
  }
}

export function saveCareer(career: CareerState, storage?: CareerStorage, now = new Date()): CareerState {
  if (!isCareerState(career)) throw new CareerSaveError("The career data is invalid and was not saved.");
  const target = requireStorage(storage);
  const existing = readValid(target, CAREER_STORAGE_KEY);
  if (existing?.career) target.setItem(CAREER_BACKUP_KEY, existing.raw);

  const saved: CareerState = {
    ...career,
    metadata: {
      ...career.metadata,
      updatedAt: now.toISOString(),
      revision: career.metadata.revision + 1,
    },
  };
  target.setItem(CAREER_STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export function loadCareer(storage?: CareerStorage): CareerState | null {
  const target = requireStorage(storage);
  const current = readValid(target, CAREER_STORAGE_KEY);
  if (current?.career) {
    if (needsMigration(current.raw)) {
      target.setItem(CAREER_BACKUP_KEY, current.raw);
      target.setItem(CAREER_STORAGE_KEY, JSON.stringify(current.career));
    }
    return current.career;
  }

  const backup = readValid(target, CAREER_BACKUP_KEY);
  if (backup?.career) {
    target.setItem(CAREER_STORAGE_KEY, backup.raw);
    return backup.career;
  }

  const legacyTeamId = target.getItem(LEGACY_TEAM_KEY);
  if (legacyTeamId) {
    const migrated = saveCareer(createCareer(legacyTeamId), target);
    target.removeItem(LEGACY_TEAM_KEY);
    return migrated;
  }
  return null;
}

export function deleteCareer(storage?: CareerStorage) {
  const target = requireStorage(storage);
  target.removeItem(CAREER_STORAGE_KEY);
  target.removeItem(CAREER_BACKUP_KEY);
  target.removeItem(LEGACY_TEAM_KEY);
  target.removeItem(LEGACY_CLOCK_KEY);
}

export function exportCareer(storage?: CareerStorage): string {
  const career = loadCareer(storage);
  if (!career) throw new CareerSaveError("There is no active career to export.");
  return JSON.stringify(career, null, 2);
}

export function importCareer(raw: string, storage?: CareerStorage): CareerState {
  const career = parseCareerState(raw);
  if (!career) throw new CareerSaveError("The imported career is invalid or incompatible.");
  return saveCareer(career, storage);
}
