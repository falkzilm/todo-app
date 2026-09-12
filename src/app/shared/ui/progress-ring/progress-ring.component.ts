import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.scss',
})
export class ProgressRingComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  /** Accessible name (aria-label); the visual center label is decorative and hidden from AT. */
  readonly ariaLabel = input.required<string>();
  readonly ariaValueText = input.required<string>();

  // Kreisgeometrie in einer 100x100-Viewbox; der Umfang bestimmt stroke-dasharray/-offset.
  protected readonly radius = 42;
  protected readonly circumference = 2 * Math.PI * this.radius;

  protected readonly percent = computed(() => {
    const max = this.max();
    if (max <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (this.value() / max) * 100));
  });

  protected readonly dashOffset = computed(() => this.circumference * (1 - this.percent() / 100));
}
