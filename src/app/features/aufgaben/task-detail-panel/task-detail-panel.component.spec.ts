import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, createTask } from '../../../core/models/task.model';
import { UpdateTaskInput } from '../../../core/services/task-store.service';
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
  template: `
    <app-task-detail-panel
      [task]="task"
      (save)="onSave($event)"
      (delete)="onDelete()"
      (closed)="onClosed()"
    />
  `,
})
class HostComponent {
  task: Task | null = null;
  savedChanges: UpdateTaskInput | null = null;
  deleteCount = 0;
  closedCount = 0;

  onSave(changes: UpdateTaskInput): void {
    this.savedChanges = changes;
  }

  onDelete(): void {
    this.deleteCount++;
  }

  onClosed(): void {
    this.closedCount++;
  }
}

/**
 * `afterNextRender` (initial focus) and `[(ngModel)]` (form field registration)
 * both settle asynchronously, so a single `detectChanges()` after opening isn't
 * enough for either the focused element or a subsequent typed value to be
 * reliable yet - every test needs to await stability once after opening.
 */
async function openPanel(task: Task): Promise<ComponentFixture<HostComponent>> {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.task = task;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

async function typeInto(
  fixture: ComponentFixture<HostComponent>,
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('TaskDetailPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders nothing when no task is open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();
  });

  it("pre-fills the form with the given task's values", async () => {
    const fixture = await openPanel(buildTask());

    const compiled = fixture.nativeElement as HTMLElement;
    expect((compiled.querySelector('#task-detail-panel-title') as HTMLInputElement).value).toBe(
      'Sprint-Planung vorbereiten',
    );
    expect((compiled.querySelector('#task-detail-panel-subtitle') as HTMLInputElement).value).toBe(
      'Besprechungsraum 2',
    );
    expect((compiled.querySelector('#task-detail-panel-notes') as HTMLTextAreaElement).value).toBe(
      'Agenda abstimmen',
    );
    expect(
      (compiled.querySelector('#task-detail-panel-start-time') as HTMLInputElement).value,
    ).toBe('09:00');
    expect((compiled.querySelector('#task-detail-panel-end-time') as HTMLInputElement).value).toBe(
      '10:00',
    );
    expect(compiled.querySelector('.task-detail-panel__pill--active')?.textContent?.trim()).toBe(
      'Arbeit',
    );
  });

  it('moves keyboard focus into the panel (the title field) when it opens', async () => {
    await openPanel(buildTask());

    expect(document.activeElement?.id).toBe('task-detail-panel-title');
  });

  it('emits save with the edited field values on submit, and then closes', async () => {
    const fixture = await openPanel(buildTask());
    const compiled = fixture.nativeElement as HTMLElement;

    await typeInto(
      fixture,
      compiled.querySelector('#task-detail-panel-title') as HTMLInputElement,
      'Sprint-Planung final abstimmen',
    );

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.savedChanges).toEqual({
      title: 'Sprint-Planung final abstimmen',
      notes: 'Agenda abstimmen',
      dueDate: '2026-09-05',
      startTime: '09:00',
      endTime: '10:00',
      categoryId: 'arbeit',
      priority: 'high',
      subtitle: 'Besprechungsraum 2',
    });
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  describe('Validierung', () => {
    it('shows a field-linked error and does not save when the title is empty', async () => {
      const fixture = await openPanel(buildTask());
      const compiled = fixture.nativeElement as HTMLElement;
      const titleInput = compiled.querySelector('#task-detail-panel-title') as HTMLInputElement;

      await typeInto(fixture, titleInput, '   ');

      compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedChanges).toBeNull();
      expect(fixture.componentInstance.closedCount).toBe(0);
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
      const errorId = titleInput.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(compiled.querySelector(`#${errorId}`)?.textContent).toContain(
        'Titel darf nicht leer sein.',
      );
      expect(document.activeElement).toBe(titleInput);
    });

    it('shows a field-linked error and does not save when endTime is before startTime', async () => {
      const fixture = await openPanel(buildTask({ startTime: '09:00', endTime: '10:00' }));
      const compiled = fixture.nativeElement as HTMLElement;
      const endTimeInput = compiled.querySelector(
        '#task-detail-panel-end-time',
      ) as HTMLInputElement;

      await typeInto(fixture, endTimeInput, '08:00');

      compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedChanges).toBeNull();
      expect(fixture.componentInstance.closedCount).toBe(0);
      expect(endTimeInput.getAttribute('aria-invalid')).toBe('true');
      const errorId = endTimeInput.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(compiled.querySelector(`#${errorId}`)?.textContent).toContain(
        'Die Endzeit darf nicht vor der Startzeit liegen.',
      );
      expect(document.activeElement).toBe(endTimeInput);
    });
  });

  describe('Löschen und Schließen', () => {
    it('emits delete and closed when the delete button is activated', async () => {
      const fixture = await openPanel(buildTask());

      (
        fixture.nativeElement.querySelector('.task-detail-panel__delete') as HTMLButtonElement
      ).click();

      expect(fixture.componentInstance.deleteCount).toBe(1);
      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('emits closed on Escape', async () => {
      const fixture = await openPanel(buildTask());

      const panel = fixture.nativeElement.querySelector('.task-detail-panel') as HTMLElement;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('emits closed when the close button is activated', async () => {
      const fixture = await openPanel(buildTask());

      (fixture.nativeElement.querySelector('app-icon-button button') as HTMLButtonElement).click();

      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('emits closed when clicking the backdrop', async () => {
      const fixture = await openPanel(buildTask());

      (fixture.nativeElement.querySelector('.task-detail-panel-backdrop') as HTMLElement).click();

      expect(fixture.componentInstance.closedCount).toBe(1);
    });
  });

  describe('Tastaturfokus bleibt im Panel', () => {
    function focusableElements(fixture: ComponentFixture<HostComponent>): HTMLElement[] {
      const panel = fixture.nativeElement.querySelector('.task-detail-panel') as HTMLElement;
      return Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea'),
      );
    }

    it('wraps Tab from the last focusable element back to the first', async () => {
      const fixture = await openPanel(buildTask());

      const elements = focusableElements(fixture);
      const last = elements[elements.length - 1];
      last.focus();

      const panel = fixture.nativeElement.querySelector('.task-detail-panel') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      panel.dispatchEvent(event);

      expect(document.activeElement).toBe(elements[0]);
    });

    it('wraps Shift+Tab from the first focusable element back to the last', async () => {
      const fixture = await openPanel(buildTask());

      const elements = focusableElements(fixture);
      elements[0].focus();

      const panel = fixture.nativeElement.querySelector('.task-detail-panel') as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      panel.dispatchEvent(event);

      expect(document.activeElement).toBe(elements[elements.length - 1]);
    });
  });

  describe('Kategorie und Priorität', () => {
    it('toggles a category pill off again when clicked while already active', async () => {
      const fixture = await openPanel(buildTask({ categoryId: 'arbeit' }));

      const compiled = fixture.nativeElement as HTMLElement;
      const arbeitPill = Array.from(compiled.querySelectorAll('.task-detail-panel__pill')).find(
        (button) => button.textContent?.trim() === 'Arbeit',
      ) as HTMLButtonElement;
      expect(arbeitPill.classList).toContain('task-detail-panel__pill--active');

      arbeitPill.click();
      fixture.detectChanges();

      expect(arbeitPill.classList).not.toContain('task-detail-panel__pill--active');

      compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedChanges?.categoryId).toBeNull();
    });
  });
});
