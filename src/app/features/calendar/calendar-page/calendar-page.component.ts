import { Component, computed, inject, signal } from '@angular/core';
import { getMonthGrid } from '../../../core/date/date-utils';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { MonthGridComponent } from '../month-grid/month-grid.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [PageHeaderComponent, MonthGridComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly taskStore = inject(TaskStoreService);

  protected readonly taskSummaries = this.taskStore.taskSummaryByDate;

  protected readonly referenceDate = signal(new Date());

  protected readonly monthLabel = computed(() =>
    this.referenceDate().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
  );

  protected readonly gridLabel = computed(() => `Kalender ${this.monthLabel()}`);

  protected readonly days = computed(() => getMonthGrid(this.referenceDate()));

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected goToToday(): void {
    this.referenceDate.set(new Date());
  }

  private shiftMonth(delta: number): void {
    this.referenceDate.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }
}
