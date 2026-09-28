import { DEFAULT_CATEGORIES } from './category.model';
import { createDemoTasks } from './demo-tasks';
import { toCalendarDate } from './task.model';

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toCalendarDate(date);
}

describe('createDemoTasks', () => {
  it('creates exactly 8 demo tasks', () => {
    expect(createDemoTasks()).toHaveLength(8);
  });

  it('creates the 5 tasks due today with their category, time and priority', () => {
    const tasks = createDemoTasks();
    const today = daysFromToday(0);

    const byTitle = (title: string) => tasks.find((task) => task.title === title);

    expect(byTitle('Sprint-Planung vorbereiten')).toMatchObject({
      dueDate: today,
      categoryId: 'arbeit',
      priority: 'high',
      startTime: '09:00',
      completed: false,
    });
    expect(byTitle('E-Mails beantworten')).toMatchObject({
      dueDate: today,
      categoryId: 'arbeit',
      priority: 'medium',
      startTime: '10:00',
      completed: true,
    });
    expect(byTitle('Einkaufsliste ergänzen')).toMatchObject({
      dueDate: today,
      categoryId: 'privat',
      priority: 'low',
      startTime: '13:00',
      completed: false,
    });
    expect(byTitle('Arzttermin bestätigen')).toMatchObject({
      dueDate: today,
      categoryId: 'privat',
      priority: 'medium',
      startTime: '16:00',
      completed: false,
    });
    expect(byTitle('Design-Review')).toMatchObject({
      dueDate: today,
      categoryId: 'arbeit',
      priority: 'high',
      startTime: '17:30',
      completed: false,
    });
  });

  it('only marks "E-Mails beantworten" as completed', () => {
    const completedTitles = createDemoTasks()
      .filter((task) => task.completed)
      .map((task) => task.title);
    expect(completedTitles).toEqual(['E-Mails beantworten']);
  });

  it('creates 3 calendar agenda entries with subtitle and attendee/attachment info', () => {
    const tasks = createDemoTasks();
    const byTitle = (title: string) => tasks.find((task) => task.title === title);

    expect(byTitle('Team-Meeting')).toMatchObject({
      dueDate: daysFromToday(2),
      startTime: '09:00',
      endTime: '10:00',
      subtitle: 'Besprechungsraum 2',
      attendeeCount: 4,
    });
    expect(byTitle('Abgabe Projekt')).toMatchObject({
      dueDate: daysFromToday(2),
      startTime: '14:00',
      endTime: '15:30',
      subtitle: 'Website Redesign',
      hasAttachment: true,
    });
    expect(byTitle('Elternabend')).toMatchObject({
      dueDate: daysFromToday(4),
      startTime: '19:00',
      endTime: '20:30',
      subtitle: 'Aula der Schule',
      attendeeCount: 2,
    });
  });

  it('groups the agenda entries onto 2 distinct days, with 2 entries on one of them', () => {
    const tasks = createDemoTasks();
    const agendaDates = ['Team-Meeting', 'Abgabe Projekt', 'Elternabend'].map(
      (title) => tasks.find((task) => task.title === title)?.dueDate,
    );

    expect(new Set(agendaDates).size).toBe(2);
    expect(agendaDates[0]).toBe(agendaDates[1]);
    expect(agendaDates[2]).not.toBe(agendaDates[0]);
  });

  it('only references category ids that exist in DEFAULT_CATEGORIES', () => {
    const knownIds = new Set(DEFAULT_CATEGORIES.map((category) => category.id));
    const usedIds = createDemoTasks()
      .map((task) => task.categoryId)
      .filter((categoryId): categoryId is string => categoryId !== null);

    expect(usedIds.length).toBeGreaterThan(0);
    for (const id of usedIds) {
      expect(knownIds.has(id)).toBe(true);
    }
  });

  it('uses at least 4 distinct categories across the demo tasks', () => {
    const usedIds = new Set(createDemoTasks().map((task) => task.categoryId));
    expect(usedIds.size).toBeGreaterThanOrEqual(4);
  });

  it('produces dates relative to today, not a fixed calendar date', () => {
    const tasks = createDemoTasks();
    const todayTasks = tasks.filter((task) => task.dueDate === daysFromToday(0));
    expect(todayTasks).toHaveLength(5);
  });
});
