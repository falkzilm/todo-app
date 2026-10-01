import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { getTimeOfDayGreeting } from '../../../core/date/greeting';
import { Task, todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { TaskStoreService, UpdateTaskInput } from '../../../core/services/task-store.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';
import { TaskDetailPanelComponent } from '../task-detail-panel/task-detail-panel.component';
import { DailyProgressCardComponent } from '../daily-progress-card/daily-progress-card.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { TaskFilterBarComponent, TaskFilterId } from '../task-filter-bar/task-filter-bar.component';
import { TaskQuickAddComponent } from '../task-quick-add/task-quick-add.component';

/** Shown below the filter bar's chips when the active filter has no matching tasks. */
const EMPTY_STATE_TEXT_BY_FILTER: Record<TaskFilterId, string> = {
  today: 'Heute steht nichts an.',
  week: 'Diese Woche steht nichts an.',
  important: 'Keine wichtigen Aufgaben.',
};

/** How long the undo notice stays visible before a delete becomes final. */
const UNDO_DURATION_MS = 6000;

interface PendingUndo {
  task: Task;
  index: number;
}

@Component({
  selector: 'app-aufgaben-page',
  standalone: true,
  imports: [
    TaskItemComponent,
    TaskDetailPanelComponent,
    TaskFilterBarComponent,
    DailyProgressCardComponent,
    NotificationBellComponent,
    TaskQuickAddComponent,
  ],
  templateUrl: './aufgaben-page.component.html',
  styleUrl: './aufgaben-page.component.scss',
})
export class AufgabenPageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly announcer = inject(AnnouncerService);
  private readonly userProfile = inject(UserProfileService);

  private readonly today = signal(new Date());

  protected readonly greeting = computed(() => {
    const firstName = this.userProfile.displayName().split(' ')[0];
    return `${getTimeOfDayGreeting(this.today())}, ${firstName}! 👋`;
  });

  protected readonly activeFilter = signal<TaskFilterId>('today');

  protected readonly todayTotalCount = this.taskStore.todayTotalCount;
  protected readonly todayCompletedCount = this.taskStore.todayCompletedCount;

  protected readonly filteredTasks = computed<readonly Task[]>(() => {
    switch (this.activeFilter()) {
      case 'week':
        return this.taskStore.tasksThisWeek();
      case 'important':
        return this.taskStore.importantTasks();
      case 'today':
        return this.taskStore.tasksToday();
    }
  });

  protected readonly emptyStateText = computed(
    () => EMPTY_STATE_TEXT_BY_FILTER[this.activeFilter()],
  );

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
    inject(DestroyRef).onDestroy(() => clearTimeout(this.undoTimeoutId));
  }

  protected selectFilter(filter: TaskFilterId): void {
    this.activeFilter.set(filter);
  }

  protected addTask(title: string): void {
    this.taskStore.add({ title, dueDate: todayAsCalendarDate() });
    this.announcer.announce(`„${title}“ hinzugefügt.`);
  }

  protected toggleTask(id: string): void {
    const task = this.findTaskById(id);
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

  private findTaskById(id: string): Task | undefined {
    return this.taskStore.tasks().find((task) => task.id === id);
  }
}
