import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { todayAsCalendarDate } from '../../../core/models/task.model';
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

  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly tasks = this.taskStore.tasks;

  protected readonly openCount = computed(() => this.taskStore.openTasks().length);

  protected newTaskTitle = '';
  protected showEmptyTitleHint = false;

  protected addTask(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.titleInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.taskStore.add({ title, dueDate: todayAsCalendarDate() });
    this.newTaskTitle = '';
    this.titleInput().nativeElement.focus();
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
