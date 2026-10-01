import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { createTask } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { NotificationBellComponent } from './notification-bell.component';

function createMockStore(
  overdueTasks: ReturnType<typeof createTask>[] = [],
  todayTasks: ReturnType<typeof createTask>[] = [],
): Partial<TaskStoreService> {
  return {
    overdueTasks: signal(overdueTasks),
    todayTasks: signal(todayTasks),
  };
}

describe('NotificationBellComponent a11y', () => {
  it('has no WCAG 2 A/AA violations with no hints', async () => {
    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
    });
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with the popover open and hints listed', async () => {
    const overdue = createTask({ title: 'Rechnung prüfen', dueDate: '2026-08-20' });
    const dueToday = createTask({
      title: 'Teammeeting',
      dueDate: '2026-09-02',
      startTime: '09:00',
    });
    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore([overdue], [dueToday]) }],
    });
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with the popover open and an empty state', async () => {
    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
    });
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
