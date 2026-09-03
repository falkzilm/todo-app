import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { getMonthGrid } from '../../../core/date/date-utils';
import { CalendarDate } from '../../../core/models/task.model';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { MonthGridComponent } from '../month-grid/month-grid.component';

/**
 * Wiederverwendbare Datumsauswahl für alle Umplanungs-Wege (DEMOPROJEK-42): ein
 * Auslöser-Button öffnet ein Popover mit dem bestehenden Monatsraster. Rein
 * präsentational - sie erhält das aktuelle Datum als Input und meldet eine
 * Auswahl per Output, ohne selbst irgendeinen Store zu ändern.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [MonthGridComponent, IconButtonComponent],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
})
export class DatePickerComponent {
  readonly value = input<CalendarDate | null>(null);
  readonly label = input('Datum auswählen');
  readonly placeholder = input('Datum wählen');

  readonly dateSelect = output<CalendarDate>();

  protected readonly open = signal(false);

  private readonly viewReference = signal(new Date());

  protected readonly monthLabel = computed(() =>
    this.viewReference().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
  );

  protected readonly gridLabel = computed(() => `Kalender ${this.monthLabel()}`);

  protected readonly days = computed(() => getMonthGrid(this.viewReference()));

  protected readonly displayValue = computed(() => {
    const value = this.value();
    if (value === null) {
      return this.placeholder();
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  private readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  constructor() {
    /** Popover-Öffnung merkt sich den angezeigten Monat frisch anhand des Inputs, damit die Vorbelegung sichtbar ist, und stellt danach den Tastaturfokus in das Raster. */
    effect(() => {
      if (!this.open()) {
        return;
      }

      const anchor = this.value();
      this.viewReference.set(anchor !== null ? new Date(`${anchor}T00:00:00`) : new Date());
      afterNextRender(() => this.focusActiveCell(), { injector: this.injector });
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected toggle(): void {
    this.open.update((isOpen) => !isOpen);
  }

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected onDaySelect(date: CalendarDate): void {
    this.dateSelect.emit(date);
    this.close();
  }

  protected onPopoverKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  private shiftMonth(delta: number): void {
    this.viewReference.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }

  private close(): void {
    this.open.set(false);
    this.triggerButton().nativeElement.focus();
  }

  private focusActiveCell(): void {
    const selectedCell = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.month-grid__day--selected',
    );
    const fallbackCell = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '[role="gridcell"][tabindex="0"]',
    );
    (selectedCell ?? fallbackCell)?.focus();
  }
}
