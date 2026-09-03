import { TestBed } from '@angular/core/testing';
import { getMonthGrid } from '../../../core/date/date-utils';
import { CalendarDate, TASK_DRAG_DATA_FORMAT } from '../../../core/models/task.model';
import { DayTaskSummary } from '../../../core/services/task-store.service';
import { MonthGridComponent } from './month-grid.component';

/**
 * jsdom does not implement `DataTransfer`, so drag events in tests carry a
 * minimal stand-in exposing just the members the component reads/writes.
 */
function createDataTransfer(data: Record<string, string> = {}): DataTransfer {
  const store = new Map(Object.entries(data));
  return {
    setData: (format: string, value: string) => store.set(format, value),
    getData: (format: string) => store.get(format) ?? '',
    get types() {
      return Array.from(store.keys());
    },
    dropEffect: 'none',
    effectAllowed: 'uninitialized',
  } as unknown as DataTransfer;
}

function dragEvent(type: string, dataTransfer: DataTransfer): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  return event;
}

describe('MonthGridComponent', () => {
  function setUp(
    referenceDate: Date,
    today = '2026-09-02',
    taskSummaries?: ReadonlyMap<CalendarDate, DayTaskSummary>,
    selected?: CalendarDate,
  ) {
    TestBed.configureTestingModule({
      imports: [MonthGridComponent],
    });

    const fixture = TestBed.createComponent(MonthGridComponent);
    fixture.componentRef.setInput('days', getMonthGrid(referenceDate));
    fixture.componentRef.setInput('label', 'Kalender September 2026');
    fixture.componentRef.setInput('today', today);
    if (taskSummaries) {
      fixture.componentRef.setInput('taskSummaries', taskSummaries);
    }
    if (selected) {
      fixture.componentRef.setInput('selected', selected);
    }
    fixture.detectChanges();

    return fixture;
  }

  function cellFor(
    fixture: ReturnType<typeof setUp>,
    referenceDate: Date,
    date: CalendarDate,
  ): HTMLElement {
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    const index = getMonthGrid(referenceDate).findIndex((day) => day.date === date);
    return cells[index];
  }

  it('renders 42 day cells, labeled as a grid for screen readers', () => {
    const fixture = setUp(new Date(2026, 8, 1));

    const grid = fixture.nativeElement.querySelector('[role="grid"]');
    expect(grid.getAttribute('aria-label')).toBe('Kalender September 2026');
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    expect(fixture.nativeElement.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
  });

  it('renders weekday headers starting on Monday', () => {
    const fixture = setUp(new Date(2026, 8, 1));

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('[role="columnheader"]'),
    ) as HTMLElement[];
    expect(headers.map((header) => header.textContent?.trim())).toEqual([
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
      'So',
    ]);
  });

  it('marks days outside the current month as muted', () => {
    const fixture = setUp(new Date(2026, 8, 1));

    // September 2026 starts on a Tuesday, so the first cell is 31 August.
    const cells = fixture.nativeElement.querySelectorAll('[role="gridcell"]');
    expect(cells[0].textContent?.trim()).toBe('31');
    expect(cells[0].classList.contains('month-grid__day--muted')).toBe(true);
    expect(cells[1].textContent?.trim()).toBe('1');
    expect(cells[1].classList.contains('month-grid__day--muted')).toBe(false);
  });

  it('highlights today with aria-current and a dedicated class', () => {
    const fixture = setUp(new Date(2026, 8, 1), '2026-09-02');

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    const todayCell = cells.find((cell) => cell.getAttribute('aria-label')?.includes('heute'));

    expect(todayCell?.textContent?.trim()).toBe('2');
    expect(todayCell?.classList.contains('month-grid__day--today')).toBe(true);
    expect(todayCell?.getAttribute('aria-current')).toBe('date');
  });

  it('gives exactly one cell a tabindex of 0, defaulting to today', () => {
    const fixture = setUp(new Date(2026, 8, 1), '2026-09-02');

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    const tabbable = cells.filter((cell) => cell.getAttribute('tabindex') === '0');

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].textContent?.trim()).toBe('2');
    expect(
      cells.every(
        (cell) => cell.getAttribute('tabindex') === '0' || cell.getAttribute('tabindex') === '-1',
      ),
    ).toBe(true);
  });

  it('defaults the roving tabindex to the first day of the month when today is outside the grid', () => {
    const fixture = setUp(new Date(2026, 8, 1), '2099-01-01');

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    const tabbable = cells.find((cell) => cell.getAttribute('tabindex') === '0');

    expect(tabbable?.textContent?.trim()).toBe('1');
  });

  it('moves the roving tabindex and DOM focus with the arrow keys', () => {
    const fixture = setUp(new Date(2026, 8, 1), '2026-09-02');

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    const startCell = cells.find((cell) => cell.getAttribute('tabindex') === '0')!;
    expect(startCell.textContent?.trim()).toBe('2');

    startCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(startCell.getAttribute('tabindex')).toBe('-1');
    const nextCell = cells[cells.indexOf(startCell) + 1];
    expect(nextCell.getAttribute('tabindex')).toBe('0');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(nextCell);
  });

  it('does not move past the start of the grid', () => {
    const fixture = setUp(new Date(2026, 8, 1), '2026-09-02');
    const document = fixture.nativeElement.ownerDocument as Document;

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
    ) as HTMLElement[];
    let active = cells.find((cell) => cell.getAttribute('tabindex') === '0')!;

    for (let i = 0; i < 10; i++) {
      active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      fixture.detectChanges();
      active = document.activeElement as HTMLElement;
    }

    expect(cells[0].getAttribute('tabindex')).toBe('0');
    expect(active).toBe(cells[0]);
  });

  describe('day selection', () => {
    const referenceDate = new Date(2026, 8, 1);

    it('marks the selected day with a class and aria-selected', () => {
      const fixture = setUp(referenceDate, '2026-09-02', undefined, '2026-09-05');

      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      expect(cell.classList.contains('month-grid__day--selected')).toBe(true);
      expect(cell.getAttribute('aria-selected')).toBe('true');

      const otherCell = cellFor(fixture, referenceDate, '2026-09-02');
      expect(otherCell.classList.contains('month-grid__day--selected')).toBe(false);
      expect(otherCell.getAttribute('aria-selected')).toBeNull();
    });

    it('emits daySelect and moves the roving tabindex when a day is clicked', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.daySelect.subscribe((date) => emitted.push(date));

      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      cell.click();
      fixture.detectChanges();

      expect(emitted).toEqual(['2026-09-05']);
      expect(cell.getAttribute('tabindex')).toBe('0');
    });

    it('emits daySelect when Enter is pressed on a focused day', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.daySelect.subscribe((date) => emitted.push(date));

      const cell = cellFor(fixture, referenceDate, '2026-09-02');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(emitted).toEqual(['2026-09-02']);
    });

    it('emits daySelect when Space is pressed on a focused day', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.daySelect.subscribe((date) => emitted.push(date));

      const cell = cellFor(fixture, referenceDate, '2026-09-02');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();

      expect(emitted).toEqual(['2026-09-02']);
    });
  });

  describe('task indicators', () => {
    const referenceDate = new Date(2026, 8, 1);

    it('shows a count badge for days with open tasks', () => {
      const fixture = setUp(
        referenceDate,
        '2026-09-02',
        new Map([['2026-09-05', { openCount: 3, allCompleted: false }]]),
      );

      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const badge = cell.querySelector('.month-grid__indicator--open');

      expect(badge?.textContent?.trim()).toBe('3');
      expect(cell.querySelector('.month-grid__indicator--done')).toBeNull();
    });

    it('marks the aria-label of a day with open tasks for screen readers', () => {
      const fixture = setUp(
        referenceDate,
        '2026-09-02',
        new Map([['2026-09-05', { openCount: 3, allCompleted: false }]]),
      );

      const cell = cellFor(fixture, referenceDate, '2026-09-05');

      expect(cell.getAttribute('aria-label')).toContain('3 offene Aufgaben');
    });

    it('shows a dedicated indicator, distinct from the open-task badge, for fully completed days', () => {
      const fixture = setUp(
        referenceDate,
        '2026-09-02',
        new Map([['2026-09-05', { openCount: 0, allCompleted: true }]]),
      );

      const cell = cellFor(fixture, referenceDate, '2026-09-05');

      expect(cell.querySelector('.month-grid__indicator--done')).not.toBeNull();
      expect(cell.querySelector('.month-grid__indicator--open')).toBeNull();
      expect(cell.getAttribute('aria-label')).toContain('alle Aufgaben erledigt');
    });

    it('shows no indicator for days without any tasks', () => {
      const fixture = setUp(referenceDate, '2026-09-02');

      const cell = cellFor(fixture, referenceDate, '2026-09-05');

      expect(cell.querySelector('.month-grid__indicator')).toBeNull();
    });
  });

  describe('Umplanen per Drag & Drop', () => {
    const referenceDate = new Date(2026, 8, 1);

    it('highlights a cell while a task is dragged over it', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const dataTransfer = createDataTransfer({ [TASK_DRAG_DATA_FORMAT]: 'task-1' });

      const event = dragEvent('dragover', dataTransfer);
      const preventDefault = vi.spyOn(event, 'preventDefault');
      cell.dispatchEvent(event);
      fixture.detectChanges();

      expect(preventDefault).toHaveBeenCalled();
      expect(cell.classList.contains('month-grid__day--drag-over')).toBe(true);
    });

    it('ignores a drag that does not carry a task id', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const dataTransfer = createDataTransfer({ 'text/plain': 'irrelevant' });

      const event = dragEvent('dragover', dataTransfer);
      const preventDefault = vi.spyOn(event, 'preventDefault');
      cell.dispatchEvent(event);
      fixture.detectChanges();

      expect(preventDefault).not.toHaveBeenCalled();
      expect(cell.classList.contains('month-grid__day--drag-over')).toBe(false);
    });

    it('removes the highlight once the drag leaves the cell', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const dataTransfer = createDataTransfer({ [TASK_DRAG_DATA_FORMAT]: 'task-1' });

      cell.dispatchEvent(dragEvent('dragover', dataTransfer));
      fixture.detectChanges();
      expect(cell.classList.contains('month-grid__day--drag-over')).toBe(true);

      cell.dispatchEvent(dragEvent('dragleave', dataTransfer));
      fixture.detectChanges();
      expect(cell.classList.contains('month-grid__day--drag-over')).toBe(false);
    });

    it('emits taskDrop with the dragged task id and the target date, and clears the highlight', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const dataTransfer = createDataTransfer({ [TASK_DRAG_DATA_FORMAT]: 'task-1' });
      const emitted: { taskId: string; date: CalendarDate }[] = [];
      fixture.componentInstance.taskDrop.subscribe((value) => emitted.push(value));

      cell.dispatchEvent(dragEvent('dragover', dataTransfer));
      fixture.detectChanges();
      cell.dispatchEvent(dragEvent('drop', dataTransfer));
      fixture.detectChanges();

      expect(emitted).toEqual([{ taskId: 'task-1', date: '2026-09-05' }]);
      expect(cell.classList.contains('month-grid__day--drag-over')).toBe(false);
    });

    it('does not emit taskDrop when the dropped data has no task id', () => {
      const fixture = setUp(referenceDate, '2026-09-02');
      const cell = cellFor(fixture, referenceDate, '2026-09-05');
      const dataTransfer = createDataTransfer();
      const emitted: { taskId: string; date: CalendarDate }[] = [];
      fixture.componentInstance.taskDrop.subscribe((value) => emitted.push(value));

      cell.dispatchEvent(dragEvent('drop', dataTransfer));
      fixture.detectChanges();

      expect(emitted).toEqual([]);
    });
  });
});
