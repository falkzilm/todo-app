import { Component, ElementRef, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, DEFAULT_CATEGORIES } from '../../../core/models/category.model';
import { TaskPriority, TimeOfDay } from '../../../core/models/task.model';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

const PRIORITIES: readonly { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'Hoch' },
  { value: 'medium', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' },
];

export interface QuickAddTaskInput {
  title: string;
  categoryId: string | null;
  priority: TaskPriority | null;
  startTime: TimeOfDay | null;
}

/**
 * Karte am Ende der Aufgabenliste zum schnellen Anlegen (TDP-39): zeigt im
 * Ruhezustand nur Plus-Icon und Platzhalter, klappt bei Fokus zu einem
 * Eingabefeld mit optionalen Pills für Kategorie/Priorität und einer
 * Uhrzeit auf. Enter legt an, Escape verwirft die Eingabe.
 */
@Component({
  selector: 'app-task-quick-add',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './task-quick-add.component.html',
  styleUrl: './task-quick-add.component.scss',
})
export class TaskQuickAddComponent {
  readonly add = output<QuickAddTaskInput>();

  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');
  private readonly hostElement = viewChild.required<ElementRef<HTMLElement>>('host');

  protected readonly categories: readonly Category[] = DEFAULT_CATEGORIES;
  protected readonly priorities = PRIORITIES;

  protected title = '';
  protected categoryId: string | null = null;
  protected priority: TaskPriority | null = null;
  protected startTime: TimeOfDay | null = null;

  protected expanded = false;
  protected showEmptyTitleHint = false;

  protected onFocusIn(): void {
    this.expanded = true;
  }

  /** Collapses back to the placeholder card once focus leaves it, unless there's still a title to keep editing. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostElement().nativeElement.contains(next)) {
      return;
    }
    if (!this.title.trim()) {
      this.expanded = false;
    }
  }

  protected selectCategory(id: string): void {
    this.categoryId = this.categoryId === id ? null : id;
  }

  protected selectPriority(priority: TaskPriority): void {
    this.priority = this.priority === priority ? null : priority;
  }

  protected submit(): void {
    const title = this.title.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.titleInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.add.emit({
      title,
      categoryId: this.categoryId,
      priority: this.priority,
      startTime: this.startTime,
    });
    this.resetFields();
    this.titleInput().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancel();
    }
  }

  /** Escape discards whatever was entered and collapses the card back to its placeholder state. */
  private cancel(): void {
    this.resetFields();
    this.showEmptyTitleHint = false;
    this.expanded = false;
    this.titleInput().nativeElement.blur();
  }

  private resetFields(): void {
    this.title = '';
    this.categoryId = null;
    this.priority = null;
    this.startTime = null;
  }
}
