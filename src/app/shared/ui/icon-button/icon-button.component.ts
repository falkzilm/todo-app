import { Component, input, output } from '@angular/core';

export type IconButtonVariant = 'ghost' | 'outline';

let nextId = 0;

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
  /** Für Buttons, die eine ausklappbare Fläche steuern (z. B. Hamburger-Button, TDP-27). */
  readonly expanded = input<boolean | null>(null);
  /** ID des durch `expanded` gesteuerten Elements, gespiegelt als `aria-controls`. */
  readonly controls = input<string | null>(null);
  /**
   * Rein visueller Hinweis-Punkt (z. B. ungelesene Benachrichtigungen).
   * `false` blendet ihn aus; ein String zeigt ihn an und liefert zugleich
   * die für Screenreader nötige Zustandsbeschreibung (z. B. "1 neue"), die
   * per `aria-describedby` mit dem Button verknüpft wird — der Punkt selbst
   * bleibt `aria-hidden`.
   */
  readonly indicator = input<string | false>(false);
  protected readonly indicatorId = `app-icon-button-indicator-${nextId++}`;

  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit();
  }
}
