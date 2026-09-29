import { Component, computed, input } from '@angular/core';
import { ProgressRingComponent } from '../../../shared/ui/progress-ring/progress-ring.component';

@Component({
  selector: 'app-daily-progress-card',
  standalone: true,
  imports: [ProgressRingComponent],
  templateUrl: './daily-progress-card.component.html',
  styleUrl: './daily-progress-card.component.scss',
})
export class DailyProgressCardComponent {
  readonly completed = input.required<number>();
  readonly total = input.required<number>();

  protected readonly hasTasks = computed(() => this.total() > 0);

  protected readonly progressText = computed(
    () => `Du hast ${this.completed()} von ${this.total()} Aufgaben für heute erledigt. 🎉`,
  );
}
