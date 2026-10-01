import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CalendarDate } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { IconButtonComponent } from '../../../shared/ui/icon-button/icon-button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

interface TaskNotification {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
}

let nextId = 0;

function formatOverdueDate(date: CalendarDate): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
  });
}

/**
 * There's no notifications backend/source (TDP-40's open question): hints are derived
 * from the existing task data instead - overdue tasks and today's still-open scheduled
 * tasks. No push/system notifications; real reminders would be a separate item.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [IconButtonComponent, IconComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly panelId = `notification-bell-panel-${nextId++}`;
  protected readonly open = signal(false);

  protected readonly notifications = computed<readonly TaskNotification[]>(() => {
    const overdue = this.taskStore.overdueTasks().map((task) => ({
      id: task.id,
      title: task.title,
      reason: `Überfällig seit ${formatOverdueDate(task.dueDate as CalendarDate)}`,
    }));

    const dueToday = this.taskStore
      .todayTasks()
      .filter((task) => task.startTime !== null)
      .map((task) => ({
        id: task.id,
        title: task.title,
        reason: `Heute noch offen, ${task.startTime} Uhr`,
      }));

    return [...overdue, ...dueToday];
  });

  protected readonly unreadCount = computed(() => this.notifications().length);

  protected readonly ariaLabel = computed(() => {
    const count = this.unreadCount();
    return count > 0 ? `Benachrichtigungen, ${count} neue` : 'Benachrichtigungen';
  });

  protected readonly indicator = computed(() => {
    const count = this.unreadCount();
    return count > 0 ? `${count} neue Benachrichtigung(en)` : false;
  });

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected toggle(): void {
    const willOpen = !this.open();
    this.open.set(willOpen);
    if (willOpen) {
      afterNextRender(() => this.focusPanel(), { injector: this.injector });
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeAndFocusTrigger();
    }
  }

  /** Mirrors the sidebar user menu: closes when focus leaves the component entirely (e.g. Tab). */
  protected onPanelFocusOut(event: FocusEvent): void {
    const nextFocus = event.relatedTarget as Node | null;
    if (nextFocus && this.elementRef.nativeElement.contains(nextFocus)) {
      return;
    }
    this.open.set(false);
  }

  private closeAndFocusTrigger(): void {
    this.open.set(false);
    this.elementRef.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
  }

  /**
   * Guarded by `open()`: the panel can already have closed again (e.g. via Escape) by the
   * time this post-render callback runs.
   */
  private focusPanel(): void {
    if (!this.open()) {
      return;
    }
    this.elementRef.nativeElement.querySelector<HTMLElement>('.notification-bell__panel')?.focus();
  }
}
