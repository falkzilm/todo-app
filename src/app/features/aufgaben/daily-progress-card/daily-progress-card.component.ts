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

  // "Keine Aufgaben für heute" (total === 0) blendet die Karte nicht aus, sondern
  // zeigt einen eigenen, ruhigen Text ohne Donut – so bleibt die Karte an fester
  // Position im Layout und die Seite "springt" nicht, wenn Aufgaben hinzugefügt werden.
  protected readonly hasTasks = computed(() => this.total() > 0);

  protected readonly title = computed(() => {
    if (this.completed() <= 0) {
      return 'Auf geht’s!';
    }
    if (this.completed() >= this.total()) {
      return 'Geschafft!';
    }
    return 'Tolle Arbeit!';
  });

  protected readonly progressText = computed(() => {
    const completed = this.completed();
    const total = this.total();
    if (completed <= 0) {
      return 'Du hast heute noch keine Aufgabe erledigt. Leg los! 💪';
    }
    if (completed >= total) {
      return `Du hast heute alle ${total} Aufgaben erledigt. 🎉`;
    }
    return `Du hast ${completed} von ${total} Aufgaben für heute erledigt. 🎉`;
  });
}
