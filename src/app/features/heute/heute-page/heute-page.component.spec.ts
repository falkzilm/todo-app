import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTask } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { HeutePageComponent } from './heute-page.component';

function createMockStore(
  todayTasks: ReturnType<typeof createTask>[] = [],
  overdueTasks: ReturnType<typeof createTask>[] = [],
  todayTotalCount = todayTasks.length,
  todayCompletedCount = 0,
): Partial<TaskStoreService> {
  return {
    todayTasks: signal(todayTasks),
    overdueTasks: signal(overdueTasks),
    todayTotalCount: signal(todayTotalCount),
    todayCompletedCount: signal(todayCompletedCount),
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

  describe('Tagesfortschritt', () => {
    it('shows "x von y erledigt" and a progressbar reflecting the completed share', () => {
      TestBed.configureTestingModule({
        imports: [HeutePageComponent],
        providers: [{ provide: TaskStoreService, useValue: createMockStore([], [], 4, 3) }],
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
        providers: [{ provide: TaskStoreService, useValue: createMockStore([], [], 0, 0) }],
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
        providers: [{ provide: TaskStoreService, useValue: store }],
      });

      const fixture = TestBed.createComponent(HeutePageComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('0 von 2 erledigt');

      (store.todayCompletedCount as ReturnType<typeof signal<number>>).set(1);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('1 von 2 erledigt');
    });
  });
});
