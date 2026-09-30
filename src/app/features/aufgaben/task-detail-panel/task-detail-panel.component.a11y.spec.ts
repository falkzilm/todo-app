import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { Task, createTask } from '../../../core/models/task.model';
import { TaskDetailPanelComponent } from './task-detail-panel.component';

function buildTask(overrides: Partial<Task> = {}): Task {
  const task = createTask({
    title: 'Sprint-Planung vorbereiten',
    notes: 'Agenda abstimmen',
    dueDate: '2026-09-05',
    startTime: '09:00',
    endTime: '10:00',
    categoryId: 'arbeit',
    priority: 'high',
    subtitle: 'Besprechungsraum 2',
  });
  return { ...task, ...overrides };
}

@Component({
  standalone: true,
  imports: [TaskDetailPanelComponent],
  template: `<app-task-detail-panel [task]="task" />`,
})
class HostComponent {
  task: Task | null = null;
}

describe('TaskDetailPanelComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for the opened panel', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.task = buildTask();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with a field-linked validation error shown', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.task = buildTask();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector(
      '#task-detail-panel-title',
    ) as HTMLInputElement;
    titleInput.value = '   ';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
