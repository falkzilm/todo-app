import { Component, ElementRef, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-quick-add',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-quick-add.component.html',
  styleUrl: './task-quick-add.component.scss',
})
export class TaskQuickAddComponent {
  readonly add = output<string>();

  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  protected title = '';
  protected showEmptyTitleHint = false;

  protected submit(): void {
    const title = this.title.trim();
    if (!title) {
      this.showEmptyTitleHint = true;
      this.titleInput().nativeElement.focus();
      return;
    }

    this.showEmptyTitleHint = false;
    this.add.emit(title);
    this.title = '';
    this.titleInput().nativeElement.focus();
  }
}
