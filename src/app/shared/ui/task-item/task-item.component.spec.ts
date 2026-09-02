import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task, createTask } from '../../../core/models/task.model';
import { TaskItemComponent } from './task-item.component';

function buildTask(overrides: Partial<Task> = {}): Task {
  const task = createTask({ title: 'Wocheneinkauf erledigen', dueDate: '2026-09-05' });
  return { ...task, ...overrides };
}

@Component({
  standalone: true,
  imports: [TaskItemComponent],
  template: `
    <app-task-item [task]="task" (toggleCompleted)="onToggleCompleted()" (remove)="onRemove()" />
  `,
})
class HostComponent {
  task: Task = buildTask();
  toggleCount = 0;
  removeCount = 0;

  onToggleCompleted(): void {
    this.toggleCount++;
  }

  onRemove(): void {
    this.removeCount++;
  }
}

describe('TaskItemComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders title and due date for an open task', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-task-item__title')?.textContent?.trim()).toBe(
      'Wocheneinkauf erledigen',
    );
    expect(compiled.querySelector('.app-task-item__due-date')?.textContent).toContain('2026');
    expect(compiled.querySelector('.app-task-item')?.classList).not.toContain(
      'app-task-item--completed',
    );
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
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

  it('emits remove when the action button is pressed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    removeButton.click();

    expect(fixture.componentInstance.removeCount).toBe(1);
  });

  it('does not emit toggleCompleted when clicking the remove action', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    removeButton.click();

    expect(fixture.componentInstance.toggleCount).toBe(0);
  });

  it('emits toggleCompleted exactly once when the row content is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector(
      '.app-task-item__content',
    ) as HTMLElement;
    content.click();

    expect(fixture.componentInstance.toggleCount).toBe(1);
  });

  it('does not double-emit toggleCompleted when the click originates from the checkbox', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.click();

    expect(fixture.componentInstance.toggleCount).toBe(1);
  });
});
