import { CalendarDate, CreateTaskInput, Task, createTask, toCalendarDate } from './task.model';

function offsetFromToday(days: number): CalendarDate {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toCalendarDate(date);
}

/**
 * A small, easy-to-follow set of example tasks covering the states a new
 * user is likely to care about: due today, overdue and due within the
 * coming week.
 */
export function createDemoTasks(): Task[] {
  const inputs: CreateTaskInput[] = [
    { title: 'Wocheneinkauf erledigen', dueDate: offsetFromToday(0) },
    { title: 'Rechnung überweisen', dueDate: offsetFromToday(-3) },
    { title: 'Zahnarzttermin vereinbaren', dueDate: offsetFromToday(-1) },
    { title: 'Projektpräsentation vorbereiten', dueDate: offsetFromToday(3) },
    { title: 'Wohnung putzen', dueDate: offsetFromToday(6) },
  ];

  return inputs.map((input) => createTask(input));
}
