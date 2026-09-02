import { DatePipe } from '@angular/common';
import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
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
  readonly titleSave = output<string>();
  readonly notesSave = output<string | null>();

  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private readonly notesInput = viewChild<ElementRef<HTMLInputElement>>('notesInput');

  protected readonly editingTitle = signal(false);
  protected readonly editingNotes = signal(false);
  protected titleDraft = '';
  protected notesDraft = '';

  constructor() {
    effect(() => {
      if (!this.editingTitle()) {
        return;
      }
      const element = this.titleInput()?.nativeElement;
      element?.focus();
      element?.select();
    });

    effect(() => {
      if (!this.editingNotes()) {
        return;
      }
      const element = this.notesInput()?.nativeElement;
      element?.focus();
      element?.select();
    });
  }

  protected onToggle(): void {
    this.toggleCompleted.emit();
  }

  /** The checkbox, delete button and inline-edit fields already act on their own; avoid double-emitting when their click bubbles up. */
  protected onRowClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.closest('.app-task-item__checkbox') ||
      target.closest('.app-task-item__actions') ||
      target.closest('.app-task-item__title-field') ||
      target.closest('.app-task-item__notes-field')
    ) {
      return;
    }
    this.onToggle();
  }

  protected onRemove(): void {
    this.remove.emit();
  }

  protected startEditingTitle(): void {
    this.titleDraft = this.task().title;
    this.editingTitle.set(true);
  }

  protected commitTitle(): void {
    if (!this.editingTitle()) {
      return;
    }
    this.editingTitle.set(false);

    const title = this.titleDraft.trim();
    if (!title || title === this.task().title) {
      return;
    }
    this.titleSave.emit(title);
  }

  protected cancelTitleEdit(): void {
    this.editingTitle.set(false);
  }

  protected onTitleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTitleEdit();
    }
  }

  protected startEditingNotes(): void {
    this.notesDraft = this.task().notes ?? '';
    this.editingNotes.set(true);
  }

  protected commitNotes(): void {
    if (!this.editingNotes()) {
      return;
    }
    this.editingNotes.set(false);

    const notes = this.notesDraft.trim() || null;
    if (notes === (this.task().notes ?? null)) {
      return;
    }
    this.notesSave.emit(notes);
  }

  protected cancelNotesEdit(): void {
    this.editingNotes.set(false);
  }

  protected onNotesKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitNotes();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelNotesEdit();
    }
  }
}
