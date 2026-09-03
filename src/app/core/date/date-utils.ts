import { CalendarDate, toCalendarDate } from '../models/task.model';

const DAYS_PER_WEEK = 7;
const WEEKS_IN_GRID = 6;

export interface MonthGridDay {
  readonly date: CalendarDate;
  readonly dayOfMonth: number;
  readonly inCurrentMonth: boolean;
}

/**
 * Builds a fixed 6x7 grid of days for the month containing `reference`, with weeks
 * starting on Monday. Always returns exactly 42 days, padded with the trailing days
 * of the previous month and the leading days of the next month as needed.
 */
export function getMonthGrid(reference: Date): MonthGridDay[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = toMondayFirstWeekday(firstOfMonth.getDay());
  const gridStart = new Date(year, month, 1 - leadingDays);

  return Array.from({ length: WEEKS_IN_GRID * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );

    return {
      date: toCalendarDate(date),
      dayOfMonth: date.getDate(),
      inCurrentMonth: date.getFullYear() === year && date.getMonth() === month,
    };
  });
}

/** Converts JS's Sunday-first `Date#getDay()` (0-6) into a Monday-first offset (0-6). */
function toMondayFirstWeekday(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Compares two dates as calendar days (year/month/day in local time), ignoring the
 * time of day. Unlike comparing `Date#getTime()` or `Date#toISOString()` (both
 * UTC-based), this stays correct across timezones and daylight-saving changeovers.
 */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return toCalendarDate(a) === toCalendarDate(b);
}

/**
 * Groups items by calendar date, e.g. tasks by due date. Items for which `dateOf`
 * returns `null` are omitted; insertion order is preserved within each group.
 */
export function groupByCalendarDate<T>(
  items: readonly T[],
  dateOf: (item: T) => CalendarDate | null,
): Map<CalendarDate, T[]> {
  const groups = new Map<CalendarDate, T[]>();

  for (const item of items) {
    const date = dateOf(item);
    if (date === null) {
      continue;
    }

    const group = groups.get(date);
    if (group) {
      group.push(item);
    } else {
      groups.set(date, [item]);
    }
  }

  return groups;
}
