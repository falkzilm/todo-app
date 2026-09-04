import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
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

describe('HeutePageComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for the empty state', async () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore() },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with today/overdue/completed tasks and an expanded completed section', () => {
    const todayTask = createTask({ title: 'Heute fällig', dueDate: '2026-09-02' });
    const overdueTask = createTask({ title: 'Überfällig', dueDate: '2026-08-30' });
    const completedTask = createTask({ title: 'Milch kaufen', dueDate: '2026-09-02' });

    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [
        {
          provide: TaskStoreService,
          useValue: createMockStore([todayTask], [overdueTask], 2, 1, [completedTask]),
        },
        { provide: STORAGE, useValue: createMockStorage() },
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.heute-page__completed-toggle',
    );
    toggle.click();
    fixture.detectChanges();

    return expectNoA11yViolations(fixture.nativeElement);
  });
});
