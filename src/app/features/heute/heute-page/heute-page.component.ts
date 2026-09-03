import { Component, computed, inject, signal } from '@angular/core';
import { CalendarDate, Task } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { STORAGE } from '../../../core/services/storage.token';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';

/** Persists whether the "done today" section is expanded, so it survives a reload. */
const COMPLETED_EXPANDED_STORAGE_KEY = 'todo-app.heute.completedExpanded';

@Component({
  selector: 'app-heute-page',
  standalone: true,
  imports: [PageHeaderComponent, TaskItemComponent],
  templateUrl: './heute-page.component.html',
  styleUrl: './heute-page.component.scss',
})
export class HeutePageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly storage = inject(STORAGE);
  private readonly announcer = inject(AnnouncerService);

  private readonly today = signal(new Date());

  protected readonly todayLabel = computed(() =>
    this.today().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

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
    const task = this.findTaskById(id);
    this.taskStore.remove(id);
    if (task) {
      this.announcer.announce(`„${task.title}“ gelöscht.`);
    }
  }

  private findTaskById(id: string): Task | undefined {
    return [...this.todayTasks(), ...this.overdueTasks(), ...this.completedTasks()].find(
      (task) => task.id === id,
    );
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
}
