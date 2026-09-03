import { getMonthGrid, groupByCalendarDate, isSameCalendarDay } from './date-utils';

describe('getMonthGrid', () => {
  it('returns a full 6x7 grid of 42 days', () => {
    const grid = getMonthGrid(new Date(2026, 8, 1)); // September 2026

    expect(grid).toHaveLength(42);
  });

  it('starts the grid on a Monday', () => {
    const grid = getMonthGrid(new Date(2026, 8, 1));

    expect(new Date(`${grid[0].date}T00:00:00`).getDay()).toBe(1);
  });

  it('includes the trailing days of the previous month to fill the first week', () => {
    // September 2026 starts on a Tuesday, so the grid should lead with 31 Aug.
    const grid = getMonthGrid(new Date(2026, 8, 1));

    expect(grid[0]).toEqual({ date: '2026-08-31', dayOfMonth: 31, inCurrentMonth: false });
    expect(grid[1]).toEqual({ date: '2026-09-01', dayOfMonth: 1, inCurrentMonth: true });
  });

  it('includes the leading days of the next month to fill the last week', () => {
    // The grid always spans exactly 6 Monday-to-Sunday weeks, so it ends on a Sunday.
    const grid = getMonthGrid(new Date(2026, 8, 1));
    const lastDay = grid[grid.length - 1];

    expect(lastDay).toEqual({ date: '2026-10-11', dayOfMonth: 11, inCurrentMonth: false });
    expect(new Date(`${lastDay.date}T00:00:00`).getDay()).toBe(0);
  });

  it('contains 42 consecutive, gap-free days with no duplicates', () => {
    const grid = getMonthGrid(new Date(2026, 8, 1));
    const dates = grid.map((day) => day.date);

    expect(new Set(dates).size).toBe(42);
    for (let i = 1; i < dates.length; i++) {
      const previous = new Date(`${dates[i - 1]}T00:00:00`);
      const current = new Date(`${dates[i]}T00:00:00`);
      const diffInDays = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffInDays).toBe(1);
    }
  });

  it('marks exactly the days belonging to the reference month as inCurrentMonth', () => {
    const grid = getMonthGrid(new Date(2026, 8, 1));
    const currentMonthDays = grid.filter((day) => day.inCurrentMonth);

    expect(currentMonthDays).toHaveLength(30);
    expect(currentMonthDays[0].date).toBe('2026-09-01');
    expect(currentMonthDays[currentMonthDays.length - 1].date).toBe('2026-09-30');
  });

  it('handles a month that starts on a Monday without leading padding', () => {
    // June 2026 starts on a Monday.
    const grid = getMonthGrid(new Date(2026, 5, 1));

    expect(grid[0]).toEqual({ date: '2026-06-01', dayOfMonth: 1, inCurrentMonth: true });
  });

  it('includes 29 February for a leap year', () => {
    // 2028 is a leap year.
    const grid = getMonthGrid(new Date(2028, 1, 1));
    const feb29 = grid.find((day) => day.date === '2028-02-29');

    expect(feb29).toEqual({ date: '2028-02-29', dayOfMonth: 29, inCurrentMonth: true });
  });

  it('does not include 29 February for a non-leap year', () => {
    // 2026 is not a leap year, so February has 28 days.
    const grid = getMonthGrid(new Date(2026, 1, 1));
    const currentMonthDays = grid.filter((day) => day.inCurrentMonth);

    expect(currentMonthDays).toHaveLength(28);
    expect(grid.some((day) => day.date === '2026-02-29')).toBe(false);
  });

  it('produces a gap-free grid across the spring daylight-saving changeover', () => {
    // Clocks in Germany move forward on the last Sunday of March (29 March 2026).
    const grid = getMonthGrid(new Date(2026, 2, 1));
    const dates = grid.map((day) => day.date);

    expect(new Set(dates).size).toBe(42);
    expect(dates).toContain('2026-03-29');
  });

  it('produces a gap-free grid across the autumn daylight-saving changeover', () => {
    // Clocks in Germany move back on the last Sunday of October (25 October 2026).
    const grid = getMonthGrid(new Date(2026, 9, 1));
    const dates = grid.map((day) => day.date);

    expect(new Set(dates).size).toBe(42);
    expect(dates).toContain('2026-10-25');
  });
});

