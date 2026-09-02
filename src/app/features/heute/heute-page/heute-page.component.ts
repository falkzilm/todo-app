import { Component, computed, inject, signal } from '@angular/core';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-heute-page',
  standalone: true,
  imports: [PageHeaderComponent],
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
}
