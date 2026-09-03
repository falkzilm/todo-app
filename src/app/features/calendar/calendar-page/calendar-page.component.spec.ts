import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CalendarDate, todayAsCalendarDate } from '../../../core/models/task.model';
import { DayTaskSummary, TaskStoreService } from '../../../core/services/task-store.service';
import { CalendarPageComponent } from './calendar-page.component';

function createMockStore(
  taskSummaryByDate: ReadonlyMap<CalendarDate, DayTaskSummary> = new Map(),
): Partial<TaskStoreService> {
  return {
    taskSummaryByDate: signal(taskSummaryByDate),
  };
}

describe('CalendarPageComponent', () => {
  function setUp(taskSummaryByDate?: ReadonlyMap<CalendarDate, DayTaskSummary>) {
    TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [{ provide: TaskStoreService, useValue: createMockStore(taskSummaryByDate) }],
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
});
