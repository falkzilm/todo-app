import { createTask, isCalendarDate } from './task.model';

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
});
