import { Component, input, output } from '@angular/core';

export type IconButtonVariant = 'ghost' | 'outline';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  readonly ariaLabel = input.required<string>();
  readonly disabled = input(false);
  readonly variant = input<IconButtonVariant>('ghost');
  /**
   * Rein visueller Hinweis-Punkt (z. B. ungelesene Benachrichtigungen).
   * Der Zustand muss zusätzlich über `ariaLabel` sprachlich transportiert
   * werden (z. B. "Benachrichtigungen, 1 neue") — der Punkt selbst ist
   * `aria-hidden`.
   */
  readonly indicator = input(false);

  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit();
  }
}
