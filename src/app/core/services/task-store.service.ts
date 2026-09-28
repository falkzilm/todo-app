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
import { endOfWeekAsCalendarDate, groupByCalendarDate } from '../date/date-utils';
import { CategoryColor, DEFAULT_CATEGORIES } from '../models/category.model';
import { createDemoTasks } from '../models/demo-tasks';
import {
  CalendarDate,
  CreateTaskInput,
  Task,
  TaskPriority,
  TimeOfDay,
  clampTaskTextLengths,
  createTask,
  isCalendarDate,
  isTimeOfDay,
  isValidTimeRange,
  todayAsCalendarDate,
} from '../models/task.model';
import { TaskPersistenceService } from './task-persistence.service';

/** Category color per category id, resolved once since `DEFAULT_CATEGORIES` is a fixed constant. */
const CATEGORY_COLOR_BY_ID = new Map(
  DEFAULT_CATEGORIES.map((category) => [category.id, category.color]),
);

/**
 * Orders tasks by `startTime` ascending, with tasks that have no `startTime` last.
 * Completion state is intentionally not a sort key: a completed task keeps the slot
 * its own time gives it instead of moving to a separate section (see the design).
 * `Array#sort` is stable, so tasks tied on `startTime` (e.g. two without one) keep
 * their original relative order.
 */
function compareByStartTime(a: Task, b: Task): number {
  if (a.startTime === null || b.startTime === null) {
    return a.startTime === b.startTime ? 0 : a.startTime === null ? 1 : -1;
  }
  return a.startTime.localeCompare(b.startTime);
}

/** Grouped, chronologically sorted agenda entries for a calendar day list. */
export interface AgendaGroup {
  readonly date: CalendarDate;
  readonly tasks: readonly Task[];
}

const MAX_CATEGORY_DOTS = 3;

/**
 * Keeps the first `max` distinct values, preserving order of first appearance.
 * Exported for direct unit testing of the cap, since the app's current fixed
 * category set (`DEFAULT_CATEGORIES`) only has 2 colors and can't exercise it.
 */
export function capDistinct<T>(values: readonly T[], max: number): T[] {
  const result: T[] = [];

  for (const value of values) {
    if (result.includes(value)) {
      continue;
    }

    result.push(value);
    if (result.length === max) {
      break;
    }
  }

  return result;
}

/** Up to 3 distinct category colors among `tasks`, in first-seen order; uncategorized/unknown categories are skipped. */
function categoryColorsFor(tasks: readonly Task[]): CategoryColor[] {
  const colors = tasks
    .map((task) =>
      task.categoryId !== null ? CATEGORY_COLOR_BY_ID.get(task.categoryId) : undefined,
    )
    .filter((color): color is CategoryColor => color !== undefined);

  return capDistinct(colors, MAX_CATEGORY_DOTS);
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  dueDate?: CalendarDate | null;
  categoryId?: string | null;
  priority?: TaskPriority | null;
  startTime?: TimeOfDay | null;
  endTime?: TimeOfDay | null;
  subtitle?: string | null;
  attendeeCount?: number | null;
  hasAttachment?: boolean;
}

/** Aggregated task state for a single calendar day, e.g. for the calendar's day indicators. */
export interface DayTaskSummary {
  readonly openCount: number;
  /** `true` only when the day has at least one task and all of them are completed. */
  readonly allCompleted: boolean;
  /** Up to 3 distinct category colors among the day's tasks, in first-seen order, for the month grid's dots. */
  readonly categoryColors: readonly CategoryColor[];
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

  /**
   * Chip-bar filter: tasks due today, open and completed alike (a completed task stays
   * inline at its sorted position instead of moving to a separate section).
   */
  readonly tasksToday = computed(() => this.allTodayTasks().slice().sort(compareByStartTime));

  /** Chip-bar filter: tasks due from today through the end of the current Mo–So week. */
  readonly tasksThisWeek = computed(() => {
    const today = this.currentDate();
    const weekEnd = endOfWeekAsCalendarDate(new Date(`${today}T00:00:00`));

    return this.tasks()
      .filter((task) => task.dueDate !== null && task.dueDate >= today && task.dueDate <= weekEnd)
      .sort(compareByStartTime);
  });

  /** Chip-bar filter: all tasks with high priority, regardless of due date. */
  readonly importantTasks = computed(() =>
    this.tasks()
      .filter((task) => task.priority === 'high')
      .sort(compareByStartTime),
  );

  /** Tasks with a time range (start and end), grouped by due date and sorted chronologically, for the calendar's day agenda. */
  readonly agenda: Signal<readonly AgendaGroup[]> = computed(() => {
    const withTimeRange = this.tasks().filter(
      (task) => task.dueDate !== null && task.startTime !== null && task.endTime !== null,
    );
    const grouped = groupByCalendarDate(withTimeRange, (task) => task.dueDate);

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({ date, tasks: tasks.slice().sort(compareByStartTime) }));
  });

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
      summaries.set(date, {
        openCount,
        allCompleted: openCount === 0,
        categoryColors: categoryColorsFor(tasks),
      });
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

    if (changes.startTime != null && !isTimeOfDay(changes.startTime)) {
      throw new Error(
        `Task startTime must be a time-of-day string (HH:mm), got "${changes.startTime}".`,
      );
    }

    if (changes.endTime != null && !isTimeOfDay(changes.endTime)) {
      throw new Error(
        `Task endTime must be a time-of-day string (HH:mm), got "${changes.endTime}".`,
      );
    }

    const startTime = changes.startTime !== undefined ? changes.startTime : task.startTime;
    const endTime = changes.endTime !== undefined ? changes.endTime : task.endTime;
    if (!isValidTimeRange(startTime, endTime)) {
      throw new Error(`Task endTime ("${endTime}") must not be before startTime ("${startTime}").`);
    }

    return clampTaskTextLengths({
      ...task,
      title,
      notes: changes.notes !== undefined ? changes.notes?.trim() || null : task.notes,
      dueDate: changes.dueDate !== undefined ? changes.dueDate : task.dueDate,
      categoryId: changes.categoryId !== undefined ? changes.categoryId : task.categoryId,
      priority: changes.priority !== undefined ? changes.priority : task.priority,
      startTime,
      endTime,
      subtitle: changes.subtitle !== undefined ? changes.subtitle?.trim() || null : task.subtitle,
      attendeeCount:
        changes.attendeeCount !== undefined ? changes.attendeeCount : task.attendeeCount,
      hasAttachment:
        changes.hasAttachment !== undefined ? changes.hasAttachment : task.hasAttachment,
      updatedAt: todayAsCalendarDate(),
    });
  }
}
