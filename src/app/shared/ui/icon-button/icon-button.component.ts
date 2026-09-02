import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  readonly ariaLabel = input.required<string>();
  readonly disabled = input(false);

  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit();
  }
}
