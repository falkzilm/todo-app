import { Injectable, Signal, computed, signal } from '@angular/core';
import {
  CalendarDate,
  CreateTaskInput,
  Task,
  createTask,
  isCalendarDate,
  todayAsCalendarDate,
} from '../models/task.model';

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  dueDate?: CalendarDate | null;
}

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly tasksSignal = signal<Task[]>([]);

  readonly tasks = this.tasksSignal.asReadonly();

  readonly openTasks = computed(() => this.tasks().filter((task) => !task.completed));

  readonly completedTasks = computed(() => this.tasks().filter((task) => task.completed));

  readonly todayTasks = computed(() => {
    const today = todayAsCalendarDate();
    return this.tasks().filter((task) => task.dueDate === today);
  });

  readonly overdueTasks = computed(() => {
    const today = todayAsCalendarDate();
    return this.tasks().filter(
      (task) => !task.completed && task.dueDate !== null && task.dueDate < today,
    );
  });

  add(input: CreateTaskInput): Task {
    const task = createTask(input);
    this.tasksSignal.update((tasks) => [...tasks, task]);
    return task;
  }

  update(id: string, changes: UpdateTaskInput): void {
    this.tasksSignal.update((tasks) => tasks.map((task) => this.applyUpdate(task, id, changes)));
  }

  toggleCompleted(id: string): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const completed = !task.completed;
        const timestamp = todayAsCalendarDate();
        return {
          ...task,
          completed,
          completedAt: completed ? timestamp : null,
          updatedAt: timestamp,
        };
      }),
    );
  }

  remove(id: string): void {
    this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  tasksForDate(date: CalendarDate): Signal<Task[]> {
    return computed(() => this.tasks().filter((task) => task.dueDate === date));
  }

  private applyUpdate(task: Task, id: string, changes: UpdateTaskInput): Task {
    if (task.id !== id) {
      return task;
    }

    const title = changes.title !== undefined ? changes.title.trim() : task.title;
    if (!title) {
      throw new Error('Task title must not be empty.');
    }

    if (changes.dueDate != null && !isCalendarDate(changes.dueDate)) {
      throw new Error(
        `Task dueDate must be a calendar date string (YYYY-MM-DD), got "${changes.dueDate}".`,
      );
    }

    return {
      ...task,
      title,
      notes: changes.notes !== undefined ? changes.notes?.trim() || null : task.notes,
      dueDate: changes.dueDate !== undefined ? changes.dueDate : task.dueDate,
      updatedAt: todayAsCalendarDate(),
    };
  }
}
