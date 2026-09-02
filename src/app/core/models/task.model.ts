/**
 * A calendar date without a time component, e.g. "2026-09-02".
 * Never derive this via `Date#toISOString()` (UTC-based) as that can shift
 * the day depending on the local timezone; use local getters instead.
 */
export type CalendarDate = string;

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly notes: string | null;
  readonly dueDate: CalendarDate | null;
  readonly completed: boolean;
  readonly completedAt: CalendarDate | null;
  readonly createdAt: CalendarDate;
  readonly updatedAt: CalendarDate;
}

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  dueDate?: CalendarDate | null;
  createdAt?: CalendarDate;
}

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDate(value: string): value is CalendarDate {
  return CALENDAR_DATE_PATTERN.test(value);
}

export function todayAsCalendarDate(): CalendarDate {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTask(input: CreateTaskInput): Task {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Task title must not be empty.');
  }

  if (input.dueDate != null && !isCalendarDate(input.dueDate)) {
    throw new Error(
      `Task dueDate must be a calendar date string (YYYY-MM-DD), got "${input.dueDate}".`,
    );
  }

  const timestamp = input.createdAt ?? todayAsCalendarDate();

  return {
    id: crypto.randomUUID(),
    title,
    notes: input.notes?.trim() || null,
    dueDate: input.dueDate ?? null,
    completed: false,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
