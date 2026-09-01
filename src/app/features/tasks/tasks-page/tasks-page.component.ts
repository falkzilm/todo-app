import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { Task } from './task.model';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.scss',
})
export class TasksPageComponent {
  protected readonly tasks = signal<Task[]>([
    { id: 1, title: 'Angular-Workspace einrichten', done: true },
    { id: 2, title: 'Aufgabenliste anzeigen', done: false },
  ]);

  protected readonly openCount = computed(() => this.tasks().filter((task) => !task.done).length);

  protected newTaskTitle = '';

  private nextId = 3;

  protected addTask(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      return;
    }

    this.tasks.update((tasks) => [...tasks, { id: this.nextId++, title, done: false }]);
    this.newTaskTitle = '';
  }

  protected toggleTask(id: number): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  protected removeTask(id: number): void {
    this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
  }
}
