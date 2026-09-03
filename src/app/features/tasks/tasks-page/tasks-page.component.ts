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
import { CalendarDate, Task, todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
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
  imports: [FormsModule, PageHeaderComponent, TaskItemComponent],
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

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.undoTimeoutId));
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

  protected saveTitle(id: string, title: string): void {
    this.taskStore.update(id, { title });
  }

  protected saveNotes(id: string, notes: string | null): void {
    this.taskStore.update(id, { notes });
  }

  protected saveDueDate(id: string, dueDate: CalendarDate): void {
    this.taskStore.update(id, { dueDate });
  }

  protected resetToDemoData(): void {
    const confirmed = window.confirm('Alle Aufgaben löschen und auf die Demo-Daten zurücksetzen?');
    if (!confirmed) {
      return;
    }

    this.taskStore.reset();
  }
}
