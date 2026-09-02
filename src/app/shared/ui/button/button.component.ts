import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);

  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit();
  }
}
