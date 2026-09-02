import { Component, computed, inject, signal } from '@angular/core';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';

@Component({
  selector: 'app-heute-page',
  standalone: true,
  imports: [PageHeaderComponent, TaskItemComponent],
  templateUrl: './heute-page.component.html',
  styleUrl: './heute-page.component.scss',
})
export class HeutePageComponent {
  private readonly taskStore = inject(TaskStoreService);

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

  protected toggleTask(id: string): void {
    this.taskStore.toggleCompleted(id);
  }

  protected removeTask(id: string): void {
    this.taskStore.remove(id);
  }

  protected saveTitle(id: string, title: string): void {
    this.taskStore.update(id, { title });
  }

  protected saveNotes(id: string, notes: string | null): void {
    this.taskStore.update(id, { notes });
  }
}
