import { TestBed } from '@angular/core/testing';
import { Task, todayAsCalendarDate } from '../models/task.model';
import { STORAGE } from './storage.token';
import { TaskStoreService } from './task-store.service';

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

describe('TaskStoreService', () => {
  let store: TaskStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE, useValue: createMockStorage() }],
    });
    store = TestBed.inject(TaskStoreService);
  });

  it('should be created with an empty task list', () => {
    expect(store).toBeTruthy();
    expect(store.tasks()).toEqual([]);
  });

  describe('add', () => {
    it('appends a new task to the list', () => {
      const task = store.add({ title: 'Milch kaufen' });

      expect(store.tasks()).toEqual([task]);
    });

    it('does not mutate the previous tasks array', () => {
      const before = store.tasks();
      store.add({ title: 'Milch kaufen' });

      expect(store.tasks()).not.toBe(before);
      expect(before).toEqual([]);
    });

    it('adds multiple tasks in insertion order', () => {
      const first = store.add({ title: 'Aufgabe 1' });
      const second = store.add({ title: 'Aufgabe 2' });

      expect(store.tasks()).toEqual([first, second]);
    });
  });

  describe('update', () => {
    it('updates the title of the matching task immutably', () => {
      const task = store.add({ title: 'Milch kaufen' });
      const before = store.tasks();

      store.update(task.id, { title: 'Brot kaufen' });

      expect(store.tasks()).not.toBe(before);
      expect(store.tasks()[0]).not.toBe(task);
      expect(store.tasks()[0].title).toBe('Brot kaufen');
    });

    it('updates notes and dueDate', () => {
      const task = store.add({ title: 'Aufgabe' });

      store.update(task.id, { notes: 'Details', dueDate: '2026-09-05' });

      expect(store.tasks()[0].notes).toBe('Details');
      expect(store.tasks()[0].dueDate).toBe('2026-09-05');
    });

    it('leaves fields untouched when not part of the changes', () => {
      const task = store.add({ title: 'Aufgabe', notes: 'Ursprüngliche Notiz' });

      store.update(task.id, { title: 'Neuer Titel' });

      expect(store.tasks()[0].notes).toBe('Ursprüngliche Notiz');
    });

    it('clears notes when explicitly set to null', () => {
      const task = store.add({ title: 'Aufgabe', notes: 'Notiz' });

      store.update(task.id, { notes: null });

      expect(store.tasks()[0].notes).toBeNull();
    });

    it('does not change tasks that do not match the id', () => {
      const task = store.add({ title: 'Aufgabe' });

      store.update('unbekannte-id', { title: 'Anders' });

      expect(store.tasks()[0]).toEqual(task);
    });

    it('throws when the resulting title would be empty', () => {
      const task = store.add({ title: 'Aufgabe' });

      expect(() => store.update(task.id, { title: '   ' })).toThrow();
    });

    it('throws when the dueDate is not a valid calendar date string', () => {
      const task = store.add({ title: 'Aufgabe' });

      expect(() => store.update(task.id, { dueDate: '2026-09-02T10:00:00Z' })).toThrow();
      expect(() => store.update(task.id, { dueDate: 'not-a-date' })).toThrow();
    });

    it('does not change the task when the dueDate update is invalid', () => {
      const task = store.add({ title: 'Aufgabe', dueDate: '2026-09-01' });

      expect(() => store.update(task.id, { dueDate: 'invalid' })).toThrow();
      expect(store.tasks()[0].dueDate).toBe('2026-09-01');
    });
  });

  describe('toggleCompleted', () => {
    it('marks an open task as completed and sets completedAt', () => {
      const task = store.add({ title: 'Aufgabe' });

      store.toggleCompleted(task.id);

      const updated = store.tasks()[0];
      expect(updated.completed).toBe(true);
      expect(updated.completedAt).toBe(todayAsCalendarDate());
    });

    it('marks a completed task as open again and clears completedAt', () => {
      const task = store.add({ title: 'Aufgabe' });
      store.toggleCompleted(task.id);

      store.toggleCompleted(task.id);

      const updated = store.tasks()[0];
      expect(updated.completed).toBe(false);
      expect(updated.completedAt).toBeNull();
    });

    it('does not mutate the previous task object', () => {
      const task = store.add({ title: 'Aufgabe' });

      store.toggleCompleted(task.id);

      expect(store.tasks()[0]).not.toBe(task);
    });
  });

  describe('remove', () => {
    it('removes the matching task', () => {
      const task = store.add({ title: 'Aufgabe' });

      store.remove(task.id);

      expect(store.tasks()).toEqual([]);
    });

    it('keeps other tasks untouched', () => {
      const first = store.add({ title: 'Aufgabe 1' });
      const second = store.add({ title: 'Aufgabe 2' });

      store.remove(first.id);

      expect(store.tasks()).toEqual([second]);
    });
  });

  describe('tasksForDate', () => {
    it('returns only tasks due on the given date', () => {
      const matching = store.add({ title: 'Heute fällig', dueDate: '2026-09-02' });
      store.add({ title: 'Anderer Tag', dueDate: '2026-09-05' });
      store.add({ title: 'Ohne Datum' });

      expect(store.tasksForDate('2026-09-02')()).toEqual([matching]);
    });

    it('reacts to newly added tasks for the same date', () => {
      const selector = store.tasksForDate('2026-09-02');
      expect(selector()).toEqual([]);

      const task = store.add({ title: 'Aufgabe', dueDate: '2026-09-02' });

      expect(selector()).toEqual([task]);
    });
  });

  describe('todayTasks', () => {
    it('returns tasks due today', () => {
      const today = todayAsCalendarDate();
      const task = store.add({ title: 'Heute', dueDate: today });
      store.add({ title: 'Morgen', dueDate: '2099-01-01' });

      expect(store.todayTasks()).toEqual([task]);
    });
  });

  describe('overdueTasks', () => {
    it('returns open tasks with a due date in the past', () => {
      const overdue = store.add({ title: 'Überfällig', dueDate: '2020-01-01' });
      store.add({ title: 'Zukünftig', dueDate: '2099-01-01' });

      expect(store.overdueTasks()).toEqual([overdue]);
    });

    it('excludes completed tasks even if their due date is in the past', () => {
      const task = store.add({ title: 'Erledigt', dueDate: '2020-01-01' });
      store.toggleCompleted(task.id);

      expect(store.overdueTasks()).toEqual([]);
    });

    it('excludes tasks without a due date', () => {
      store.add({ title: 'Ohne Datum' });

      expect(store.overdueTasks()).toEqual([]);
    });
  });

  describe('openTasks and completedTasks', () => {
    it('splits tasks by completion state', () => {
      const open = store.add({ title: 'Offen' });
      const done = store.add({ title: 'Erledigt' });
      store.toggleCompleted(done.id);

      expect(store.openTasks()).toEqual([open]);
      expect(store.completedTasks()[0].id).toBe(done.id);
    });
  });

  describe('persistence', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('loads previously persisted tasks on startup', () => {
      const storage = createMockStorage();
      const persisted: Task[] = [
        {
          id: 'task-1',
          title: 'Bereits gespeichert',
          notes: null,
          dueDate: null,
          completed: false,
          completedAt: null,
          createdAt: '2026-09-01',
          updatedAt: '2026-09-01',
        },
      ];
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 1, tasks: persisted }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: storage }] });
      const restoredStore = TestBed.inject(TaskStoreService);

      expect(restoredStore.tasks()).toEqual(persisted);
    });

    it('bundles several rapid changes into a single debounced write', () => {
      vi.useFakeTimers();
      const storage = TestBed.inject(STORAGE);
      const setItemSpy = vi.spyOn(storage, 'setItem');

      store.add({ title: 'Aufgabe 1' });
      TestBed.tick();
      store.add({ title: 'Aufgabe 2' });
      TestBed.tick();
      store.add({ title: 'Aufgabe 3' });
      TestBed.tick();

      expect(setItemSpy).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(setItemSpy).toHaveBeenCalledTimes(1);
      const [, value] = setItemSpy.mock.calls[0];
      expect(JSON.parse(value).tasks).toHaveLength(3);
    });

    it('does not persist on startup before any change is made', () => {
      vi.useFakeTimers();
      const storage = TestBed.inject(STORAGE);
      const setItemSpy = vi.spyOn(storage, 'setItem');

      vi.runAllTimers();

      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('persists the tasks resulting from a change after the debounce window', () => {
      vi.useFakeTimers();
      const storage = TestBed.inject(STORAGE);

      const task = store.add({ title: 'Aufgabe' });
      TestBed.tick();

      vi.runAllTimers();

      const raw = storage.getItem('todo-app.tasks');
      expect(JSON.parse(raw as string)).toEqual({ version: 1, tasks: [task] });
    });
  });
});
