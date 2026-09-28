/**
 * A calendar date without a time component, e.g. "2026-09-02".
 * Never derive this via `Date#toISOString()` (UTC-based) as that can shift
 * the day depending on the local timezone; use local getters instead.
 */
export type CalendarDate = string;

/**
 * `DataTransfer` type used to identify a task drag (e.g. dragging a task from
 * the day list onto a calendar day cell to reschedule it). A dedicated type
 * (rather than plain "text/plain") lets drop targets tell a task drag apart
 * from unrelated native drags, e.g. text selection.
 */
export const TASK_DRAG_DATA_FORMAT = 'application/x-fleetview-task-id';

/** A time of day without a date component, in 24h `HH:mm` format, e.g. "09:00". */
export type TimeOfDay = string;

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly notes: string | null;
  readonly dueDate: CalendarDate | null;
  readonly completed: boolean;
  readonly completedAt: CalendarDate | null;
  readonly createdAt: CalendarDate;
  readonly updatedAt: CalendarDate;
  /** References a `Category.id`, or `null` when the task is uncategorized. */
  readonly categoryId: string | null;
  readonly priority: TaskPriority | null;
  readonly startTime: TimeOfDay | null;
  readonly endTime: TimeOfDay | null;
  /** Location or project context, e.g. "Besprechungsraum 2". */
  readonly subtitle: string | null;
  /**
   * Display-only; there is no UI to manage attendees, so this is only ever
   * set from demo data.
   */
  readonly attendeeCount: number | null;
  /** Display-only; there is no attachment management UI. */
  readonly hasAttachment: boolean;
}

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  dueDate?: CalendarDate | null;
  createdAt?: CalendarDate;
  categoryId?: string | null;
  priority?: TaskPriority | null;
  startTime?: TimeOfDay | null;
  endTime?: TimeOfDay | null;
  subtitle?: string | null;
  attendeeCount?: number | null;
  hasAttachment?: boolean;
}

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Matches the `YYYY-MM-DD` format and also rejects values that are
 * structurally well-formed but not real calendar dates (e.g. "2026-02-30" or
 * "2026-99-99"), including correct leap-year handling for February.
 */
export function isCalendarDate(value: string): value is CalendarDate {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/** Upper bounds for user-entered text, enforced both when creating/updating and when loading persisted tasks. */
export const MAX_TITLE_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_SUBTITLE_LENGTH = 200;

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Matches the 24h `HH:mm` format, e.g. "09:00"–"23:59"; rejects "24:00", single-digit hours and out-of-range minutes. */
export function isTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === 'string' && TIME_OF_DAY_PATTERN.test(value);
}

function isNullOrCalendarDate(value: unknown): value is CalendarDate | null {
  return value === null || (typeof value === 'string' && isCalendarDate(value));
}

/** Absent (`undefined`) is accepted too, so tasks persisted before these fields existed still validate. */
function isMissingNullOrTimeOfDay(value: unknown): boolean {
  return value === undefined || value === null || isTimeOfDay(value);
}

/** Absent (`undefined`) is accepted too, so tasks persisted before these fields existed still validate. */
function isMissingNullOrTaskPriority(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === 'high' ||
    value === 'medium' ||
    value === 'low'
  );
}

/** `endTime` must not be before `startTime`; equal times (zero-length range) are allowed. */
export function isValidTimeRange(startTime: TimeOfDay | null, endTime: TimeOfDay | null): boolean {
  if (startTime === null || endTime === null) {
    return true;
  }
  return endTime >= startTime;
}

/**
 * Same as `isValidTimeRange`, but also accepts `undefined` endpoints (treated like `null`,
 * i.e. no constraint) so it can validate persisted tasks from before these fields existed.
 */
function isValidPersistedTimeRange(startTime: unknown, endTime: unknown): boolean {
  return isValidTimeRange(
    (startTime ?? null) as TimeOfDay | null,
    (endTime ?? null) as TimeOfDay | null,
  );
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
    isCalendarDate(task['updatedAt']) &&
    (task['categoryId'] === undefined ||
      task['categoryId'] === null ||
      typeof task['categoryId'] === 'string') &&
    isMissingNullOrTaskPriority(task['priority']) &&
    isMissingNullOrTimeOfDay(task['startTime']) &&
    isMissingNullOrTimeOfDay(task['endTime']) &&
    isValidPersistedTimeRange(task['startTime'], task['endTime']) &&
    (task['subtitle'] === undefined ||
      task['subtitle'] === null ||
      typeof task['subtitle'] === 'string') &&
    (task['attendeeCount'] === undefined ||
      task['attendeeCount'] === null ||
      typeof task['attendeeCount'] === 'number') &&
    (task['hasAttachment'] === undefined || typeof task['hasAttachment'] === 'boolean')
  );
}

/**
 * Fills in defaults for the agenda fields on a task persisted before they existed.
 * `isValidPersistedTask` accepts such legacy records with those fields `undefined` (not `null`),
 * even though `Task` declares them as always present; normalizing here right after validation
 * keeps that gap from leaking into the rest of the app (e.g. `TaskStoreService.update`, which
 * would otherwise see `undefined` `startTime`/`endTime` and reject a legitimate update).
 */
export function normalizePersistedTask(task: Task): Task {
  return {
    ...task,
    categoryId: task.categoryId ?? null,
    priority: task.priority ?? null,
    startTime: task.startTime ?? null,
    endTime: task.endTime ?? null,
    subtitle: task.subtitle ?? null,
    attendeeCount: task.attendeeCount ?? null,
    hasAttachment: task.hasAttachment ?? false,
  };
}

/** Clamps title/notes/subtitle to their defined maximum length, e.g. before persisting or after loading. */
export function clampTaskTextLengths(task: Task): Task {
  return {
    ...task,
    title: task.title.slice(0, MAX_TITLE_LENGTH),
    notes: task.notes !== null ? task.notes.slice(0, MAX_NOTES_LENGTH) : null,
    subtitle: task.subtitle != null ? task.subtitle.slice(0, MAX_SUBTITLE_LENGTH) : null,
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

  if (input.startTime != null && !isTimeOfDay(input.startTime)) {
    throw new Error(
      `Task startTime must be a time-of-day string (HH:mm), got "${input.startTime}".`,
    );
  }

  if (input.endTime != null && !isTimeOfDay(input.endTime)) {
    throw new Error(`Task endTime must be a time-of-day string (HH:mm), got "${input.endTime}".`);
  }

  const startTime = input.startTime ?? null;
  const endTime = input.endTime ?? null;
  if (!isValidTimeRange(startTime, endTime)) {
    throw new Error(`Task endTime ("${endTime}") must not be before startTime ("${startTime}").`);
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
    categoryId: input.categoryId ?? null,
    priority: input.priority ?? null,
    startTime,
    endTime,
    subtitle: input.subtitle?.trim() || null,
    attendeeCount: input.attendeeCount ?? null,
    hasAttachment: input.hasAttachment ?? false,
  });
}
