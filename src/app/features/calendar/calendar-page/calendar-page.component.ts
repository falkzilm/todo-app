import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getMonthGrid } from '../../../core/date/date-utils';
import { CalendarDate, todayAsCalendarDate } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';
import { MonthGridComponent } from '../../../shared/ui/month-grid/month-grid.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, MonthGridComponent, TaskItemComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly taskStore = inject(TaskStoreService);

  private readonly quickAddInput =
    viewChild.required<ElementRef<HTMLInputElement>>('quickAddInput');

  protected readonly taskSummaries = this.taskStore.taskSummaryByDate;

  protected readonly referenceDate = signal(new Date());

  protected readonly monthLabel = computed(() =>
    this.referenceDate().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
  );

  protected readonly gridLabel = computed(() => `Kalender ${this.monthLabel()}`);

  protected readonly days = computed(() => getMonthGrid(this.referenceDate()));

  /** The day selected in the grid; defaults to today when the calendar view is opened. */
  protected readonly selectedDate = signal<CalendarDate>(todayAsCalendarDate());

  protected readonly selectedDateLabel = computed(() =>
    new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  protected readonly selectedDayTasks = computed(() =>
    this.taskStore.tasksForDate(this.selectedDate())(),
  );

  protected newTaskTitle = '';
  protected showEmptyTitleHint = false;

  constructor() {
    // Resets the quick-add field whenever the selected day changes, so a
    // half-typed title never ends up attached to a different day.
    effect(() => {
      this.selectedDate();
      this.newTaskTitle = '';
      this.showEmptyTitleHint = false;
    });
  }

  protected addTaskForSelectedDay(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.quickAddInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.taskStore.add({ title, dueDate: this.selectedDate() });
    this.newTaskTitle = '';
    this.quickAddInput().nativeElement.focus();
  }

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected goToToday(): void {
    this.referenceDate.set(new Date());
  }

  protected selectDay(date: CalendarDate): void {
    this.selectedDate.set(date);
  }

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

  protected saveDueDate(id: string, dueDate: CalendarDate): void {
    this.taskStore.update(id, { dueDate });
  }

  /** Drag & drop rescheduling (DEMOPROJEK-45): dropping a task from the day list onto a grid cell. */
  protected onTaskDrop(event: { taskId: string; date: CalendarDate }): void {
    this.taskStore.update(event.taskId, { dueDate: event.date });
  }

  private shiftMonth(delta: number): void {
    this.referenceDate.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }
}
