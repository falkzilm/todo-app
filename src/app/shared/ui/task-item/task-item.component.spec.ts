import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMonthGrid } from '../../../core/date/date-utils';
import {
  CalendarDate,
  TASK_DRAG_DATA_FORMAT,
  Task,
  createTask,
} from '../../../core/models/task.model';
import { TaskItemComponent } from './task-item.component';

function buildTask(overrides: Partial<Task> = {}): Task {
  const task = createTask({ title: 'Wocheneinkauf erledigen', dueDate: '2026-09-05' });
  return { ...task, ...overrides };
}

@Component({
  standalone: true,
  imports: [TaskItemComponent],
  template: `
    <app-task-item
      [task]="task"
      (toggleCompleted)="onToggleCompleted()"
      (remove)="onRemove()"
      (titleSave)="onTitleSave($event)"
      (notesSave)="onNotesSave($event)"
      (dueDateSave)="onDueDateSave($event)"
    />
  `,
})
class HostComponent {
  task: Task = buildTask();
  toggleCount = 0;
  removeCount = 0;
  savedTitles: string[] = [];
  savedNotes: (string | null)[] = [];
  savedDueDates: CalendarDate[] = [];

  onToggleCompleted(): void {
    this.toggleCount++;
  }

  onRemove(): void {
    this.removeCount++;
  }

  onTitleSave(title: string): void {
    this.savedTitles.push(title);
  }

  onNotesSave(notes: string | null): void {
    this.savedNotes.push(notes);
  }

  onDueDateSave(dueDate: CalendarDate): void {
    this.savedDueDates.push(dueDate);
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

  it('renders a title containing markup as plain text instead of interpreting it as HTML', () => {
    const maliciousTitle = '<img src=x onerror=alert(1)>';
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.task = buildTask({ title: maliciousTitle });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleButton = compiled.querySelector('.app-task-item__title');
    expect(titleButton?.textContent?.trim()).toBe(maliciousTitle);
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

  it('emits remove when the action button is pressed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector(
      '.app-icon-button',
    ) as HTMLButtonElement;
    removeButton.click();

    expect(fixture.componentInstance.removeCount).toBe(1);
  });

  it('does not emit toggleCompleted when clicking the remove action', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector(
      '.app-icon-button',
    ) as HTMLButtonElement;
    removeButton.click();

    expect(fixture.componentInstance.toggleCount).toBe(0);
  });

