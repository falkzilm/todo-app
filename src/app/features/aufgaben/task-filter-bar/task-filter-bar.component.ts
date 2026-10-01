import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_CATEGORIES } from '../../../core/models/category.model';
import { IconName } from '../../../shared/ui/icon/icon.component';
import { CheckboxComponent } from '../../../shared/ui/checkbox/checkbox.component';
import { FilterChipComponent } from '../../../shared/ui/filter-chip/filter-chip.component';
import { FilterChipIconComponent } from '../../../shared/ui/filter-chip/filter-chip-icon.component';

/** The task list filters this bar offers; `TaskStoreService` exposes a matching sorted signal for each. */
export type TaskFilterId = 'today' | 'week' | 'important';

/** How the Sliders popover's "Sortierung" option re-orders the active filter's tasks. */
export type TaskSortOption = 'time' | 'priority' | 'title';

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

export const TASK_FILTER_IDS: readonly TaskFilterId[] = TASK_FILTER_OPTIONS.map(
  (option) => option.id,
);

/** Type guard for a value read from an untrusted source (e.g. the URL's `filter` query param). */
export function isTaskFilterId(value: string | null): value is TaskFilterId {
  return (TASK_FILTER_IDS as readonly string[]).includes(value ?? '');
}

interface TaskSortOptionConfig {
  readonly value: TaskSortOption;
  readonly label: string;
}

const TASK_SORT_OPTIONS: readonly TaskSortOptionConfig[] = [
  { value: 'time', label: 'Uhrzeit' },
  { value: 'priority', label: 'Priorität' },
  { value: 'title', label: 'Titel' },
];

/** Unique id per instance for the popover's `aria-controls` link, in case the bar ever renders more than once. */
let nextMenuId = 0;

@Component({
  selector: 'app-task-filter-bar',
  standalone: true,
  imports: [FormsModule, FilterChipComponent, FilterChipIconComponent, CheckboxComponent],
  templateUrl: './task-filter-bar.component.html',
  styleUrl: './task-filter-bar.component.scss',
})
export class TaskFilterBarComponent {
  readonly active = input.required<TaskFilterId>();
  readonly sort = input<TaskSortOption>('time');
  readonly categoryId = input<string | null>(null);
  readonly showCompleted = input(true);

  readonly filterChange = output<TaskFilterId>();
  readonly sortChange = output<TaskSortOption>();
  readonly categoryChange = output<string | null>();
  readonly showCompletedChange = output<boolean>();

  protected readonly options = TASK_FILTER_OPTIONS;
  protected readonly sortOptions = TASK_SORT_OPTIONS;
  protected readonly categories = DEFAULT_CATEGORIES;

  protected readonly menuId = `task-filter-menu-${nextMenuId++}`;
  protected readonly menuOpen = signal(false);

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    /** Moves keyboard focus into the popover's first option as soon as it opens. */
    effect(() => {
      if (!this.menuOpen()) {
        return;
      }
      afterNextRender(
        () => {
          // The popover can already have been closed again (e.g. a quick Escape)
          // by the time this fires, since it's deferred to the next render.
          if (!this.menuOpen()) {
            return;
          }
          this.elementRef.nativeElement
            .querySelector<HTMLElement>('.task-filter-bar__popover .task-filter-bar__pill')
            ?.focus();
        },
        { injector: this.injector },
      );
    });
  }

  protected selectFilter(id: TaskFilterId): void {
    if (id !== this.active()) {
      this.filterChange.emit(id);
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  protected selectAllCategories(): void {
    this.categoryChange.emit(null);
  }

  /** Clicking the already-active category clears it back to "Alle". */
  protected selectCategory(id: string): void {
    this.categoryChange.emit(this.categoryId() === id ? null : id);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.closeMenu();
  }

  private closeMenu(): void {
    this.menuOpen.set(false);
    this.elementRef.nativeElement
      .querySelector<HTMLButtonElement>('.app-filter-chip-icon')
      ?.focus();
  }
}
