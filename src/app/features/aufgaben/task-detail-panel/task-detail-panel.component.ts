import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_CATEGORIES } from '../../../core/models/category.model';
import {
  CalendarDate,
  Task,
  TaskPriority,
  TimeOfDay,
  isValidTimeRange,
} from '../../../core/models/task.model';
import { UpdateTaskInput } from '../../../core/services/task-store.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { DatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { IconButtonComponent } from '../../../shared/ui/icon-button/icon-button.component';

const PRIORITIES: readonly { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'Hoch' },
  { value: 'medium', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' },
];

/**
 * Seitenpanel für Anzeige und Bearbeitung einer einzelnen Aufgabe (TDP-38).
 * Rein präsentational: erhält die Aufgabe als Input, validiert Eingaben lokal
 * und meldet Speichern/Löschen/Schließen per Output nach oben, statt selbst
 * den `TaskStoreService` anzufassen — Store-Zugriff, Undo-Ablauf und
 * Fokus-Rücksprung zur auslösenden Karte bleiben Sache der jeweiligen Seite,
 * die dieses Panel einbindet (siehe `TasksPageComponent` u.a.).
 */
@Component({
  selector: 'app-task-detail-panel',
  standalone: true,
  imports: [FormsModule, ButtonComponent, DatePickerComponent, IconComponent, IconButtonComponent],
  templateUrl: './task-detail-panel.component.html',
  styleUrl: './task-detail-panel.component.scss',
})
export class TaskDetailPanelComponent {
  /** `null` means the panel is closed; a task opens it pre-filled with that task's values. */
  readonly task = input<Task | null>(null);

  readonly save = output<UpdateTaskInput>();
  readonly delete = output<void>();
  /** Emitted on Escape, the close button, and after a successful save or delete. */
  readonly closed = output<void>();

  protected readonly categories = [...DEFAULT_CATEGORIES];
  protected readonly priorities = PRIORITIES;

  protected title = '';
  protected notes = '';
  protected dueDate: CalendarDate | null = null;
  protected startTime: TimeOfDay | null = null;
  protected endTime: TimeOfDay | null = null;
  protected categoryId: string | null = null;
  protected priority: TaskPriority | null = null;
  protected subtitle = '';

  protected titleError: string | null = null;
  protected timeRangeError: string | null = null;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly titleField = viewChild<ElementRef<HTMLInputElement>>('titleField');
  private readonly endTimeField = viewChild<ElementRef<HTMLInputElement>>('endTimeField');
  private readonly injector = inject(Injector);

  constructor() {
    /** Every time a (new) task opens the panel, its values replace the form state and keyboard focus moves into the panel (AC: Fokus wandert beim Öffnen ins Panel). */
    effect(() => {
      const task = this.task();
      if (!task) {
        return;
      }

      this.title = task.title;
      this.notes = task.notes ?? '';
      this.dueDate = task.dueDate;
      this.startTime = task.startTime;
      this.endTime = task.endTime;
      this.categoryId = task.categoryId;
      this.priority = task.priority;
      this.subtitle = task.subtitle ?? '';
      this.titleError = null;
      this.timeRangeError = null;

      afterNextRender(() => this.titleField()?.nativeElement.focus(), { injector: this.injector });
    });
  }

  protected onDueDateSelect(date: CalendarDate): void {
    this.dueDate = date;
  }

  /** Clicking the already-active pill clears the selection instead of leaving it stuck. */
  protected onCategorySelect(id: string): void {
    this.categoryId = this.categoryId === id ? null : id;
  }

  protected onPrioritySelect(priority: TaskPriority): void {
    this.priority = this.priority === priority ? null : priority;
  }

  protected onSave(): void {
    const title = this.title.trim();
    this.titleError = title ? null : 'Titel darf nicht leer sein.';
    this.timeRangeError = isValidTimeRange(this.startTime, this.endTime)
      ? null
      : 'Die Endzeit darf nicht vor der Startzeit liegen.';

    if (this.titleError) {
      this.titleField()?.nativeElement.focus();
      return;
    }
    if (this.timeRangeError) {
      this.endTimeField()?.nativeElement.focus();
      return;
    }

    this.save.emit({
      title,
      notes: this.notes.trim() || null,
      dueDate: this.dueDate,
      startTime: this.startTime,
      endTime: this.endTime,
      categoryId: this.categoryId,
      priority: this.priority,
      subtitle: this.subtitle.trim() || null,
    });
    this.closed.emit();
  }

  protected onDelete(): void {
    this.delete.emit();
    this.closed.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Keeps Tab from ever leaving the panel while it's open (AC: Tab-Fokus verlässt das Panel nicht). */
  private trapFocus(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Queried live (not cached) so an open date-picker popover's own controls are included while it's expanded. */
  private getFocusableElements(): HTMLElement[] {
    const panelElement = this.panel()?.nativeElement;
    if (!panelElement) {
      return [];
    }

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(panelElement.querySelectorAll<HTMLElement>(selector));
  }
}
