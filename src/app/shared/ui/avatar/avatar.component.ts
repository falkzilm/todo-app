import { Component, computed, effect, input, signal } from '@angular/core';

/**
 * Initialen aus einem Namen: erster + letzter Wortanfangsbuchstabe bei
 * mehrteiligen Namen ("Laura Becker" -> "LB"), sonst nur der erste
 * Buchstabe ("Cher" -> "C").
 */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string>();
  /** true, wenn der Name bereits sichtbar daneben steht (z. B. Nutzerkarte) - dann ist der Avatar rein dekorativ. */
  readonly decorative = input(false);
  readonly ariaLabel = input<string>();

  protected readonly imageFailed = signal(false);

  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed());
  protected readonly initials = computed(() => initialsFromName(this.name()));
  protected readonly label = computed(() => this.ariaLabel() ?? this.name());

  constructor() {
    // Ein neues Bild (auch dieselbe URL erneut) verdient einen neuen Ladeversuch.
    effect(() => {
      this.src();
      this.imageFailed.set(false);
    });
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
