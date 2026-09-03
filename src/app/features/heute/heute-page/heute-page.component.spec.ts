import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMonthGrid } from '../../../core/date/date-utils';
import { createTask } from '../../../core/models/task.model';
import { STORAGE } from '../../../core/services/storage.token';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { HeutePageComponent } from './heute-page.component';

function createMockStore(
  todayTasks: ReturnType<typeof createTask>[] = [],
  overdueTasks: ReturnType<typeof createTask>[] = [],
  todayTotalCount = todayTasks.length,
  todayCompletedCount = 0,
  todayCompletedTasks: ReturnType<typeof createTask>[] = [],
): Partial<TaskStoreService> {
  return {
    todayTasks: signal(todayTasks),
    overdueTasks: signal(overdueTasks),
    todayTotalCount: signal(todayTotalCount),
    todayCompletedCount: signal(todayCompletedCount),
    todayCompletedTasks: signal(todayCompletedTasks),
    remove: () => undefined,
    update: () => undefined,
  };
}

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

describe('HeutePageComponent', () => {
  it('renders with a mocked store without error', () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore() },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('shows the current date, correctly formatted', () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore() },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    const expectedLabel = new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    expect(fixture.nativeElement.textContent).toContain(expectedLabel);
  });

  it('shows a quiet empty state when there are no open tasks at all', () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore([], []) },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Heute steht nichts an.');
  });

  it('lists today tasks under "Heute" and overdue tasks under "Überfällig"', () => {
    const todayTask = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
    const overdueTask = createTask({ title: 'Überfällig', dueDate: '2026-08-30' });

    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore([todayTask], [overdueTask]) },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Heute fällig');
    expect(text).toContain('Überfällig');
    expect(text).not.toContain('Heute steht nichts an.');
  });

  describe('Tagesfortschritt', () => {
    it('shows "x von y erledigt" and a progressbar reflecting the completed share', () => {
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          { provide: TaskStoreService, useValue: createMockStore([], [], 4, 3) },
          { provide: STORAGE, useValue: createMockStorage() },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('3 von 4 erledigt');
      const progressbar = fixture.nativeElement.querySelector('[role="progressbar"]');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
      expect(progressbar.getAttribute('aria-valuetext')).toBe('3 von 4 erledigt');
    });

    it('does not show a progress indicator when there are no tasks due today', () => {
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          { provide: TaskStoreService, useValue: createMockStore([], [], 0, 0) },
          { provide: STORAGE, useValue: createMockStorage() },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('erledigt');
      expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
    });

    it('updates immediately when the completed count changes', () => {
      const store = createMockStore([], [], 2, 0);
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          { provide: TaskStoreService, useValue: store },
          { provide: STORAGE, useValue: createMockStorage() },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('0 von 2 erledigt');

      (store.todayCompletedCount as ReturnType<typeof signal<number>>).set(1);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('1 von 2 erledigt');
    });
  });

  describe('Fälligkeitsdatum ändern', () => {
    it('reschedules a task via its date picker through the shared task store', () => {
      const todayTask = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const store = createMockStore([todayTask], []);
      const updateSpy = vi.fn();
      store.update = updateSpy;

      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          { provide: TaskStoreService, useValue: store },
          { provide: STORAGE, useValue: createMockStorage() },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector(
        '.app-task-item__due-date .date-picker__trigger',
      ) as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();

      const cells = Array.from(
        fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
      ) as HTMLElement[];
      const index = getMonthGrid(new Date(2026, 8, 2)).findIndex(
        (day) => day.date === '2026-09-12',
      );
      cells[index].click();
      fixture.detectChanges();

      expect(updateSpy).toHaveBeenCalledWith(todayTask.id, { dueDate: '2026-09-12' });
    });
  });

  describe('Erledigte Aufgaben', () => {
    function setUp(storage: Storage = createMockStorage()) {
      TestBed.resetTestingModule();
      const completedTask = createTask({ title: 'Milch kaufen', dueDate: '2026-09-02' });
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          {
            provide: TaskStoreService,
            useValue: createMockStore([], [], 0, 1, [completedTask]),
          },
          { provide: STORAGE, useValue: storage },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();
      return { fixture, completedTask };
    }

    it('shows the completed section collapsed by default, summarized with a count', () => {
      const { fixture, completedTask } = setUp();

      const toggle = fixture.nativeElement.querySelector('.heute-page__completed-toggle');
      expect(toggle.textContent).toContain('Erledigt (1)');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.textContent).not.toContain(completedTask.title);
    });

    it('expands to show the completed tasks when toggled, and can be collapsed again', () => {
      const { fixture, completedTask } = setUp();
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.heute-page__completed-toggle',
      );

      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.textContent).toContain(completedTask.title);

      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.textContent).not.toContain(completedTask.title);
    });

    it('is a real button, so it is keyboard-operable without extra wiring', () => {
      const { fixture } = setUp();
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.heute-page__completed-toggle',
      );

      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle.type).toBe('button');
    });

    it('persists the expanded state so it survives a reload', () => {
      const storage = createMockStorage();
      const { fixture } = setUp(storage);
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.heute-page__completed-toggle',
      );

      toggle.click();
      fixture.detectChanges();

      expect(storage.getItem('todo-app.heute.completedExpanded')).toBe('true');

      const { fixture: reloaded } = setUp(storage);
      const reloadedToggle = reloaded.nativeElement.querySelector('.heute-page__completed-toggle');
      expect(reloadedToggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('does not show the completed section when nothing is completed today', () => {
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [
          { provide: TaskStoreService, useValue: createMockStore([], [], 0, 0, []) },
          { provide: STORAGE, useValue: createMockStorage() },
        ],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.heute-page__completed-toggle')).toBeNull();
    });
  });
});
