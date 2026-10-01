import { Component, input, output } from '@angular/core';
import { IconName } from '../../../shared/ui/icon/icon.component';
import { FilterChipComponent } from '../../../shared/ui/filter-chip/filter-chip.component';
import { FilterChipIconComponent } from '../../../shared/ui/filter-chip/filter-chip-icon.component';

/** The task list filters this bar offers; `TaskStoreService` exposes a matching sorted signal for each. */
export type TaskFilterId = 'today' | 'week' | 'important';

interface TaskFilterOption {
  readonly id: TaskFilterId;
  readonly icon: IconName;
  readonly label: string;
}

const TASK_FILTER_OPTIONS: readonly TaskFilterOption[] = [
  { id: 'today', icon: 'sun', label: 'Heute' },
  { id: 'week', icon: 'calendar-range', label: 'Diese Woche' },
  { id: 'important', icon: 'star', label: 'Wichtig' },
];

@Component({
  selector: 'app-task-filter-bar',
  standalone: true,
  imports: [FilterChipComponent, FilterChipIconComponent],
  templateUrl: './task-filter-bar.component.html',
  styleUrl: './task-filter-bar.component.scss',
})
export class TaskFilterBarComponent {
  readonly active = input.required<TaskFilterId>();

  readonly filterChange = output<TaskFilterId>();

  protected readonly options = TASK_FILTER_OPTIONS;

  protected selectFilter(id: TaskFilterId): void {
    if (id !== this.active()) {
      this.filterChange.emit(id);
    }
  }
}
