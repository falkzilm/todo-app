import { Injectable, inject } from '@angular/core';
import { createDemoTasks } from '../models/demo-tasks';
import { Task } from '../models/task.model';
import { STORAGE } from './storage.token';

const STORAGE_KEY = 'todo-app.tasks';
const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedStateV1 {
  version: 1;
  tasks: Task[];
}

/**
 * Upgrades data from the given `fromVersion` to `fromVersion + 1`.
 * Keyed by the version being upgraded *from*.
 */
const MIGRATIONS: Record<number, (data: unknown) => unknown> = {
  0: (data) => ({
    version: 1,
    tasks: isRecord(data) && Array.isArray(data['tasks']) ? data['tasks'] : [],
  }),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Migrates arbitrary persisted data to the current schema version.
 * Unversioned data is treated as version 0. Versions without a known
 * migration path (older gaps or unreleased future versions) fall back to
 * an empty task list instead of throwing, so a corrupted or foreign
 * payload never breaks app startup.
 */
export function migrateToCurrentSchema(raw: unknown): PersistedStateV1 {
  if (!isRecord(raw)) {
    return { version: CURRENT_SCHEMA_VERSION, tasks: [] };
  }

  let version = typeof raw['version'] === 'number' ? raw['version'] : 0;
  let data: unknown = raw;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      console.warn(`No migration available from task storage schema version ${version}.`);
      return { version: CURRENT_SCHEMA_VERSION, tasks: [] };
    }
    data = migrate(data);
    version = isRecord(data) && typeof data['version'] === 'number' ? data['version'] : version + 1;
  }

  if (version > CURRENT_SCHEMA_VERSION || !isRecord(data) || !Array.isArray(data['tasks'])) {
    console.warn(`Unsupported task storage schema version ${version}.`);
    return { version: CURRENT_SCHEMA_VERSION, tasks: [] };
  }

  return { version: CURRENT_SCHEMA_VERSION, tasks: data['tasks'] as Task[] };
}

@Injectable({ providedIn: 'root' })
export class TaskPersistenceService {
  private readonly storage = inject(STORAGE);

  load(): Task[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) {
      // Nothing has ever been saved: seed and persist a demo task set so a
      // first-time user sees example data instead of an empty app.
      const demoTasks = createDemoTasks();
      this.save(demoTasks);
      return demoTasks;
    }

    try {
      return migrateToCurrentSchema(JSON.parse(raw)).tasks;
    } catch {
      console.warn('Failed to parse persisted tasks; starting with an empty list.');
      return [];
    }
  }

  save(tasks: Task[]): void {
    const state: PersistedStateV1 = { version: CURRENT_SCHEMA_VERSION, tasks };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
