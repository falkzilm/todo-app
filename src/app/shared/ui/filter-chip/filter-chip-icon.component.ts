import { Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-filter-chip-icon',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './filter-chip-icon.component.html',
  styleUrl: './filter-chip-icon.component.scss',
})
export class FilterChipIconComponent {
  readonly icon = input.required<IconName>();
  readonly ariaLabel = input.required<string>();
  readonly active = input(false);

  readonly pressed = output<void>();

  protected onClick(): void {
    this.pressed.emit();
  }

  /** Native buttons trigger click on Enter (keydown) and Space (keyup); handling both explicitly here keeps behavior consistent across browsers and jsdom. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.onClick();
  }
}
