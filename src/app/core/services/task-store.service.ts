import {
  DestroyRef,
  Injectable,
  NgZone,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { groupByCalendarDate } from '../date/date-utils';
import { createDemoTasks } from '../models/demo-tasks';
import {
  CalendarDate,
  CreateTaskInput,
  Task,
  clampTaskTextLengths,
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

/** Aggregated task state for a single calendar day, e.g. for the calendar's day indicators. */
export interface DayTaskSummary {
  readonly openCount: number;
  /** `true` only when the day has at least one task and all of them are completed. */
  readonly allCompleted: boolean;
}

/** Time to wait after the last change before persisting, so bursts of edits result in one write. */
const SAVE_DEBOUNCE_MS = 300;

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly persistence = inject(TaskPersistenceService);
  private readonly zone = inject(NgZone);
  private loadedTasks = this.persistence.load();
  private readonly tasksSignal = signal<Task[]>(this.loadedTasks);

  readonly tasks = this.tasksSignal.asReadonly();

  readonly openTasks = computed(() => this.tasks().filter((task) => !task.completed));

  readonly completedTasks = computed(() => this.tasks().filter((task) => task.completed));

  /**
   * Today's calendar date, refreshed at local midnight so `todayTasks`/`overdueTasks`
   * roll over correctly even if the app is left open across a day change.
   */
  private readonly currentDate = signal(todayAsCalendarDate());
  private midnightTimeoutId?: ReturnType<typeof setTimeout>;

  readonly todayTasks = computed(() => {
    const today = this.currentDate();
    return this.tasks().filter((task) => !task.completed && task.dueDate === today);
  });

  readonly overdueTasks = computed(() => {
    const today = this.currentDate();
    return this.tasks()
      .filter((task) => !task.completed && task.dueDate !== null && task.dueDate < today)
      .sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string));
  });

  /** All tasks due today, regardless of completion state; used for the day's progress summary. */
  private readonly allTodayTasks = computed(() => {
    const today = this.currentDate();
    return this.tasks().filter((task) => task.dueDate === today);
  });

  readonly todayTotalCount = computed(() => this.allTodayTasks().length);

  readonly todayCompletedCount = computed(
    () => this.allTodayTasks().filter((task) => task.completed).length,
  );

  /** Tasks due today that have already been completed, for the collapsible "done" section. */
  readonly todayCompletedTasks = computed(() =>
    this.allTodayTasks().filter((task) => task.completed),
  );

  /** Latest tasks not yet written to storage; cleared once a write completes. */
  private pendingTasks: Task[] | null = null;
  private saveTimeoutId?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleMidnightRollover();

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
      clearTimeout(this.midnightTimeoutId);
    });
  }

  /**
   * Schedules a refresh of `currentDate` for the next local midnight, then reschedules itself.
   * Runs outside the Angular zone since the delay can be up to 24h; otherwise this pending
   * timer would keep zone stability (and anything awaiting it, e.g. `whenStable()` in tests)
   * from ever settling.
   */
  private scheduleMidnightRollover(): void {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    this.zone.runOutsideAngular(() => {
      this.midnightTimeoutId = setTimeout(() => {
        this.zone.run(() => this.currentDate.set(todayAsCalendarDate()));
        this.scheduleMidnightRollover();
      }, msUntilMidnight);
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

  /** Applies and persists a new task list synchronously, discarding any pending debounced write. */
  private setTasksImmediately(tasks: Task[]): void {
    clearTimeout(this.saveTimeoutId);
    this.pendingTasks = null;

    this.persistence.save(tasks);
    this.loadedTasks = tasks;
    this.tasksSignal.set(tasks);
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

  /**
   * Removes the task and persists synchronously (no debounce), so the
   * deletion survives an immediate reload even before an undo grace period
   * (handled by the caller) elapses. Returns the removed task, or
   * `undefined` if no task with that id exists.
   */
  remove(id: string): Task | undefined {
    const tasks = this.tasksSignal();
    const removedTask = tasks.find((task) => task.id === id);
    if (!removedTask) {
      return undefined;
    }

    this.setTasksImmediately(tasks.filter((task) => task.id !== id));
    return removedTask;
  }

  /** Re-inserts a previously removed task at the given index (clamped to the current length), used to undo a delete. */
  restore(task: Task, index: number): void {
    const tasks = this.tasksSignal();
    const insertAt = Math.min(Math.max(index, 0), tasks.length);
    this.setTasksImmediately([...tasks.slice(0, insertAt), task, ...tasks.slice(insertAt)]);
  }

  /** Discards all tasks and restores the original demo task set. */
  reset(): void {
    this.setTasksImmediately(createDemoTasks());
  }

  tasksForDate(date: CalendarDate): Signal<Task[]> {
    return computed(() => this.tasks().filter((task) => task.dueDate === date));
  }

  /** Per-day task summaries (open count, all-completed flag), for the calendar's day indicators. */
  readonly taskSummaryByDate: Signal<ReadonlyMap<CalendarDate, DayTaskSummary>> = computed(() => {
    const grouped = groupByCalendarDate(this.tasks(), (task) => task.dueDate);
    const summaries = new Map<CalendarDate, DayTaskSummary>();

    for (const [date, tasks] of grouped) {
      const openCount = tasks.filter((task) => !task.completed).length;
      summaries.set(date, { openCount, allCompleted: openCount === 0 });
    }

    return summaries;
  });

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

    return clampTaskTextLengths({
      ...task,
      title,
      notes: changes.notes !== undefined ? changes.notes?.trim() || null : task.notes,
      dueDate: changes.dueDate !== undefined ? changes.dueDate : task.dueDate,
      updatedAt: todayAsCalendarDate(),
    });
  }
}
