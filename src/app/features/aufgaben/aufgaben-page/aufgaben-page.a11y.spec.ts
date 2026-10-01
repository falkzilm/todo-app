import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { createTask } from '../../../core/models/task.model';
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

describe('AufgabenPageComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for the empty state', async () => {
    TestBed.configureTestingModule({
      imports: [AufgabenPageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore() },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(AufgabenPageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with open and completed tasks', async () => {
    const openTask = createTask({
      title: 'Heute fällig',
      dueDate: '2026-09-02',
      startTime: '09:00',
    });
    const completedTask = {
      ...createTask({ title: 'Milch kaufen', dueDate: '2026-09-02', startTime: '10:00' }),
      completed: true,
    };

    TestBed.configureTestingModule({
      imports: [AufgabenPageComponent],
      providers: [
        {
          provide: TaskStoreService,
          useValue: createMockStore([openTask, completedTask], [], [], 2, 1),
        },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(AufgabenPageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with the detail panel open (TDP-38)', async () => {
    const todayTask = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });

    TestBed.configureTestingModule({
      imports: [AufgabenPageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore([todayTask], [], []) },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(AufgabenPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-task-item__content') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
