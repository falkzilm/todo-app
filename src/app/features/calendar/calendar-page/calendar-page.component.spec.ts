import { Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMonthGrid } from '../../../core/date/date-utils';
import {
  CalendarDate,
  Task,
  createTask,
  toCalendarDate,
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
  };
}

describe('CalendarPageComponent', () => {
  function setUp(taskSummaryByDate?: ReadonlyMap<CalendarDate, DayTaskSummary>, tasks?: Task[]) {
    TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [
        { provide: TaskStoreService, useValue: createMockStore(taskSummaryByDate, tasks) },
      ],
    });

    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the current month and year', () => {
    const fixture = setUp();

    const expectedLabel = new Date().toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    });
    expect(fixture.nativeElement.querySelector('.calendar-nav__label').textContent).toContain(
      expectedLabel,
    );
  });

  it('renders 42 day cells for the current month', () => {
    const fixture = setUp();

    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
  });

  it('highlights today in the grid', () => {
    const fixture = setUp();

    expect(fixture.nativeElement.querySelector('.month-grid__day--today')).not.toBeNull();
  });

  it('navigates to the previous and next month, updating the label', () => {
    const fixture = setUp();
    const label = () => fixture.nativeElement.querySelector('.calendar-nav__label').textContent;
    const initialLabel = label();

    const [previousButton, nextButton] = fixture.nativeElement.querySelectorAll('button');

    nextButton.click();
    fixture.detectChanges();
    expect(label()).not.toBe(initialLabel);

    previousButton.click();
    fixture.detectChanges();
    expect(label()).toBe(initialLabel);
  });

  it('jumps back to the current month via the "Heute" button', () => {
    const fixture = setUp();
    const label = () => fixture.nativeElement.querySelector('.calendar-nav__label').textContent;
    const initialLabel = label();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const nextButton = buttons[1];
    const todayButton = buttons.find((button) => button.textContent?.trim() === 'Heute')!;

    nextButton.click();
    fixture.detectChanges();
    expect(label()).not.toBe(initialLabel);

    todayButton.click();
    fixture.detectChanges();
    expect(label()).toBe(initialLabel);
  });

  it('passes the task summaries from the store through to the month grid', () => {
    const today = todayAsCalendarDate();
    const fixture = setUp(new Map([[today, { openCount: 2, allCompleted: false }]]));

    const todayCell = (
      Array.from(fixture.nativeElement.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
    ).find((cell) => cell.classList.contains('month-grid__day--today'))!;

    expect(todayCell.querySelector('.month-grid__indicator--open')?.textContent?.trim()).toBe('2');
    expect(todayCell.getAttribute('aria-label')).toContain('2 offene Aufgaben');
  });

  describe('Tagesauswahl', () => {
    /** A day in the currently displayed month other than today, to select in tests. */
    function anotherDayThisMonth(): CalendarDate {
      const today = new Date();
      const day = today.getDate() === 1 ? 2 : 1;
      return toCalendarDate(new Date(today.getFullYear(), today.getMonth(), day));
    }

    function cellForDate(fixture: ReturnType<typeof setUp>, date: CalendarDate): HTMLElement {
      const index = getMonthGrid(new Date()).findIndex((day) => day.date === date);
      return (
        Array.from(fixture.nativeElement.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
      )[index];
    }

    function taskListItems(fixture: ReturnType<typeof setUp>): HTMLElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('.calendar-page__day .app-task-item'),
      );
    }

    it('preselects today when the calendar view is opened', () => {
      const fixture = setUp();

      const todayCell = fixture.nativeElement.querySelector('.month-grid__day--today');
      expect(todayCell.getAttribute('aria-selected')).toBe('true');
    });

    it('selects a day on click and shows its tasks', () => {
      const otherDate = anotherDayThisMonth();
      const otherTask = createTask({ title: 'Anderer Tag', dueDate: otherDate });
      const fixture = setUp(undefined, [otherTask]);

      const otherCell = cellForDate(fixture, otherDate);
      otherCell.click();
      fixture.detectChanges();

      expect(otherCell.getAttribute('aria-selected')).toBe('true');
      const todayCell = fixture.nativeElement.querySelector('.month-grid__day--today');
      expect(todayCell.getAttribute('aria-selected')).not.toBe('true');
      expect(fixture.nativeElement.textContent).toContain('Anderer Tag');
    });

    it('selects a day on Enter and shows its tasks', () => {
      const otherDate = anotherDayThisMonth();
      const otherTask = createTask({ title: 'Per Enter ausgewählt', dueDate: otherDate });
      const fixture = setUp(undefined, [otherTask]);

      const otherCell = cellForDate(fixture, otherDate);
      otherCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(otherCell.getAttribute('aria-selected')).toBe('true');
      expect(fixture.nativeElement.textContent).toContain('Per Enter ausgewählt');
    });

    it('shows an empty state with a hint to create a task for a day without tasks', () => {
      const fixture = setUp();

      expect(taskListItems(fixture)).toHaveLength(0);
      expect(
        fixture.nativeElement.querySelector('.calendar-page__empty-state')?.textContent,
      ).toContain('Lege');
    });

    it('toggling a task in the day list is backed by the shared task store', () => {
      const today = todayAsCalendarDate();
      const task = createTask({ title: 'Abhaken', dueDate: today });
      const store = createMockStore(undefined, [task]);
      const toggleSpy = vi.fn();
      store.toggleCompleted = toggleSpy;

      TestBed.configureTestingModule({
        imports: [CalendarPageComponent],
        providers: [{ provide: TaskStoreService, useValue: store }],
      });
      const fixture = TestBed.createComponent(CalendarPageComponent);
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector(
        '.calendar-page__day .app-task-item input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.click();

      expect(toggleSpy).toHaveBeenCalledWith(task.id);
    });
  });
});
