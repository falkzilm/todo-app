import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getTimeOfDayGreeting } from '../../../core/date/greeting';
import { createTask } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { STORAGE } from '../../../core/services/storage.token';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { AufgabenPageComponent } from './aufgaben-page.component';

function createMockStore(
  tasksToday: ReturnType<typeof createTask>[] = [],
  tasksThisWeek: ReturnType<typeof createTask>[] = [],
  importantTasks: ReturnType<typeof createTask>[] = [],
  todayTotalCount = tasksToday.length,
  todayCompletedCount = 0,
): Partial<TaskStoreService> {
  return {
    tasksToday: signal(tasksToday),
    tasksThisWeek: signal(tasksThisWeek),
    importantTasks: signal(importantTasks),
    todayTotalCount: signal(todayTotalCount),
    todayCompletedCount: signal(todayCompletedCount),
    add: () => createTask({ title: 'x' }),
    toggleCompleted: () => undefined,
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

function setUp(store: Partial<TaskStoreService> = createMockStore()) {
  TestBed.configureTestingModule({
    imports: [AufgabenPageComponent],
    providers: [
      { provide: TaskStoreService, useValue: store },
      { provide: STORAGE, useValue: createMockStorage() },
    ],
  });

  const fixture = TestBed.createComponent(AufgabenPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('AufgabenPageComponent', () => {
  it('renders with a mocked store without error', () => {
    expect(() => setUp()).not.toThrow();
  });

  it('shows a personalized time-of-day greeting for the default demo profile as a heading', () => {
    const fixture = setUp();

    const heading = fixture.nativeElement.querySelector('h2');
    const expectedGreeting = `${getTimeOfDayGreeting(new Date())}, Laura! 👋`;
    expect(heading.textContent).toContain(expectedGreeting);
  });

  it('shows the static "plan for today" subtitle', () => {
    const fixture = setUp();

    expect(fixture.nativeElement.textContent).toContain('Hier ist dein Plan für heute.');
  });

  it('includes the notification bell and quick-add form', () => {
    const fixture = setUp();

    expect(fixture.nativeElement.querySelector('app-notification-bell')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.task-quick-add')).not.toBeNull();
  });

  it('defaults to the "Heute" filter, rendering a flat, already-sorted task-list', () => {
    const morning = createTask({
      title: 'Sprint-Planung',
      dueDate: '2026-09-02',
      startTime: '09:00',
    });
    const noon = createTask({ title: 'Einkaufsliste', dueDate: '2026-09-02', startTime: '13:00' });
    const fixture = setUp(createMockStore([morning, noon], [], []));

    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.task-list > li'),
    ) as HTMLElement[];
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Sprint-Planung'),
      expect.stringContaining('Einkaufsliste'),
    ]);
    expect(fixture.nativeElement.querySelector('.aufgaben-page__group-title')).toBeNull();
  });

  it('keeps completed tasks visible inline (no separate/collapsible done section)', () => {
    const completedTask = {
      ...createTask({ title: 'Milch kaufen', dueDate: '2026-09-02' }),
      completed: true,
    };
    const fixture = setUp(createMockStore([completedTask], [], []));

    expect(fixture.nativeElement.textContent).toContain('Milch kaufen');
    expect(fixture.nativeElement.querySelector('.heute-page__completed-toggle')).toBeNull();
  });

  it('shows an empty state when the active filter has no matching tasks', () => {
    const fixture = setUp(createMockStore([], [], []));

    expect(fixture.nativeElement.textContent).toContain('Heute steht nichts an.');
  });

  it('switches the rendered list and empty state when a different filter is selected', () => {
    const importantTask = createTask({ title: 'Design-Review', priority: 'high' });
    const fixture = setUp(createMockStore([], [], [importantTask]));

    expect(fixture.nativeElement.textContent).toContain('Heute steht nichts an.');

    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    const wichtigChip = chips.find((chip) => chip.textContent?.includes('Wichtig'));
    wichtigChip?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Design-Review');
    expect(fixture.nativeElement.textContent).not.toContain('Heute steht nichts an.');
  });

  describe('Live-Region-Ankündigungen', () => {
    it('announces toggling a task via the live region', () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const fixture = setUp(createMockStore([task], [], []));
      const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');

      fixture.componentInstance['toggleTask'](task.id);

      expect(announceSpy).toHaveBeenCalledWith('„Heute fällig“ als erledigt markiert.');
    });

    it('announces removing a task via the live region', () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const fixture = setUp(createMockStore([task], [], []));
      const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');

      fixture.componentInstance['removeTask'](task.id);

      expect(announceSpy).toHaveBeenCalledWith('„Heute fällig“ gelöscht.');
    });

    it('announces adding a task via the quick-add form', async () => {
      const fixture = setUp();
      // ngModel registers with its parent form asynchronously (to avoid an
      // ExpressionChangedAfterItHasBeenCheckedError), so the first
      // detectChanges() inside setUp() alone isn't enough for it to start
      // reflecting model changes.
      await fixture.whenStable();
      fixture.detectChanges();
      const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');

      const input = fixture.nativeElement.querySelector(
        '.task-quick-add input',
      ) as HTMLInputElement;
      const form = fixture.nativeElement.querySelector('.task-quick-add') as HTMLFormElement;
      input.value = 'Neue Aufgabe';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      form.dispatchEvent(new Event('submit'));

      expect(announceSpy).toHaveBeenCalledWith('„Neue Aufgabe“ hinzugefügt.');
    });
  });

  describe('Tagesfortschritt', () => {
    it('passes today totals through to the progress card', () => {
      const fixture = setUp(createMockStore([], [], [], 4, 3));

      expect(fixture.nativeElement.textContent).toContain(
        'Du hast 3 von 4 Aufgaben für heute erledigt.',
      );
    });
  });

  describe('Fälligkeitsdatum ändern', () => {
    it('reschedules a task via its date picker through the shared task store', () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const store = createMockStore([task], [], []);
      const updateSpy = vi.fn();
      store.update = updateSpy;
      const fixture = setUp(store);

      fixture.componentInstance['saveDueDate'](task.id, '2026-09-12');

      expect(updateSpy).toHaveBeenCalledWith(task.id, { dueDate: '2026-09-12' });
    });
  });
});
