import { Component, computed, inject, signal } from '@angular/core';
import { getTimeOfDayGreeting } from '../../../core/date/greeting';
import { CalendarDate, Task, todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { TaskItemComponent } from '../../../shared/ui/task-item/task-item.component';
import { DailyProgressCardComponent } from '../daily-progress-card/daily-progress-card.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { TaskFilterBarComponent, TaskFilterId } from '../task-filter-bar/task-filter-bar.component';
import { TaskQuickAddComponent } from '../task-quick-add/task-quick-add.component';

/** Shown below the filter bar's chips when the active filter has no matching tasks. */
const EMPTY_STATE_TEXT_BY_FILTER: Record<TaskFilterId, string> = {
  today: 'Heute steht nichts an.',
  week: 'Diese Woche steht nichts an.',
  important: 'Keine wichtigen Aufgaben.',
};

@Component({
  selector: 'app-aufgaben-page',
  standalone: true,
  imports: [
    TaskItemComponent,
    TaskFilterBarComponent,
    DailyProgressCardComponent,
    NotificationBellComponent,
    TaskQuickAddComponent,
  ],
  templateUrl: './aufgaben-page.component.html',
  styleUrl: './aufgaben-page.component.scss',
})
export class AufgabenPageComponent {
  private readonly taskStore = inject(TaskStoreService);
  private readonly announcer = inject(AnnouncerService);
  private readonly userProfile = inject(UserProfileService);

  private readonly today = signal(new Date());

  protected readonly greeting = computed(() => {
    const firstName = this.userProfile.displayName().split(' ')[0];
    return `${getTimeOfDayGreeting(this.today())}, ${firstName}! 👋`;
  });

  protected readonly activeFilter = signal<TaskFilterId>('today');

  protected readonly todayTotalCount = this.taskStore.todayTotalCount;
  protected readonly todayCompletedCount = this.taskStore.todayCompletedCount;

  protected readonly filteredTasks = computed<readonly Task[]>(() => {
    switch (this.activeFilter()) {
      case 'week':
        return this.taskStore.tasksThisWeek();
      case 'important':
        return this.taskStore.importantTasks();
      case 'today':
        return this.taskStore.tasksToday();
    }
  });

  protected readonly emptyStateText = computed(
    () => EMPTY_STATE_TEXT_BY_FILTER[this.activeFilter()],
  );

  protected selectFilter(filter: TaskFilterId): void {
    this.activeFilter.set(filter);
  }

  protected addTask(title: string): void {
    this.taskStore.add({ title, dueDate: todayAsCalendarDate() });
    this.announcer.announce(`„${title}“ hinzugefügt.`);
  }

  protected toggleTask(id: string): void {
    const task = this.findTaskById(id);
    this.taskStore.toggleCompleted(id);
    if (task) {
      const completed = !task.completed;
      this.announcer.announce(`„${task.title}“ als ${completed ? 'erledigt' : 'offen'} markiert.`);
    }
  }

  protected removeTask(id: string): void {
    const task = this.findTaskById(id);
    this.taskStore.remove(id);
    if (task) {
      this.announcer.announce(`„${task.title}“ gelöscht.`);
    }
  }

  protected saveTitle(id: string, title: string): void {
    this.taskStore.update(id, { title });
  }

  protected saveNotes(id: string, notes: string | null): void {
    this.taskStore.update(id, { notes });
  }

  protected saveDueDate(id: string, dueDate: CalendarDate): void {
    this.taskStore.update(id, { dueDate });
  }

  private findTaskById(id: string): Task | undefined {
    return this.filteredTasks().find((task) => task.id === id);
  }
}
