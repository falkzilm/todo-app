import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type Priority = 'high' | 'medium' | 'low';

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss',
})
export class PriorityBadgeComponent {
  readonly priority = input.required<Priority>();

  protected readonly label = computed(() => PRIORITY_LABELS[this.priority()]);
  protected readonly ariaLabel = computed(() => `Priorität: ${this.label()}`);
}
