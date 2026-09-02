import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTask } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { HeutePageComponent } from './heute-page.component';

function createMockStore(
  todayTasks: ReturnType<typeof createTask>[] = [],
  overdueTasks: ReturnType<typeof createTask>[] = [],
): Partial<TaskStoreService> {
  return {
    todayTasks: signal(todayTasks),
    overdueTasks: signal(overdueTasks),
    remove: () => undefined,
  };
}

describe('HeutePageComponent', () => {
  it('renders with a mocked store without error', () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('shows the current date, correctly formatted', () => {
    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore() }],
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
      providers: [{ provide: TaskStoreService, useValue: createMockStore([], []) }],
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
      ],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Heute fällig');
    expect(text).toContain('Überfällig');
    expect(text).not.toContain('Heute steht nichts an.');
  });
});
