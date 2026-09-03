import { Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import {
  CalendarDate,
  Task,
  createTask,
  todayAsCalendarDate,
} from '../../../core/models/task.model';
import { DayTaskSummary, TaskStoreService } from '../../../core/services/task-store.service';
import { CalendarPageComponent } from './calendar-page.component';

function createMockStore(
  taskSummaryByDate: ReadonlyMap<CalendarDate, DayTaskSummary> = new Map(),
  tasks: Task[] = [],
): Partial<TaskStoreService> {
  return {
    taskSummaryByDate: signal(taskSummaryByDate),
    tasksForDate: (date: CalendarDate): Signal<Task[]> =>
      computed(() => tasks.filter((task) => task.dueDate === date)),
    toggleCompleted: () => undefined,
    remove: () => undefined,
    update: () => undefined,
    add: (input) => createTask(input),
  };
}

describe('CalendarPageComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for an empty month', async () => {
    TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
    });

    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with tasks on the selected day', async () => {
    const today = todayAsCalendarDate();
    const task = createTask({ title: 'Abhaken', dueDate: today });

    TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [
        {
          provide: TaskStoreService,
          useValue: createMockStore(new Map([[today, { openCount: 1, allCompleted: false }]]), [
            task,
          ]),
        },
      ],
    });

    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
