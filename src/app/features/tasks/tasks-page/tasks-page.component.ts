import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { TaskStoreService, UpdateTaskInput } from '../../../core/services/task-store.service';
import { TaskDetailPanelComponent } from '../../aufgaben/task-detail-panel/task-detail-panel.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';

/** How long the undo notice stays visible before a delete becomes final. */
const UNDO_DURATION_MS = 6000;

interface PendingUndo {
  task: Task;
  index: number;
}

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TaskItemComponent, TaskDetailPanelComponent],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.scss',
})
export class TasksPageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly announcer = inject(AnnouncerService);

  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly tasks = this.taskStore.tasks;

  protected readonly openCount = computed(() => this.taskStore.openTasks().length);

  protected newTaskTitle = '';
  protected showEmptyTitleHint = false;

  /** The most recently deleted task, while its undo notice is still shown. */
  protected readonly pendingUndo = signal<PendingUndo | null>(null);
  private undoTimeoutId?: ReturnType<typeof setTimeout>;

  /** Id of the task currently open in the detail panel, or `null` when it's closed (TDP-38). */
  protected readonly selectedTaskId = signal<string | null>(null);

  protected readonly selectedTask = computed(
    () => this.tasks().find((task) => task.id === this.selectedTaskId()) ?? null,
  );

  /** The card that was focused when the panel opened, so focus can return to it on close. */
  private triggerElement: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.undoTimeoutId));
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

  protected onPanelClosed(): void {
    this.selectedTaskId.set(null);
    const trigger = this.triggerElement;
    this.triggerElement = null;
    if (trigger?.isConnected) {
      trigger.focus();
    }
  }

  protected addTask(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.titleInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.taskStore.add({ title, dueDate: todayAsCalendarDate() });
    this.announcer.announce(`„${title}“ hinzugefügt.`);
    this.newTaskTitle = '';
    this.titleInput().nativeElement.focus();
  }

  protected toggleTask(id: string): void {
    const task = this.taskStore.tasks().find((candidate) => candidate.id === id);
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

  protected onPanelDelete(): void {
    const id = this.selectedTaskId();
    if (id) {
      this.removeTask(id);
    }
  }

  protected resetToDemoData(): void {
    const confirmed = window.confirm('Alle Aufgaben löschen und auf die Demo-Daten zurücksetzen?');
    if (!confirmed) {
      return;
    }

    this.taskStore.reset();
  }
}
