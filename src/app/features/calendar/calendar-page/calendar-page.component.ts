import { Component, computed, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  protected readonly referenceDate = signal(new Date());

  protected readonly monthLabel = computed(() =>
    this.referenceDate().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
  );

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  private shiftMonth(delta: number): void {
    this.referenceDate.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }
}
