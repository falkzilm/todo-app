import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTask } from '../../../core/models/task.model';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { NotificationBellComponent } from './notification-bell.component';

function createMockStore(
  overdueTasks: ReturnType<typeof createTask>[] = [],
  todayTasks: ReturnType<typeof createTask>[] = [],
): Partial<TaskStoreService> {
  return {
    overdueTasks: signal(overdueTasks),
    todayTasks: signal(todayTasks),
  };
}

function setUp(store: Partial<TaskStoreService> = createMockStore()) {
  TestBed.configureTestingModule({
    imports: [NotificationBellComponent],
    providers: [{ provide: TaskStoreService, useValue: store }],
  });

  const fixture = TestBed.createComponent(NotificationBellComponent);
  fixture.detectChanges();
  return fixture;
}

describe('NotificationBellComponent', () => {
  it('renders a labeled bell button without an indicator when there are no hints', () => {
    const fixture = setUp();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen');
    expect(fixture.nativeElement.querySelector('.app-icon-button__indicator')).toBeNull();
  });

  it('shows the indicator and a count-aware aria-label for an overdue task', () => {
    const overdue = createTask({ title: 'Rechnung prüfen', dueDate: '2026-08-20' });
    const fixture = setUp(createMockStore([overdue], []));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen, 1 neue');
    expect(fixture.nativeElement.querySelector('.app-icon-button__indicator')).not.toBeNull();
  });

  it('shows the indicator and a count-aware aria-label for a scheduled, still-open task due today', () => {
    const dueToday = createTask({
      title: 'Teammeeting',
      dueDate: '2026-09-02',
      startTime: '09:00',
    });
    const fixture = setUp(createMockStore([], [dueToday]));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen, 1 neue');
  });

  it('does not count today-due tasks without a scheduled time', () => {
    const unscheduled = createTask({ title: 'Irgendwann heute', dueDate: '2026-09-02' });
    const fixture = setUp(createMockStore([], [unscheduled]));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen');
    expect(fixture.nativeElement.querySelector('.app-icon-button__indicator')).toBeNull();
  });

  it('opens the popover on click, listing each hint with a title and reason', () => {
    const overdue = createTask({ title: 'Rechnung prüfen', dueDate: '2026-08-20' });
    const dueToday = createTask({
      title: 'Teammeeting',
      dueDate: '2026-09-02',
      startTime: '09:00',
    });
    const fixture = setUp(createMockStore([overdue], [dueToday]));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const panel = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(button.getAttribute('aria-controls')).toBe(panel.id);

    const items = Array.from(panel.querySelectorAll('.notification-bell__item')) as HTMLElement[];
    expect(
      items.map((item) =>
        Array.from(item.querySelectorAll('p'))
          .map((paragraph) => paragraph.textContent?.trim())
          .join(' / '),
      ),
    ).toEqual([
      'Rechnung prüfen / Überfällig seit 20. August',
      'Teammeeting / Heute noch offen, 09:00 Uhr',
    ]);
  });

  it('shows an empty state when there are no hints', () => {
    const fixture = setUp();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.textContent).toContain('Keine Hinweise');
    expect(panel.querySelector('.notification-bell__item')).toBeNull();
  });

  it('closes the popover on a second click', () => {
    const fixture = setUp();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the popover on a click outside', () => {
    const fixture = setUp();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    document.body.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes the popover on Escape and returns focus to the trigger button', () => {
    const fixture = setUp();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(button);
  });
});
