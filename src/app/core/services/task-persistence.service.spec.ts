import { TestBed } from '@angular/core/testing';
import { todayAsCalendarDate, Task } from '../models/task.model';
import { STORAGE } from './storage.token';
import { TaskPersistenceService, migrateToCurrentSchema } from './task-persistence.service';

function createMockStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

const exampleTask: Task = {
  id: 'task-1',
  title: 'Milch kaufen',
  notes: null,
  dueDate: null,
  completed: false,
  completedAt: null,
  createdAt: '2026-09-01',
  updatedAt: '2026-09-01',
};

describe('TaskPersistenceService', () => {
  let storage: Storage;
  let service: TaskPersistenceService;

  beforeEach(() => {
    storage = createMockStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE, useValue: storage }],
    });
    service = TestBed.inject(TaskPersistenceService);
  });

  describe('load', () => {
    it('seeds and returns demo tasks covering today, overdue and upcoming when nothing has been persisted yet', () => {
      const tasks = service.load();

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some((task) => task.dueDate === todayAsCalendarDate())).toBe(true);
      expect(
        tasks.some((task) => task.dueDate !== null && task.dueDate < todayAsCalendarDate()),
      ).toBe(true);
      expect(
        tasks.some((task) => task.dueDate !== null && task.dueDate > todayAsCalendarDate()),
      ).toBe(true);
    });

    it('persists the seeded demo tasks so a subsequent load does not reseed', () => {
      const first = service.load();
      const second = service.load();

      expect(second).toEqual(first);
    });

    it('does not insert demo tasks when the user has already saved data, even an empty list', () => {
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 1, tasks: [] }));

      expect(service.load()).toEqual([]);
    });

    it('returns the persisted tasks for the current schema version', () => {
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 1, tasks: [exampleTask] }));

      expect(service.load()).toEqual([exampleTask]);
    });

    it('returns an empty list when the persisted value is not valid JSON', () => {
      storage.setItem('todo-app.tasks', '{not-json');

      expect(service.load()).toEqual([]);
    });

    it('discards persisted tasks with missing required fields', () => {
      const withoutTitle: Record<string, unknown> = { ...exampleTask };
      delete withoutTitle['title'];
      storage.setItem(
        'todo-app.tasks',
        JSON.stringify({ version: 1, tasks: [withoutTitle, exampleTask] }),
      );

      expect(service.load()).toEqual([exampleTask]);
    });

    it('discards persisted tasks with a field of the wrong type', () => {
      const wrongType = { ...exampleTask, completed: 'yes' };
      storage.setItem(
        'todo-app.tasks',
        JSON.stringify({ version: 1, tasks: [wrongType, exampleTask] }),
      );

      expect(service.load()).toEqual([exampleTask]);
    });

    it('discards persisted tasks with a malformed date', () => {
      const badDate = { ...exampleTask, createdAt: '01.09.2026' };
      storage.setItem(
        'todo-app.tasks',
        JSON.stringify({ version: 1, tasks: [badDate, exampleTask] }),
      );

      expect(service.load()).toEqual([exampleTask]);
    });

    it('clamps overly long titles and notes to the defined maximum', () => {
      const longTask = {
        ...exampleTask,
        title: 'a'.repeat(500),
        notes: 'b'.repeat(5000),
      };
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 1, tasks: [longTask] }));

      const [loaded] = service.load();
      expect(loaded.title.length).toBeLessThanOrEqual(200);
      expect(loaded.notes?.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('save', () => {
    it('writes the tasks together with the current schema version', () => {
      service.save([exampleTask]);

      const raw = storage.getItem('todo-app.tasks');
      expect(JSON.parse(raw as string)).toEqual({ version: 1, tasks: [exampleTask] });
    });

    it('round-trips tasks written by save through load', () => {
      service.save([exampleTask]);

      expect(service.load()).toEqual([exampleTask]);
    });

    it('clamps overly long titles and notes before writing', () => {
      const longTask: Task = {
        ...exampleTask,
        title: 'a'.repeat(500),
        notes: 'b'.repeat(5000),
      };
      service.save([longTask]);

      const raw = storage.getItem('todo-app.tasks');
      const { tasks } = JSON.parse(raw as string) as { tasks: Task[] };
      expect(tasks[0].title.length).toBeLessThanOrEqual(200);
      expect(tasks[0].notes?.length).toBeLessThanOrEqual(2000);
    });
  });
});

describe('migrateToCurrentSchema', () => {
  it('passes data that already matches the current version through unchanged', () => {
    const state = { version: 1, tasks: [exampleTask] };

    expect(migrateToCurrentSchema(state)).toEqual(state);
  });

  it('migrates unversioned (legacy) data by treating it as version 0', () => {
    const legacy = { tasks: [exampleTask] };

    expect(migrateToCurrentSchema(legacy)).toEqual({ version: 1, tasks: [exampleTask] });
  });

  it('falls back to an empty task list for an unknown older schema version', () => {
    const unknown = { version: -1, tasks: [exampleTask] };

    expect(migrateToCurrentSchema(unknown)).toEqual({ version: 1, tasks: [] });
  });

  it('falls back to an empty task list for an unsupported future schema version', () => {
    const future = { version: 99, tasks: [exampleTask] };

    expect(migrateToCurrentSchema(future)).toEqual({ version: 1, tasks: [] });
  });

  it('falls back to an empty task list for non-object input', () => {
    expect(migrateToCurrentSchema('not an object')).toEqual({ version: 1, tasks: [] });
    expect(migrateToCurrentSchema(null)).toEqual({ version: 1, tasks: [] });
  });
});
