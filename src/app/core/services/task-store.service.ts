import { DestroyRef, Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { createDemoTasks } from '../models/demo-tasks';
import {
  CalendarDate,
  CreateTaskInput,
  Task,
  createTask,
  isCalendarDate,
  todayAsCalendarDate,
} from '../models/task.model';
import { TaskPersistenceService } from './task-persistence.service';

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  dueDate?: CalendarDate | null;
}

/** Time to wait after the last change before persisting, so bursts of edits result in one write. */
const SAVE_DEBOUNCE_MS = 300;

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly persistence = inject(TaskPersistenceService);
  private loadedTasks = this.persistence.load();
  private readonly tasksSignal = signal<Task[]>(this.loadedTasks);

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

  /** Latest tasks not yet written to storage; cleared once a write completes. */
  private pendingTasks: Task[] | null = null;
  private saveTimeoutId?: ReturnType<typeof setTimeout>;

  constructor() {
    effect((onCleanup) => {
      const tasks = this.tasks();

      if (tasks === this.loadedTasks) {
        // Nothing has changed since the initial load; avoid a redundant write.
        return;
      }

      this.pendingTasks = tasks;
      this.saveTimeoutId = setTimeout(() => this.flushPendingSave(), SAVE_DEBOUNCE_MS);

      onCleanup(() => clearTimeout(this.saveTimeoutId));
    });

    // A debounced write can still be pending when the page is closed or backgrounded;
    // flush it synchronously so no change is lost on reload.
    window.addEventListener('pagehide', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('pagehide', this.handlePageHide);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  private readonly handlePageHide = (): void => {
    this.flushPendingSave();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.flushPendingSave();
    }
  };

  private flushPendingSave(): void {
    if (this.pendingTasks === null) {
      return;
    }

    clearTimeout(this.saveTimeoutId);
    this.persistence.save(this.pendingTasks);
    this.pendingTasks = null;
  }

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

  /** Discards all tasks and restores the original demo task set. */
  reset(): void {
    clearTimeout(this.saveTimeoutId);
    this.pendingTasks = null;

    const demoTasks = createDemoTasks();
    this.persistence.save(demoTasks);
    this.loadedTasks = demoTasks;
    this.tasksSignal.set(demoTasks);
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
