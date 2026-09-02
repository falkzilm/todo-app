import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TaskItemComponent],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.scss',
})
export class TasksPageComponent {
  private readonly taskStore = inject(TaskStoreService);

  protected readonly tasks = this.taskStore.tasks;

  protected readonly openCount = computed(() => this.taskStore.openTasks().length);

  protected newTaskTitle = '';

  protected addTask(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      return;
    }

    this.taskStore.add({ title });
    this.newTaskTitle = '';
  }

  protected toggleTask(id: string): void {
    this.taskStore.toggleCompleted(id);
  }

  protected removeTask(id: string): void {
    this.taskStore.remove(id);
  }

  protected resetToDemoData(): void {
    const confirmed = window.confirm('Alle Aufgaben löschen und auf die Demo-Daten zurücksetzen?');
    if (!confirmed) {
      return;
    }

    this.taskStore.reset();
  }
}
