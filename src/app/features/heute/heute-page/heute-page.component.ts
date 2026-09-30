import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { getTimeOfDayGreeting } from '../../../core/date/greeting';
import { Task } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { STORAGE } from '../../../core/services/storage.token';
import { TaskStoreService, UpdateTaskInput } from '../../../core/services/task-store.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { TaskDetailPanelComponent } from '../../aufgaben/task-detail-panel/task-detail-panel.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';

/** Persists whether the "done today" section is expanded, so it survives a reload. */
const COMPLETED_EXPANDED_STORAGE_KEY = 'todo-app.heute.completedExpanded';

/** How long the undo notice stays visible before a delete becomes final. */
const UNDO_DURATION_MS = 6000;

interface PendingUndo {
  task: Task;
  index: number;
}

@Component({
  selector: 'app-heute-page',
  standalone: true,
  imports: [PageHeaderComponent, TaskItemComponent, TaskDetailPanelComponent],
  templateUrl: './heute-page.component.html',
  styleUrl: './heute-page.component.scss',
})
export class HeutePageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly storage = inject(STORAGE);
  private readonly announcer = inject(AnnouncerService);
  private readonly userProfile = inject(UserProfileService);

  private readonly today = signal(new Date());

  protected readonly todayLabel = computed(() =>
    this.today().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  protected readonly greeting = computed(() => {
    const firstName = this.userProfile.displayName().split(' ')[0];
    return `${getTimeOfDayGreeting(this.today())}, ${firstName}! 👋`;
  });

  protected readonly todayTasks = this.taskStore.todayTasks;
  protected readonly overdueTasks = this.taskStore.overdueTasks;

  protected readonly hasNoOpenTasks = computed(
    () => this.todayTasks().length === 0 && this.overdueTasks().length === 0,
  );

  protected readonly summaryText = computed(() => {
    const todayCount = this.todayTasks().length;
    const overdueCount = this.overdueTasks().length;
    return overdueCount === 0
      ? `${todayCount} Aufgabe(n) für heute.`
      : `${todayCount} Aufgabe(n) für heute, ${overdueCount} überfällig.`;
  });

  private readonly todayTotalCount = this.taskStore.todayTotalCount;
  private readonly todayCompletedCount = this.taskStore.todayCompletedCount;

  /** `null` when there are no tasks due today, so the template can hide the indicator instead of showing a misleading "0 von 0". */
  protected readonly todayProgressText = computed(() => {
    const total = this.todayTotalCount();
    return total === 0 ? null : `${this.todayCompletedCount()} von ${total} erledigt`;
  });

  protected readonly todayProgressPercent = computed(() => {
    const total = this.todayTotalCount();
    return total === 0 ? 0 : Math.round((this.todayCompletedCount() / total) * 100);
  });

  protected readonly completedTasks = this.taskStore.todayCompletedTasks;

  protected readonly completedExpanded = signal(
    this.storage.getItem(COMPLETED_EXPANDED_STORAGE_KEY) === 'true',
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

  protected toggleCompletedExpanded(): void {
    const expanded = !this.completedExpanded();
    this.completedExpanded.set(expanded);
    this.storage.setItem(COMPLETED_EXPANDED_STORAGE_KEY, String(expanded));
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

  private findTaskById(id: string): Task | undefined {
    return [...this.todayTasks(), ...this.overdueTasks(), ...this.completedTasks()].find(
      (task) => task.id === id,
    );
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
}
