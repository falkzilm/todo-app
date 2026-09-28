import { DEFAULT_CATEGORIES } from './category.model';
import { CalendarDate, CreateTaskInput, Task, createTask, toCalendarDate } from './task.model';

function offsetFromToday(days: number): CalendarDate {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toCalendarDate(date);
}

/** Looks up a `DEFAULT_CATEGORIES` id by name, so the demo data can't drift from that list. */
function categoryId(name: string): string {
  const category = DEFAULT_CATEGORIES.find((candidate) => candidate.name === name);
  if (!category) {
    throw new Error(`Unknown demo category "${name}".`);
  }
  return category.id;
}

interface DemoTaskInput extends CreateTaskInput {
  /** `createTask` always starts a task open; set this to mark it done right after creation. */
  completed?: boolean;
}

/**
 * Mirrors the reference design's first-run content: five tasks due today
 * (spanning both demo categories, all three priorities and one completed
 * task) plus three calendar agenda entries across two other days, so the
 * "heute"/"diese Woche" views and the month grid's day indicators are
 * populated the way the design shows them.
 */
export function createDemoTasks(): Task[] {
  const inputs: DemoTaskInput[] = [
    {
      title: 'Sprint-Planung vorbereiten',
      dueDate: offsetFromToday(0),
      categoryId: categoryId('Arbeit'),
      priority: 'high',
      startTime: '09:00',
    },
    {
      title: 'E-Mails beantworten',
      dueDate: offsetFromToday(0),
      categoryId: categoryId('Arbeit'),
      priority: 'medium',
      startTime: '10:00',
      completed: true,
    },
    {
      title: 'Einkaufsliste ergänzen',
      dueDate: offsetFromToday(0),
      categoryId: categoryId('Privat'),
      priority: 'low',
      startTime: '13:00',
    },
    {
      title: 'Arzttermin bestätigen',
      dueDate: offsetFromToday(0),
      categoryId: categoryId('Privat'),
      priority: 'medium',
      startTime: '16:00',
    },
    {
      title: 'Design-Review',
      dueDate: offsetFromToday(0),
      categoryId: categoryId('Arbeit'),
      priority: 'high',
      startTime: '17:30',
    },
    {
      title: 'Team-Meeting',
      dueDate: offsetFromToday(2),
      categoryId: categoryId('Arbeit'),
      startTime: '09:00',
      endTime: '10:00',
      subtitle: 'Besprechungsraum 2',
      attendeeCount: 4,
    },
    {
      title: 'Abgabe Projekt',
      dueDate: offsetFromToday(2),
      categoryId: categoryId('Projekte'),
      startTime: '14:00',
      endTime: '15:30',
      subtitle: 'Website Redesign',
      hasAttachment: true,
    },
    {
      title: 'Elternabend',
      dueDate: offsetFromToday(4),
      categoryId: categoryId('Familie'),
      startTime: '19:00',
      endTime: '20:30',
      subtitle: 'Aula der Schule',
      attendeeCount: 2,
    },
  ];

  return inputs.map(({ completed, ...input }) => {
    const task = createTask(input);
    if (!completed) {
      return task;
    }
    return { ...task, completed: true, completedAt: task.createdAt };
  });
}