describe('isSameCalendarDay', () => {
  it('returns true for the same day at different times', () => {
    const morning = new Date(2026, 8, 2, 6, 0, 0);
    const night = new Date(2026, 8, 2, 23, 59, 59);

    expect(isSameCalendarDay(morning, night)).toBe(true);
  });

  it('returns false for two different days', () => {
    const today = new Date(2026, 8, 2, 23, 59, 59);
    const tomorrow = new Date(2026, 8, 3, 0, 0, 1);

    expect(isSameCalendarDay(today, tomorrow)).toBe(false);
  });

  it('returns false across a month change even when close in time', () => {
    const endOfMonth = new Date(2026, 7, 31, 23, 59, 59);
    const startOfMonth = new Date(2026, 8, 1, 0, 0, 1);

    expect(isSameCalendarDay(endOfMonth, startOfMonth)).toBe(false);
  });

  it('correctly compares 29 February in a leap year', () => {
    const morning = new Date(2028, 1, 29, 1, 0, 0);
    const evening = new Date(2028, 1, 29, 22, 0, 0);

    expect(isSameCalendarDay(morning, evening)).toBe(true);
  });

  it('treats the spring DST changeover day as a single calendar day', () => {
    // 2026-03-29: clocks jump from 02:00 to 03:00 local time in Germany, so
    // this day has only 23 hours; both timestamps must still count as "today".
    const beforeChangeover = new Date(2026, 2, 29, 1, 30, 0);
    const afterChangeover = new Date(2026, 2, 29, 22, 0, 0);

    expect(isSameCalendarDay(beforeChangeover, afterChangeover)).toBe(true);
  });

  it('treats the autumn DST changeover day as a single calendar day', () => {
    // 2026-10-25: clocks fall back from 03:00 to 02:00 local time in Germany,
    // so this day has 25 hours; both timestamps must still count as "today".
    const beforeChangeover = new Date(2026, 9, 25, 2, 30, 0);
    const afterChangeover = new Date(2026, 9, 25, 23, 0, 0);

    expect(isSameCalendarDay(beforeChangeover, afterChangeover)).toBe(true);
  });
});

describe('groupByCalendarDate', () => {
  interface Item {
    readonly id: string;
    readonly dueDate: string | null;
  }

  it('groups items by their calendar date', () => {
    const items: Item[] = [
      { id: 'a', dueDate: '2026-09-02' },
      { id: 'b', dueDate: '2026-09-03' },
      { id: 'c', dueDate: '2026-09-02' },
    ];

    const groups = groupByCalendarDate(items, (item) => item.dueDate);

    expect(groups.get('2026-09-02')).toEqual([items[0], items[2]]);
    expect(groups.get('2026-09-03')).toEqual([items[1]]);
  });

  it('preserves insertion order within a group', () => {
    const items: Item[] = [
      { id: 'first', dueDate: '2026-09-02' },
      { id: 'second', dueDate: '2026-09-02' },
      { id: 'third', dueDate: '2026-09-02' },
    ];

    const groups = groupByCalendarDate(items, (item) => item.dueDate);

    expect(groups.get('2026-09-02')?.map((item) => item.id)).toEqual(['first', 'second', 'third']);
  });

  it('omits items without a date', () => {
    const items: Item[] = [
      { id: 'a', dueDate: '2026-09-02' },
      { id: 'b', dueDate: null },
    ];

    const groups = groupByCalendarDate(items, (item) => item.dueDate);

    expect(groups.size).toBe(1);
    expect([...groups.values()].flat()).toEqual([items[0]]);
  });

  it('returns an empty map for an empty input', () => {
    const groups = groupByCalendarDate<Item>([], (item) => item.dueDate);

    expect(groups.size).toBe(0);
  });
});