  it('emits toggleCompleted exactly once when the row content is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('.app-task-item__content') as HTMLElement;
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
  });

  describe('title editing', () => {
    it('shows a focused input with the current title when editing starts', async () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const titleButton = fixture.nativeElement.querySelector(
        '.app-task-item__title',
      ) as HTMLButtonElement;
      titleButton.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__title-input',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe('Wocheneinkauf erledigen');
      expect(document.activeElement).toBe(input);
    });

    it('saves the new title on Enter', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__title') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__title-input',
      ) as HTMLInputElement;
      input.value = 'Neuer Titel';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedTitles).toEqual(['Neuer Titel']);
      expect(fixture.nativeElement.querySelector('.app-task-item__title-input')).toBeNull();
    });

    it('saves the new title on blur', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__title') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__title-input',
      ) as HTMLInputElement;
      input.value = 'Anderer Titel';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedTitles).toEqual(['Anderer Titel']);
    });

    it('discards the change without saving when Escape is pressed', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__title') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__title-input',
      ) as HTMLInputElement;
      input.value = 'Verworfener Titel';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedTitles).toEqual([]);
      expect(
        fixture.nativeElement.querySelector('.app-task-item__title')?.textContent?.trim(),
      ).toBe('Wocheneinkauf erledigen');
    });

    it('does not save an empty title and keeps the previous one', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__title') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__title-input',
      ) as HTMLInputElement;
      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedTitles).toEqual([]);
      expect(
        fixture.nativeElement.querySelector('.app-task-item__title')?.textContent?.trim(),
      ).toBe('Wocheneinkauf erledigen');
    });
  });

  describe('notes editing', () => {
    it('shows an "add note" affordance when there are no notes yet', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const notesButton = fixture.nativeElement.querySelector('.app-task-item__notes');
      expect(notesButton?.textContent?.trim()).toBe('Notiz hinzufügen');
    });

    it('saves new notes on blur', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__notes') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__notes-input',
      ) as HTMLInputElement;
      input.value = 'Wichtige Notiz';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedNotes).toEqual(['Wichtige Notiz']);
    });

    it('clears notes when saved empty', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ notes: 'Bestehende Notiz' });
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__notes') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__notes-input',
      ) as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedNotes).toEqual([null]);
    });

    it('discards note changes without saving when Escape is pressed', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.task = buildTask({ notes: 'Ursprüngliche Notiz' });
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.app-task-item__notes') as HTMLButtonElement).click();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '.app-task-item__notes-input',
      ) as HTMLInputElement;
      input.value = 'Verworfene Notiz';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedNotes).toEqual([]);
      expect(
        fixture.nativeElement.querySelector('.app-task-item__notes')?.textContent?.trim(),
      ).toBe('Ursprüngliche Notiz');
    });
  });

  describe('Fälligkeitsdatum ändern', () => {
    function dueDateTrigger(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>) {
      return fixture.nativeElement.querySelector(
        '.app-task-item__due-date .date-picker__trigger',
      ) as HTMLButtonElement;
    }

    function cellFor(
      fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>,
      referenceDate: Date,
      date: CalendarDate,
    ): HTMLElement {
      const cells = Array.from(
        fixture.nativeElement.querySelectorAll('[role="gridcell"]'),
      ) as HTMLElement[];
      const index = getMonthGrid(referenceDate).findIndex((day) => day.date === date);
      return cells[index];
    }

    it('opens a date picker prefilled with the task due date', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      expect(dueDateTrigger(fixture).textContent?.trim()).toBe('5. September 2026');
    });

    it('emits dueDateSave with the newly picked date, without touching any store', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      dueDateTrigger(fixture).click();
      fixture.detectChanges();

      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-12');
      cell.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.savedDueDates).toEqual(['2026-09-12']);
      expect(fixture.componentInstance.toggleCount).toBe(0);
    });

    it('does not emit dueDateSave when the picker is cancelled via Escape', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      dueDateTrigger(fixture).click();
      fixture.detectChanges();

      const cell = cellFor(fixture, new Date(2026, 8, 5), '2026-09-05');
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.savedDueDates).toEqual([]);
      expect(dueDateTrigger(fixture).textContent?.trim()).toBe('5. September 2026');
    });

    it('does not emit toggleCompleted when opening the date picker', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      dueDateTrigger(fixture).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.toggleCount).toBe(0);
    });
  });

  describe('Schnellaktionen für das Fälligkeitsdatum', () => {
    function quickDateButton(
      fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>,
      label: string,
    ): HTMLButtonElement {
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('.app-task-item__quick-date'),
      ) as HTMLButtonElement[];
      const button = buttons.find((candidate) => candidate.textContent?.trim() === label);
      if (!button) {
        throw new Error(`No quick date button found for label "${label}"`);
      }
      return button;
    }

    it('are labelled real buttons, reachable without opening the calendar', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      for (const label of ['Heute', 'Morgen', 'Nächste Woche']) {
        const button = quickDateButton(fixture, label);
        expect(button.tagName).toBe('BUTTON');
        expect(button.type).toBe('button');
      }
      expect(fixture.nativeElement.querySelector('.date-picker__popover')).toBeNull();
    });

    it("emits dueDateSave with today's date, without touching any store", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 2));

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      quickDateButton(fixture, 'Heute').click();

      expect(fixture.componentInstance.savedDueDates).toEqual(['2026-09-02']);
      expect(fixture.componentInstance.toggleCount).toBe(0);

      vi.useRealTimers();
    });

    it("emits dueDateSave with tomorrow's date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 2));

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      quickDateButton(fixture, 'Morgen').click();

      expect(fixture.componentInstance.savedDueDates).toEqual(['2026-09-03']);

      vi.useRealTimers();
    });

    it('emits dueDateSave with a date seven days out, rolling correctly over a month boundary', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 26));

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      quickDateButton(fixture, 'Nächste Woche').click();

      expect(fixture.componentInstance.savedDueDates).toEqual(['2026-10-03']);

      vi.useRealTimers();
    });

    it('does not emit toggleCompleted when a quick date action is pressed', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      quickDateButton(fixture, 'Heute').click();

      expect(fixture.componentInstance.toggleCount).toBe(0);
    });
  });
});
