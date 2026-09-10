import { Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly icon = input<IconName>();
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
