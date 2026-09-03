import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { MonthGridDay } from '../../../core/date/date-utils';
import { CalendarDate, todayAsCalendarDate } from '../../../core/models/task.model';
import { DayTaskSummary } from '../../../core/services/task-store.service';

const DAYS_PER_WEEK = 7;

interface Weekday {
  readonly short: string;
  readonly full: string;
}

const WEEKDAYS: readonly Weekday[] = [
  { short: 'Mo', full: 'Montag' },
  { short: 'Di', full: 'Dienstag' },
  { short: 'Mi', full: 'Mittwoch' },
  { short: 'Do', full: 'Donnerstag' },
  { short: 'Fr', full: 'Freitag' },
  { short: 'Sa', full: 'Samstag' },
  { short: 'So', full: 'Sonntag' },
];

/** Arrow-key offsets within the flat 42-day grid; Home/End are not needed for this pure display grid. */
const ARROW_KEY_DELTAS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -DAYS_PER_WEEK,
  ArrowDown: DAYS_PER_WEEK,
};

/**
 * Reine Darstellungskomponente für ein Monatsraster (6x7 Tage). Kennt keine
 * Aufgabenlogik; sie erhält die Tage fertig berechnet (siehe `getMonthGrid`)
 * sowie optionale Aufgaben-Indikatoren pro Tag fertig aggregiert (siehe
 * `TaskStoreService#taskSummaryByDate`) und stellt beides als barrierefreies
 * Grid mit Roving-Tabindex dar.
 */
@Component({
  selector: 'app-month-grid',
  standalone: true,
  templateUrl: './month-grid.component.html',
  styleUrl: './month-grid.component.scss',
})
export class MonthGridComponent {
  readonly days = input.required<readonly MonthGridDay[]>();
  readonly label = input.required<string>();
  readonly today = input<CalendarDate>(todayAsCalendarDate());
  readonly taskSummaries = input<ReadonlyMap<CalendarDate, DayTaskSummary>>(new Map());

  protected readonly weekdays = WEEKDAYS;

  protected readonly weeks = computed(() => {
    const days = this.days();
    const weeks: MonthGridDay[][] = [];
    for (let index = 0; index < days.length; index += DAYS_PER_WEEK) {
      weeks.push(days.slice(index, index + DAYS_PER_WEEK));
    }
    return weeks;
  });

  private readonly focusedDate = signal<CalendarDate | null>(null);

  private readonly cellElements = viewChildren<ElementRef<HTMLElement>>('cell');

  constructor() {
    effect(() => {
      const days = this.days();
      const focused = this.focusedDate();
      if (focused !== null && days.some((day) => day.date === focused)) {
        return;
      }

      const today = this.today();
      const fallback =
        days.find((day) => day.date === today) ?? days.find((day) => day.inCurrentMonth) ?? days[0];
      this.focusedDate.set(fallback?.date ?? null);
    });
  }

  protected isFocusable(day: MonthGridDay): boolean {
    return day.date === this.focusedDate();
  }

  protected isToday(day: MonthGridDay): boolean {
    return day.date === this.today();
  }

  protected dayAriaLabel(day: MonthGridDay): string {
    const date = new Date(`${day.date}T00:00:00`);
    const label = date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = [this.isToday(day) ? `${label}, heute` : label];

    const summaryLabel = this.taskSummaryAriaLabel(day);
    if (summaryLabel !== null) {
      parts.push(summaryLabel);
    }

    return parts.join(', ');
  }

  protected taskSummaryFor(day: MonthGridDay): DayTaskSummary | undefined {
    return this.taskSummaries().get(day.date);
  }

  private taskSummaryAriaLabel(day: MonthGridDay): string | null {
    const summary = this.taskSummaryFor(day);
    if (summary === undefined) {
      return null;
    }

    if (summary.openCount > 0) {
      return summary.openCount === 1 ? '1 offene Aufgabe' : `${summary.openCount} offene Aufgaben`;
    }

    return summary.allCompleted ? 'alle Aufgaben erledigt' : null;
  }

  protected onKeydown(event: KeyboardEvent, day: MonthGridDay): void {
    const delta = ARROW_KEY_DELTAS[event.key];
    if (delta === undefined) {
      return;
    }
    event.preventDefault();

    const days = this.days();
    const currentIndex = days.findIndex((candidate) => candidate.date === day.date);
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), days.length - 1);
    if (nextIndex === currentIndex) {
      return;
    }

    const nextDay = days[nextIndex];
    this.focusedDate.set(nextDay.date);
    this.cellElements()[nextIndex]?.nativeElement.focus();
  }
}
