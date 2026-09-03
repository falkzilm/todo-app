import {
  MAX_NOTES_LENGTH,
  MAX_TITLE_LENGTH,
  createTask,
  isCalendarDate,
  isValidPersistedTask,
} from './task.model';

describe('createTask', () => {
  it('creates a task with the given title', () => {
    const task = createTask({ title: 'Milch kaufen' });

    expect(task.title).toBe('Milch kaufen');
  });

  it('trims the title', () => {
    const task = createTask({ title: '  Milch kaufen  ' });

    expect(task.title).toBe('Milch kaufen');
  });

  it('assigns a unique id to each task', () => {
    const first = createTask({ title: 'Aufgabe 1' });
    const second = createTask({ title: 'Aufgabe 2' });

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  it('defaults notes to null when not provided', () => {
    const task = createTask({ title: 'Aufgabe' });

    expect(task.notes).toBeNull();
  });

  it('trims notes and stores null for blank notes', () => {
    const task = createTask({ title: 'Aufgabe', notes: '   ' });

    expect(task.notes).toBeNull();
  });

  it('stores trimmed notes when provided', () => {
    const task = createTask({ title: 'Aufgabe', notes: '  Details  ' });

    expect(task.notes).toBe('Details');
  });

  it('defaults dueDate to null when not provided', () => {
    const task = createTask({ title: 'Aufgabe' });

    expect(task.dueDate).toBeNull();
  });

  it('accepts a valid calendar date string for dueDate', () => {
    const task = createTask({ title: 'Aufgabe', dueDate: '2026-09-02' });

    expect(task.dueDate).toBe('2026-09-02');
  });

  it('rejects a dueDate with a time component', () => {
    expect(() => createTask({ title: 'Aufgabe', dueDate: '2026-09-02T10:00:00Z' })).toThrow();
  });

  it('rejects a malformed dueDate string', () => {
    expect(() => createTask({ title: 'Aufgabe', dueDate: '02.09.2026' })).toThrow();
  });

  it('defaults completed to false and completedAt to null', () => {
    const task = createTask({ title: 'Aufgabe' });

    expect(task.completed).toBe(false);
    expect(task.completedAt).toBeNull();
  });

  it('sets createdAt and updatedAt to the same calendar date on creation', () => {
    const task = createTask({ title: 'Aufgabe', createdAt: '2026-01-15' });

    expect(task.createdAt).toBe('2026-01-15');
    expect(task.updatedAt).toBe('2026-01-15');
  });

  it('throws for an empty title', () => {
    expect(() => createTask({ title: '' })).toThrow();
  });

  it('throws for a title consisting only of whitespace', () => {
    expect(() => createTask({ title: '   ' })).toThrow();
  });

  it('clamps a title longer than the defined maximum', () => {
    const task = createTask({ title: 'a'.repeat(MAX_TITLE_LENGTH + 50) });

    expect(task.title.length).toBe(MAX_TITLE_LENGTH);
  });

  it('clamps notes longer than the defined maximum', () => {
    const task = createTask({ title: 'Aufgabe', notes: 'b'.repeat(MAX_NOTES_LENGTH + 50) });

    expect(task.notes?.length).toBe(MAX_NOTES_LENGTH);
  });
});

describe('isValidPersistedTask', () => {
  const validTask = {
    id: 'task-1',
    title: 'Milch kaufen',
    notes: null,
    dueDate: null,
    completed: false,
    completedAt: null,
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  };

  it('accepts a well-formed task', () => {
    expect(isValidPersistedTask(validTask)).toBe(true);
  });

  it('rejects non-object values', () => {
    expect(isValidPersistedTask(null)).toBe(false);
    expect(isValidPersistedTask('not-a-task')).toBe(false);
    expect(isValidPersistedTask(undefined)).toBe(false);
  });

  it('rejects a task missing a required field', () => {
    const withoutTitle: Record<string, unknown> = { ...validTask };
    delete withoutTitle['title'];
    expect(isValidPersistedTask(withoutTitle)).toBe(false);
  });

  it('rejects a task with a field of the wrong type', () => {
    expect(isValidPersistedTask({ ...validTask, completed: 'yes' })).toBe(false);
  });

  it('rejects a task with a malformed date', () => {
    expect(isValidPersistedTask({ ...validTask, createdAt: '01.09.2026' })).toBe(false);
  });

  it('rejects a task with an impossible calendar date', () => {
    expect(isValidPersistedTask({ ...validTask, dueDate: '2026-02-30' })).toBe(false);
    expect(isValidPersistedTask({ ...validTask, completedAt: '2026-99-99' })).toBe(false);
    expect(isValidPersistedTask({ ...validTask, createdAt: '2026-02-30' })).toBe(false);
    expect(isValidPersistedTask({ ...validTask, updatedAt: '2026-02-30' })).toBe(false);
  });
});

describe('isCalendarDate', () => {
  it('accepts YYYY-MM-DD strings', () => {
    expect(isCalendarDate('2026-09-02')).toBe(true);
  });

  it('rejects strings with a time component', () => {
    expect(isCalendarDate('2026-09-02T00:00:00Z')).toBe(false);
  });

  it('rejects non-date strings', () => {
    expect(isCalendarDate('not-a-date')).toBe(false);
  });

  it('rejects an out-of-range month', () => {
    expect(isCalendarDate('2026-99-99')).toBe(false);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(isCalendarDate('2026-00-01')).toBe(false);
  });

  it('rejects a day that does not exist in the given month', () => {
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('2026-04-31')).toBe(false);
    expect(isCalendarDate('2026-02-29')).toBe(false);
  });

  it('accepts February 29th on a leap year', () => {
    expect(isCalendarDate('2024-02-29')).toBe(true);
  });
});
