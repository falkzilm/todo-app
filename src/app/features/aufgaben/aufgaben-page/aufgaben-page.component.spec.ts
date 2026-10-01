import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
    tasks: signal([...tasksToday, ...tasksThisWeek, ...importantTasks]),
    tasksToday: signal(tasksToday),
    tasksThisWeek: signal(tasksThisWeek),
    importantTasks: signal(importantTasks),
    todayTotalCount: signal(todayTotalCount),
    todayCompletedCount: signal(todayCompletedCount),
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
      provideRouter([]),
      provideLocationMocks(),
    ],
  });

  const fixture = TestBed.createComponent(AufgabenPageComponent);
  fixture.detectChanges();
  return fixture;
}

async function setUpWithUrl(
  initialUrl: string,
  store: Partial<TaskStoreService> = createMockStore(),
) {
  TestBed.configureTestingModule({
    providers: [
      { provide: TaskStoreService, useValue: store },
      { provide: STORAGE, useValue: createMockStorage() },
      provideRouter([{ path: '**', component: AufgabenPageComponent }]),
      provideLocationMocks(),
    ],
  });

  const harness = await RouterTestingHarness.create(initialUrl);
  harness.detectChanges();
  return harness;
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

  it('switches the rendered list and empty state when a different filter is selected', async () => {
    const importantTask = createTask({ title: 'Design-Review', priority: 'high' });
    const fixture = setUp(createMockStore([], [], [importantTask]));

    expect(fixture.nativeElement.textContent).toContain('Heute steht nichts an.');

    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    const wichtigChip = chips.find((chip) => chip.textContent?.includes('Wichtig'));
    wichtigChip?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Design-Review');
    expect(fixture.nativeElement.textContent).not.toContain('Heute steht nichts an.');
  });

  it('shows exactly the "Diese Woche" filter\'s tasks and marks its chip active', async () => {
    const weekTask = createTask({ title: 'Projektabschluss', dueDate: '2026-09-05' });
    const fixture = setUp(createMockStore([], [weekTask], []));

    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    const wocheChip = chips.find((chip) => chip.textContent?.includes('Diese Woche'));
    wocheChip?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Projektabschluss');
    expect(fixture.nativeElement.textContent).not.toContain('Heute steht nichts an.');
    const updatedChips = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    expect(updatedChips[1].getAttribute('aria-pressed')).toBe('true');
    expect(updatedChips[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('shows exactly the "Heute" filter\'s tasks by default, excluding other filters\' tasks', () => {
    const todayTask = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
    const weekTask = createTask({ title: 'Diese-Woche-Aufgabe', dueDate: '2026-09-05' });
    const importantTask = createTask({ title: 'Wichtige Aufgabe', priority: 'high' });
    const fixture = setUp(createMockStore([todayTask], [weekTask], [importantTask]));

    expect(fixture.nativeElement.textContent).toContain('Heute fällig');
    expect(fixture.nativeElement.textContent).not.toContain('Diese-Woche-Aufgabe');
    expect(fixture.nativeElement.textContent).not.toContain('Wichtige Aufgabe');
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

  describe('Filterleiste in der URL (TDP-36)', () => {
    it('defaults to "today" when no filter query param is present', async () => {
      const harness = await setUpWithUrl('/');

      const chips = Array.from(
        harness.routeNativeElement!.querySelectorAll('.app-filter-chip'),
      ) as HTMLButtonElement[];
      const heuteChip = chips.find((chip) => chip.textContent?.includes('Heute'));

      expect(heuteChip?.getAttribute('aria-pressed')).toBe('true');
    });

    it('restores the filter from an existing query param (reload)', async () => {
      const importantTask = createTask({ title: 'Design-Review', priority: 'high' });
      const harness = await setUpWithUrl(
        '/?filter=important',
        createMockStore([], [], [importantTask]),
      );

      expect(harness.routeNativeElement?.textContent).toContain('Design-Review');
      const chips = Array.from(
        harness.routeNativeElement!.querySelectorAll('.app-filter-chip'),
      ) as HTMLButtonElement[];
      const wichtigChip = chips.find((chip) => chip.textContent?.includes('Wichtig'));
      expect(wichtigChip?.getAttribute('aria-pressed')).toBe('true');
    });

    it('falls back to "today" for an unknown filter value', async () => {
      const harness = await setUpWithUrl('/?filter=unbekannt');

      const chips = Array.from(
        harness.routeNativeElement!.querySelectorAll('.app-filter-chip'),
      ) as HTMLButtonElement[];
      const heuteChip = chips.find((chip) => chip.textContent?.includes('Heute'));
      expect(heuteChip?.getAttribute('aria-pressed')).toBe('true');
    });

    it('mirrors the clicked filter into the URL', async () => {
      const importantTask = createTask({ title: 'Design-Review', priority: 'high' });
      const harness = await setUpWithUrl('/', createMockStore([], [], [importantTask]));

      const chips = Array.from(
        harness.routeNativeElement!.querySelectorAll('.app-filter-chip'),
      ) as HTMLButtonElement[];
      const wichtigChip = chips.find((chip) => chip.textContent?.includes('Wichtig'));
      wichtigChip?.click();
      harness.detectChanges();
      await harness.fixture.whenStable();

      expect(TestBed.inject(Router).url).toContain('filter=important');
    });
  });

  describe('Sliders-Popover (TDP-36)', () => {
    function openMenu(fixture: ReturnType<typeof setUp>): HTMLButtonElement {
      const trigger = fixture.nativeElement.querySelector(
        '.app-filter-chip-icon',
      ) as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      return trigger;
    }

    it('toggles aria-expanded and aria-controls on the trigger', () => {
      const fixture = setUp();
      const trigger = fixture.nativeElement.querySelector(
        '.app-filter-chip-icon',
      ) as HTMLButtonElement;

      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      trigger.click();
      fixture.detectChanges();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const controlsId = trigger.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${controlsId}`)).not.toBeNull();
    });

    it('closes on Escape and returns focus to the trigger', () => {
      const fixture = setUp();
      const trigger = openMenu(fixture);

      const popover = fixture.nativeElement.querySelector('.task-filter-bar__popover');
      popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.task-filter-bar__popover')).toBeNull();
      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(trigger);
    });

    it('hiding completed tasks visibly narrows the list', () => {
      const openTask = createTask({ title: 'Offene Aufgabe', dueDate: '2026-09-02' });
      const completedTask = {
        ...createTask({ title: 'Erledigte Aufgabe', dueDate: '2026-09-02' }),
        completed: true,
      };
      const fixture = setUp(createMockStore([openTask, completedTask], [], []));
      openMenu(fixture);

      const toggle = fixture.nativeElement.querySelector(
        '.task-filter-bar__toggle input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(fixture.nativeElement.textContent).toContain('Erledigte Aufgabe');

      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Offene Aufgabe');
      expect(fixture.nativeElement.textContent).not.toContain('Erledigte Aufgabe');
    });

    it('sorting by title visibly reorders the list', () => {
      const taskB = createTask({ title: 'B-Aufgabe', dueDate: '2026-09-02', startTime: '09:00' });
      const taskA = createTask({ title: 'A-Aufgabe', dueDate: '2026-09-02', startTime: '10:00' });
      const fixture = setUp(createMockStore([taskB, taskA], [], []));
      openMenu(fixture);

      const titlePill = Array.from(
        fixture.nativeElement.querySelectorAll('.task-filter-bar__pill'),
      ).find((pill) => (pill as HTMLElement).textContent?.trim() === 'Titel') as HTMLButtonElement;
      titlePill.click();
      fixture.detectChanges();

      const items = Array.from(
        fixture.nativeElement.querySelectorAll('.task-list > li'),
      ) as HTMLElement[];
      expect(items.map((item) => item.textContent)).toEqual([
        expect.stringContaining('A-Aufgabe'),
        expect.stringContaining('B-Aufgabe'),
      ]);
    });

    it('filtering by category visibly narrows the list', () => {
      const arbeit = createTask({
        title: 'Arbeitsaufgabe',
        dueDate: '2026-09-02',
        categoryId: 'arbeit',
      });
      const privat = createTask({
        title: 'Privataufgabe',
        dueDate: '2026-09-02',
        categoryId: 'privat',
      });
      const fixture = setUp(createMockStore([arbeit, privat], [], []));
      openMenu(fixture);

      const categoryPill = Array.from(
        fixture.nativeElement.querySelectorAll('.task-filter-bar__pill'),
      ).find((pill) => (pill as HTMLElement).textContent?.trim() === 'Arbeit') as HTMLButtonElement;
      categoryPill.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Arbeitsaufgabe');
      expect(fixture.nativeElement.textContent).not.toContain('Privataufgabe');
    });
  });
});
