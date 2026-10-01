import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getMonthGrid } from '../../../core/date/date-utils';
import { CalendarDate, Task, todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { TaskStoreService, UpdateTaskInput } from '../../../core/services/task-store.service';
import { TaskDetailPanelComponent } from '../../aufgaben/task-detail-panel/task-detail-panel.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';
import { MonthGridComponent } from '../../../shared/ui/month-grid/month-grid.component';

/** How long the undo notice stays visible before a delete becomes final. */
const UNDO_DURATION_MS = 6000;

interface PendingUndo {
  task: Task;
  index: number;
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    MonthGridComponent,
    TaskItemComponent,
    TaskDetailPanelComponent,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly announcer = inject(AnnouncerService);

  private readonly quickAddInput =
    viewChild.required<ElementRef<HTMLInputElement>>('quickAddInput');

  protected readonly taskSummaries = this.taskStore.taskSummaryByDate;

  protected readonly referenceDate = signal(new Date());

  protected readonly monthLabel = computed(() =>
    this.referenceDate().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
  );

  protected readonly gridLabel = computed(() => `Kalender ${this.monthLabel()}`);

  protected readonly days = computed(() => getMonthGrid(this.referenceDate()));

  /** The day selected in the grid; defaults to today when the calendar view is opened. */
  protected readonly selectedDate = signal<CalendarDate>(todayAsCalendarDate());

  protected readonly selectedDateLabel = computed(() =>
    new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  protected readonly selectedDayTasks = computed(() =>
    this.taskStore.tasksForDate(this.selectedDate())(),
  );

  protected newTaskTitle = '';
  protected showEmptyTitleHint = false;

  /** The most recently deleted task, while its undo notice is still shown. */
  protected readonly pendingUndo = signal<PendingUndo | null>(null);
  private undoTimeoutId?: ReturnType<typeof setTimeout>;

  /** Id of the task currently open in the detail panel, or `null` when it's closed (TDP-38). */
  protected readonly selectedTaskId = signal<string | null>(null);

  protected readonly selectedTask = computed(
    () => this.taskStore.tasks().find((task) => task.id === this.selectedTaskId()) ?? null,
  );

  /** The card that was focused when the panel opened, so focus can return to it on close. */
  private triggerElement: HTMLElement | null = null;

  constructor() {
    // Resets the quick-add field whenever the selected day changes, so a
    // half-typed title never ends up attached to a different day.
    effect(() => {
      this.selectedDate();
      this.newTaskTitle = '';
      this.showEmptyTitleHint = false;
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.undoTimeoutId));
  }

  protected addTaskForSelectedDay(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.quickAddInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.taskStore.add({ title, dueDate: this.selectedDate() });
    this.announcer.announce(`„${title}“ hinzugefügt.`);
    this.newTaskTitle = '';
    this.quickAddInput().nativeElement.focus();
  }

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected goToToday(): void {
    this.referenceDate.set(new Date());
  }

  protected selectDay(date: CalendarDate): void {
    this.selectedDate.set(date);
  }

  protected toggleTask(id: string): void {
    const task = this.selectedDayTasks().find((candidate) => candidate.id === id);
    this.taskStore.toggleCompleted(id);
    if (task) {
      const completed = !task.completed;
      this.announcer.announce(`„${task.title}“ als ${completed ? 'erledigt' : 'offen'} markiert.`);
    }
  }

  protected removeTask(id: string): void {
    const index = this.taskStore.tasks().findIndex((task) => task.id === id);
    const removedTask = this.taskStore.remove(id);
    if (!removedTask) {
      return;
    }

    clearTimeout(this.undoTimeoutId);
    this.pendingUndo.set({ task: removedTask, index });
    this.undoTimeoutId = setTimeout(() => this.pendingUndo.set(null), UNDO_DURATION_MS);
  }

  protected undoRemove(): void {
    const pending = this.pendingUndo();
    if (!pending) {
      return;
    }

    clearTimeout(this.undoTimeoutId);
    this.pendingUndo.set(null);
    this.taskStore.restore(pending.task, pending.index);
  }

  protected openTaskDetail(id: string): void {
    this.triggerElement = document.activeElement as HTMLElement | null;
    this.selectedTaskId.set(id);
  }

  protected onPanelSave(changes: UpdateTaskInput): void {
    const id = this.selectedTaskId();
    if (!id) {
      return;
    }
    this.taskStore.update(id, changes);
    this.announcer.announce(`„${changes.title}“ aktualisiert.`);
  }

  protected onPanelDelete(): void {
    const id = this.selectedTaskId();
    if (id) {
      this.removeTask(id);
    }
  }

  protected onPanelClosed(): void {
    this.selectedTaskId.set(null);
    const trigger = this.triggerElement;
    this.triggerElement = null;
    if (trigger?.isConnected) {
      trigger.focus();
    }
  }

  /** Drag & drop rescheduling (DEMOPROJEK-45): dropping a task from the day list onto a grid cell. */
  protected onTaskDrop(event: { taskId: string; date: CalendarDate }): void {
    this.taskStore.update(event.taskId, { dueDate: event.date });
  }

  private shiftMonth(delta: number): void {
    this.referenceDate.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }
}
