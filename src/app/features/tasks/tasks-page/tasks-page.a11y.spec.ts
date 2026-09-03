import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { Task, createTask } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TasksPageComponent } from './tasks-page.component';

function createMockStore(tasks: Task[] = []): Partial<TaskStoreService> {
  return {
    tasks: signal(tasks),
    openTasks: signal(tasks.filter((task) => !task.completed)),
    toggleCompleted: () => undefined,
    remove: () => undefined,
    restore: () => undefined,
    update: () => undefined,
    add: (input) => createTask(input),
    reset: () => undefined,
  };
}

describe('TasksPageComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for the empty state', async () => {
    TestBed.configureTestingModule({
      imports: [TasksPageComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
    });

    const fixture = TestBed.createComponent(TasksPageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with open and completed tasks', async () => {
    const openTask = createTask({ title: 'Einkaufen', dueDate: null });
    const completedTask: Task = {
      ...createTask({ title: 'Müll rausbringen', dueDate: null }),
      completed: true,
      completedAt: '2026-09-02',
    };

    TestBed.configureTestingModule({
      imports: [TasksPageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore([openTask, completedTask]) },
      ],
    });

    const fixture = TestBed.createComponent(TasksPageComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
