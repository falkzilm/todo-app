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

/** Upper bounds for user-entered text, enforced both when creating/updating and when loading persisted tasks. */
export const MAX_TITLE_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2000;

function isNullOrCalendarDate(value: unknown): value is CalendarDate | null {
  return value === null || (typeof value === 'string' && isCalendarDate(value));
}

/**
 * Validates a single value read from persisted storage against the `Task` schema
 * (types, required fields and date formats), so a manipulated or corrupted
 * localStorage entry can be told apart from a genuine task.
 */
export function isValidPersistedTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;

  return (
    typeof task['id'] === 'string' &&
    task['id'].length > 0 &&
    typeof task['title'] === 'string' &&
    task['title'].trim().length > 0 &&
    (task['notes'] === null || typeof task['notes'] === 'string') &&
    isNullOrCalendarDate(task['dueDate']) &&
    typeof task['completed'] === 'boolean' &&
    isNullOrCalendarDate(task['completedAt']) &&
    typeof task['createdAt'] === 'string' &&
    isCalendarDate(task['createdAt']) &&
    typeof task['updatedAt'] === 'string' &&
    isCalendarDate(task['updatedAt'])
  );
}

/** Clamps title/notes to their defined maximum length, e.g. before persisting or after loading. */
export function clampTaskTextLengths(task: Task): Task {
  return {
    ...task,
    title: task.title.slice(0, MAX_TITLE_LENGTH),
    notes: task.notes !== null ? task.notes.slice(0, MAX_NOTES_LENGTH) : null,
  };
}

export function toCalendarDate(date: Date): CalendarDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayAsCalendarDate(): CalendarDate {
  return toCalendarDate(new Date());
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

  return clampTaskTextLengths({
    id: crypto.randomUUID(),
    title,
    notes: input.notes?.trim() || null,
    dueDate: input.dueDate ?? null,
    completed: false,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}
