import { TestBed } from '@angular/core/testing';
import { getMonthGrid } from '../../../core/date/date-utils';
import { CalendarDate } from '../../../core/models/task.model';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  function setUp(value: CalendarDate | null = null) {
    TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    });

    const fixture = TestBed.createComponent(DatePickerComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();

    return fixture;
  }

  function trigger(fixture: ReturnType<typeof setUp>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.date-picker__trigger');
  }

  function popover(fixture: ReturnType<typeof setUp>): HTMLElement | null {
    return fixture.nativeElement.querySelector('.date-picker__popover');
  }

  function open(fixture: ReturnType<typeof setUp>): void {
    trigger(fixture).click();
    fixture.detectChanges();
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

  it('shows a placeholder and no popover when no date is pre-filled', () => {
    const fixture = setUp();

    expect(trigger(fixture).textContent?.trim()).toBe('Datum wählen');
    expect(popover(fixture)).toBeNull();
  });

  describe('Vorbelegung', () => {
    it('pre-fills the trigger label from the given value', () => {
      const fixture = setUp('2026-09-05');

      expect(trigger(fixture).textContent?.trim()).toBe('5. September 2026');
    });

    it('opens on the month of the pre-filled value with that day marked as selected', () => {
      const fixture = setUp('2026-09-05');

      open(fixture);

      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-05');
      expect(cell.classList.contains('month-grid__day--selected')).toBe(true);
    });
  });

  describe('Auswahl', () => {
    it('emits the clicked day and closes the popover', () => {
      const fixture = setUp('2026-09-05');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.dateSelect.subscribe((date) => emitted.push(date));

      open(fixture);
      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-12');
      cell.click();
      fixture.detectChanges();

      expect(emitted).toEqual(['2026-09-12']);
      expect(popover(fixture)).toBeNull();
    });

    it('emits the focused day when Enter is pressed', () => {
      const fixture = setUp('2026-09-05');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.dateSelect.subscribe((date) => emitted.push(date));

      open(fixture);
      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-05');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(emitted).toEqual(['2026-09-05']);
    });
  });

  describe('Abbruch', () => {
    it('closes on Escape without emitting a selection', () => {
      const fixture = setUp('2026-09-05');
      const emitted: CalendarDate[] = [];
      fixture.componentInstance.dateSelect.subscribe((date) => emitted.push(date));

      open(fixture);
      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-05');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(emitted).toEqual([]);
      expect(popover(fixture)).toBeNull();
      expect(trigger(fixture).textContent?.trim()).toBe('5. September 2026');
    });

    it('returns focus to the trigger after Escape', () => {
      const fixture = setUp('2026-09-05');

      open(fixture);
      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-05');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(trigger(fixture));
    });
  });
});
