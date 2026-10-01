import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { getTimeOfDayGreeting } from '../../../core/date/greeting';
import { createTask, todayAsCalendarDate } from '../../../core/models/task.model';
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
    tasks: signal([...tasksToday, ...tasksThisWeek, ...importantTasks]),
    tasksToday: signal(tasksToday),
    tasksThisWeek: signal(tasksThisWeek),
    importantTasks: signal(importantTasks),
    todayTotalCount: signal(todayTotalCount),
    todayCompletedCount: signal(todayCompletedCount),
    overdueTasks: signal([]),
    todayTasks: signal([]),
    add: () => createTask({ title: 'x' }),
    toggleCompleted: () => undefined,
    remove: () => undefined,
    restore: () => undefined,
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

    it('shows an undo notice instead of an announcement when a task is removed', () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const store = createMockStore([task], [], []);
      store.remove = () => task;
      const fixture = setUp(store);
      const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');

      fixture.componentInstance['removeTask'](task.id);
      fixture.detectChanges();

      expect(announceSpy).not.toHaveBeenCalled();
      const notice = fixture.nativeElement.querySelector('.undo-notice');
      expect(notice?.getAttribute('role')).toBe('status');
      expect(notice?.textContent).toContain('Heute fällig');
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

    it('updates the progress card immediately when a task is toggled as completed', () => {
      const storage = createMockStorage();
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 2, tasks: [] }));
      TestBed.configureTestingModule({
        imports: [AufgabenPageComponent],
        providers: [{ provide: STORAGE, useValue: storage }],
      });
      const fixture = TestBed.createComponent(AufgabenPageComponent);
      const store = TestBed.inject(TaskStoreService);
      const task = store.add({ title: 'Heute fällig', dueDate: todayAsCalendarDate() });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Du hast heute noch keine Aufgabe erledigt.',
      );

      fixture.componentInstance['toggleTask'](task.id);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Du hast heute alle 1 Aufgaben erledigt.',
      );
    });
  });

  describe('Schnellerfassung (TDP-39)', () => {
    /**
     * Expands the quick-add card. `triggerEventHandler` invokes the bound
     * `(focusin)` listener directly instead of dispatching a real DOM focus
     * event, so there's no dependency on zone-scheduled change detection
     * (`provideZoneChangeDetection({ eventCoalescing: true })` defers that to a
     * later macrotask) racing with the assertions that follow.
     */
    function focusAndExpand(fixture: ReturnType<typeof TestBed.createComponent>): void {
      fixture.debugElement.query(By.css('.task-quick-add')).triggerEventHandler('focusin', {});
      fixture.detectChanges();
    }

    function setUpWithRealStore(): { fixture: ReturnType<typeof TestBed.createComponent> } {
      const storage = createMockStorage();
      storage.setItem('todo-app.tasks', JSON.stringify({ version: 2, tasks: [] }));
      TestBed.configureTestingModule({
        imports: [AufgabenPageComponent],
        providers: [{ provide: STORAGE, useValue: storage }],
      });
      const fixture = TestBed.createComponent(AufgabenPageComponent);
      fixture.detectChanges();
      return { fixture };
    }

    async function addViaQuickAdd(
      fixture: ReturnType<typeof TestBed.createComponent>,
      title: string,
      time?: string,
    ): Promise<void> {
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.task-quick-add input',
      ) as HTMLInputElement;
      input.value = title;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      if (time) {
        focusAndExpand(fixture);
        // The time input's `ngModel` registers with its parent form asynchronously
        // (to avoid an ExpressionChangedAfterItHasBeenCheckedError), so a freshly
        // expanded time input needs one more stable tick before it picks up input events.
        await fixture.whenStable();
        fixture.detectChanges();
        const timeInput = fixture.nativeElement.querySelector(
          '.task-quick-add__time-input',
        ) as HTMLInputElement;
        timeInput.value = time;
        timeInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }

      fixture.nativeElement.querySelector('.task-quick-add')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    }

    it('creates a task from the title alone, counted by the progress card', async () => {
      const { fixture } = setUpWithRealStore();

      await addViaQuickAdd(fixture, 'Milch kaufen');

      expect(fixture.nativeElement.textContent).toContain('Milch kaufen');
      expect(fixture.nativeElement.textContent).toContain(
        'Du hast heute noch keine Aufgabe erledigt.',
      );
    });

    it('inserts a task created with a time at its chronologically correct position in the list', async () => {
      const { fixture } = setUpWithRealStore();
      const store = TestBed.inject(TaskStoreService);
      store.add({ title: 'Nachmittags-Termin', dueDate: todayAsCalendarDate(), startTime: '15:00' });
      fixture.detectChanges();

      await addViaQuickAdd(fixture, 'Morgens-Termin', '09:00');

      const items = Array.from(
        fixture.nativeElement.querySelectorAll('.task-list > li'),
      ) as HTMLElement[];
      expect(items.map((item) => item.textContent)).toEqual([
        expect.stringContaining('Morgens-Termin'),
        expect.stringContaining('Nachmittags-Termin'),
      ]);
    });

    it('rejects a whitespace-only title with a visible hint and keeps the entered category', async () => {
      const { fixture } = setUpWithRealStore();
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.task-quick-add input',
      ) as HTMLInputElement;
      focusAndExpand(fixture);
      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const categoryPill = Array.from(
        fixture.nativeElement.querySelectorAll('.task-quick-add__pill'),
      ).find((pill) => (pill as HTMLElement).textContent?.includes('Arbeit')) as
        | HTMLButtonElement
        | undefined;
      expect(categoryPill).toBeTruthy();
      categoryPill!.click();
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.task-quick-add')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
        'Bitte einen Titel eingeben.',
      );
      expect(categoryPill!.getAttribute('aria-pressed')).toBe('true');
      expect(fixture.nativeElement.textContent).not.toContain('Milch kaufen');
    });

    it('defaults a new task to today\'s due date under the "Heute" filter', async () => {
      const { fixture } = setUpWithRealStore();

      await addViaQuickAdd(fixture, 'Heute erledigen');

      // "Heute" is the default filter; a task showing up here without any explicit
      // date input can only do so because it was given today's due date.
      expect(fixture.nativeElement.querySelector('.task-list')?.textContent).toContain(
        'Heute erledigen',
      );
    });

    it('defaults a new task to high priority under the "Wichtig" filter', async () => {
      const { fixture } = setUpWithRealStore();

      const chips = Array.from(
        fixture.nativeElement.querySelectorAll('.app-filter-chip'),
      ) as HTMLButtonElement[];
      chips.find((chip) => chip.textContent?.includes('Wichtig'))?.click();
      fixture.detectChanges();

      await addViaQuickAdd(fixture, 'Dringend klären');

      // Only high-priority tasks show up under "Wichtig"; reaching the list here means
      // it picked up "high" by default even though no priority pill was pressed.
      expect(fixture.nativeElement.querySelector('.task-list')?.textContent).toContain(
        'Dringend klären',
      );
    });
  });

  describe('Detail-/Bearbeitungsansicht (TDP-38)', () => {
    it('opens the detail panel with the clicked card and saves an edit straight to the store', async () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const store = createMockStore([task], [], []);
      const updateSpy = vi.fn();
      store.update = updateSpy;
      const fixture = setUp(store);

      (fixture.nativeElement.querySelector('.app-task-item__content') as HTMLElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const titleField = fixture.nativeElement.querySelector(
        '#task-detail-panel-title',
      ) as HTMLInputElement;
      expect(titleField.value).toBe('Heute fällig');

      fixture.nativeElement
        .querySelector('.task-detail-panel__form')
        ?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(updateSpy).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({ title: 'Heute fällig' }),
      );
      expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();
    });

    it('deletes via the panel using the same undo mechanism as removeTask', () => {
      const task = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
      const store = createMockStore([task], [], []);
      store.remove = () => task;
      const fixture = setUp(store);

      fixture.componentInstance['openTaskDetail'](task.id);
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector('.task-detail-panel__delete') as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();
      expect(fixture.nativeElement.querySelector('.undo-notice')?.textContent).toContain(
        'Heute fällig',
      );
    });
  });
});
