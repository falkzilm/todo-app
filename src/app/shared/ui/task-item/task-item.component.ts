import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../core/models/task.model';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [DatePipe, FormsModule, CheckboxComponent, IconButtonComponent],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.scss',
})
export class TaskItemComponent {
  readonly task = input.required<Task>();

  readonly toggleCompleted = output<void>();
  readonly remove = output<void>();

  protected onToggle(): void {
    this.toggleCompleted.emit();
  }

  protected onRemove(): void {
    this.remove.emit();
  }
}
