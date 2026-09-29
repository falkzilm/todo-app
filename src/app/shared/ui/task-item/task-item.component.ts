import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isTouchDevice } from '../../../core/device/pointer';
import { Category, DEFAULT_CATEGORIES } from '../../../core/models/category.model';
import { TASK_DRAG_DATA_FORMAT, Task } from '../../../core/models/task.model';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { IconComponent } from '../icon/icon.component';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

/** Category lookup by id, resolved once since `DEFAULT_CATEGORIES` is a fixed constant. */
const CATEGORY_BY_ID = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));

@Component({
  // Als Attribut-Selektor auf `li` statt als eigenes Element: die Aufgabe wird
  // stets innerhalb einer `<ul>`/`<ol>` gerendert, und ein zwischengeschobenes
  // `<app-task-item>`-Element würde dort die Listensemantik brechen (WCAG 1.3.1
  // "list"/"listitem" – <li> muss direktes Kind von <ul>/<ol> sein).
  selector: 'li[app-task-item]',
  standalone: true,
  imports: [FormsModule, CheckboxComponent, IconComponent, PriorityBadgeComponent],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.scss',
  host: {
    class: 'app-task-item',
    tabindex: '0',
    '[class.app-task-item--completed]': 'task().completed',
    '[attr.draggable]': "dragEnabled ? 'true' : null",
    '(click)': 'onCardClick($event)',
    '(keydown)': 'onCardKeydown($event)',
    '(dragstart)': 'onDragStart($event)',
  },
})
export class TaskItemComponent {
  readonly task = input.required<Task>();

  readonly toggleCompleted = output<void>();
  /** Card clicked (or opened via keyboard) outside the checkbox; the detail view opens in response. */
  readonly open = output<void>();

  /** Drag & drop rescheduling (DEMOPROJEK-45) is disabled on touch devices so it never interferes with scrolling. */
  protected readonly dragEnabled = !isTouchDevice();

  protected readonly category = computed<Category | null>(() => {
    const categoryId = this.task().categoryId;
    return categoryId !== null ? (CATEGORY_BY_ID.get(categoryId) ?? null) : null;
  });

  protected readonly categoryDotColor = computed(() => {
    const category = this.category();
    return category ? `var(--color-category-${category.color})` : null;
  });

  protected onToggle(): void {
    this.toggleCompleted.emit();
  }

  /** The checkbox already acts on its own; avoid also emitting `open` when its click bubbles up. */
  protected onCardClick(event: MouseEvent): void {
    if (this.isFromCheckbox(event)) {
      return;
    }
    this.open.emit();
  }

  /** Mirrors `onCardClick` for keyboard use; the checkbox already handles Enter/Space itself. */
  protected onCardKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || this.isFromCheckbox(event)) {
      return;
    }
    this.open.emit();
  }

  private isFromCheckbox(event: Event): boolean {
    return (event.target as HTMLElement).closest('.app-task-item__checkbox') !== null;
  }

  protected onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData(TASK_DRAG_DATA_FORMAT, this.task().id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }
}
