import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TASK_DRAG_DATA_FORMAT, Task, createTask } from '../../../core/models/task.model';
import { TaskItemComponent } from './task-item.component';

function buildTask(overrides: Partial<Task> = {}): Task {
  const task = createTask({ title: 'Wocheneinkauf erledigen', dueDate: '2026-09-05' });
  return { ...task, ...overrides };
}

@Component({
  standalone: true,
  imports: [TaskItemComponent],
  template: `
    <ul>
      <li
        app-task-item
        [task]="task"
        (toggleCompleted)="onToggleCompleted()"
        (open)="onOpen()"
      ></li>
    </ul>
  `,
})
class HostComponent {
  task: Task = buildTask();
  toggleCount = 0;
  openCount = 0;

  onToggleCompleted(): void {
    this.toggleCount++;
  }

  onOpen(): void {
    this.openCount++;
  }
}

describe('TaskItemComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders the title for an open task', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-task-item__title')?.textContent?.trim()).toBe(
      'Wocheneinkauf erledigen',
    );
    expect(compiled.querySelector('.app-task-item')?.classList).not.toContain(
      'app-task-item--completed',
    );
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('renders a title containing markup as plain text instead of interpreting it as HTML', () => {
    const maliciousTitle = '<img src=x onerror=alert(1)>';
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.task = buildTask({ title: maliciousTitle });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.app-task-item__title');
    expect(title?.textContent?.trim()).toBe(maliciousTitle);
    expect(compiled.querySelector('img')).toBeNull();
  });

  it('visually marks a completed task as done', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.task = buildTask({ completed: true });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-task-item')?.classList).toContain(
      'app-task-item--completed',
    );
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('emits toggleCompleted when the checkbox is toggled, without touching any store', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.toggleCount).toBe(1);
  });

  describe('Kategorie', () => {
    it('shows the category dot and name for a categorized task', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ categoryId: 'arbeit' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-task-item__category-dot')).not.toBeNull();
      expect(compiled.querySelector('.app-task-item__category')?.textContent?.trim()).toBe(
        'Arbeit',
      );
    });

    it('renders no category dot or name when the task has no category', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ categoryId: null });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-task-item__category-dot')).toBeNull();
      expect(compiled.querySelector('.app-task-item__category')).toBeNull();
    });
  });

  describe('Uhrzeit', () => {
    it('shows the clock icon and start time when set', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ startTime: '09:00' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const time = compiled.querySelector('.app-task-item__time');
      expect(time?.textContent?.trim()).toBe('09:00');
      expect(time?.querySelector('svg')).not.toBeNull();
    });

    it('renders no clock icon or time when the task has no start time', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ startTime: null });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-task-item__time')).toBeNull();
    });

    it('renders no meta row at all when neither category nor start time is set', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ categoryId: null, startTime: null });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-task-item__meta')).toBeNull();
    });
  });

  describe('Prioritäts-Badge', () => {
    it('shows the priority badge when a priority is set', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ priority: 'high' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-priority-badge')?.textContent).toContain('Hoch');
    });

    it('renders no badge when the task has no priority', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ priority: null });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-priority-badge')).toBeNull();
    });
  });

  describe('Öffnen der Detailansicht', () => {
    it('emits open exactly once when the card is clicked outside the checkbox', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.app-task-item__content') as HTMLElement;
      content.click();

      expect(fixture.componentInstance.openCount).toBe(1);
      expect(fixture.componentInstance.toggleCount).toBe(0);
    });

    it('does not emit open when the click originates from the checkbox', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.click();

      expect(fixture.componentInstance.openCount).toBe(0);
      expect(fixture.componentInstance.toggleCount).toBe(1);
    });

    it('is focusable and opens on Enter', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.app-task-item') as HTMLElement;
      expect(item.getAttribute('tabindex')).toBe('0');

      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(fixture.componentInstance.openCount).toBe(1);
    });

    it('does not emit open when Enter is pressed on the checkbox itself', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(fixture.componentInstance.openCount).toBe(0);
    });
  });

  describe('Umplanen per Drag & Drop', () => {
    it('is draggable and puts its task id on the drag data', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.app-task-item') as HTMLElement;
      expect(item.getAttribute('draggable')).toBe('true');

      const store = new Map<string, string>();
      const dataTransfer = {
        setData: (format: string, value: string) => store.set(format, value),
        getData: (format: string) => store.get(format) ?? '',
      } as unknown as DataTransfer;
      const event = new Event('dragstart', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

      item.dispatchEvent(event);

      expect(dataTransfer.getData(TASK_DRAG_DATA_FORMAT)).toBe(fixture.componentInstance.task.id);
    });

    it('is not draggable on a touch-capable device, so scrolling is never intercepted', () => {
      const originalMaxTouchPoints = navigator.maxTouchPoints;
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });

      try {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        const item = fixture.nativeElement.querySelector('.app-task-item') as HTMLElement;
        expect(item.getAttribute('draggable')).toBeNull();
      } finally {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          value: originalMaxTouchPoints,
          configurable: true,
        });
      }
    });
  });
});
