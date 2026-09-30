import { TestBed } from '@angular/core/testing';
import { todayAsCalendarDate } from '../../../core/models/task.model';
import { AnnouncerService } from '../../../core/services/announcer.service';
import { STORAGE } from '../../../core/services/storage.token';
import { TasksPageComponent } from './tasks-page.component';

function createMockStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

/**
 * NgModel registers itself with its parent form asynchronously (to avoid an
 * ExpressionChangedAfterItHasBeenCheckedError), so the very first
 * detectChanges() alone isn't enough for it to start reflecting model changes.
 */
async function createStableFixture() {
  const storage = createMockStorage();
  storage.setItem('todo-app.tasks', JSON.stringify({ version: 1, tasks: [] }));

  await TestBed.configureTestingModule({
    imports: [TasksPageComponent],
    providers: [{ provide: STORAGE, useValue: storage }],
  }).compileComponents();

  const fixture = TestBed.createComponent(TasksPageComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function enterTitle(fixture: { nativeElement: HTMLElement; detectChanges(): void }, title: string) {
  const input = fixture.nativeElement.querySelector('input[name="newTask"]') as HTMLInputElement;
  input.value = title;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  return input;
}

async function submit(fixture: {
  nativeElement: HTMLElement;
  detectChanges(): void;
  whenStable(): Promise<boolean>;
}) {
  fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
  // NgModel reflects a model change back into the DOM asynchronously.
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('TasksPageComponent', () => {
  it('exposes the task list with an explicit list role and a descriptive label', async () => {
    const fixture = await createStableFixture();

    const list = fixture.nativeElement.querySelector('.task-list') as HTMLElement;
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Aufgabenliste');
  });

  it('adds a task with the current day as due date when a title is entered and submitted', async () => {
    const fixture = await createStableFixture();
    enterTitle(fixture, 'Neue Aufgabe');

    await submit(fixture);

    const component = fixture.componentInstance;
    expect(component['tasks']()).toHaveLength(1);
    expect(component['tasks']()[0].title).toBe('Neue Aufgabe');
    expect(component['tasks']()[0].dueDate).toBe(todayAsCalendarDate());
  });

  it('clears the input and keeps focus on it after adding a task', async () => {
    const fixture = await createStableFixture();
    const input = enterTitle(fixture, 'Neue Aufgabe');

    await submit(fixture);

    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('does not add a task and shows a hint when submitting a blank title', async () => {
    const fixture = await createStableFixture();
    enterTitle(fixture, '   ');

    await submit(fixture);

    expect(fixture.componentInstance['tasks']()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.task-form__hint')?.textContent).toContain(
      'Bitte einen Titel eingeben.',
    );
  });

  it('announces a created task via the live region', async () => {
    const fixture = await createStableFixture();
    const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');

    enterTitle(fixture, 'Neue Aufgabe');
    await submit(fixture);

    expect(announceSpy).toHaveBeenCalledWith('„Neue Aufgabe“ hinzugefügt.');
  });

  it('announces toggling a task as completed and back to open via the live region', async () => {
    const fixture = await createStableFixture();
    enterTitle(fixture, 'Abzuhaken');
    await submit(fixture);
    const announceSpy = vi.spyOn(TestBed.inject(AnnouncerService), 'announce');
    const component = fixture.componentInstance;
    const taskId = component['tasks']()[0].id;

    component['toggleTask'](taskId);
    expect(announceSpy).toHaveBeenCalledWith('„Abzuhaken“ als erledigt markiert.');

    component['toggleTask'](taskId);
    expect(announceSpy).toHaveBeenCalledWith('„Abzuhaken“ als offen markiert.');
  });

  it('hides the hint again once the user starts typing a new title', async () => {
    const fixture = await createStableFixture();
    await submit(fixture);
    expect(fixture.nativeElement.querySelector('.task-form__hint')).not.toBeNull();

    enterTitle(fixture, 'A');

    expect(fixture.nativeElement.querySelector('.task-form__hint')).toBeNull();
  });

  describe('delete with undo', () => {
    it('removes the task from the view immediately and shows an undo notice', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Zu löschen');
      await submit(fixture);
      const component = fixture.componentInstance;
      const taskId = component['tasks']()[0].id;

      component['removeTask'](taskId);
      fixture.detectChanges();

      expect(component['tasks']()).toHaveLength(0);
      const notice = fixture.nativeElement.querySelector('.undo-notice');
      expect(notice).not.toBeNull();
      expect(notice?.getAttribute('role')).toBe('status');
      expect(notice?.textContent).toContain('Zu löschen');
    });

    it('restores the task with all its fields when "Rückgängig" is activated', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Zu löschen');
      await submit(fixture);
      const component = fixture.componentInstance;
      const original = component['tasks']()[0];

      component['removeTask'](original.id);
      fixture.detectChanges();

      const undoButton = fixture.nativeElement.querySelector(
        '.undo-notice__button',
      ) as HTMLButtonElement;
      undoButton.click();
      fixture.detectChanges();

      expect(component['tasks']()).toEqual([original]);
      expect(fixture.nativeElement.querySelector('.undo-notice')).toBeNull();
    });

    it('reaches the same result via the detail panel: opening a card, deleting it and undoing restores it at its old position', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Erste Aufgabe');
      await submit(fixture);
      enterTitle(fixture, 'Zu löschen');
      await submit(fixture);
      const component = fixture.componentInstance;
      const firstTask = component['tasks']()[0];
      const target = component['tasks']()[1];

      const card = fixture.nativeElement.querySelectorAll('.app-task-item')[1] as HTMLElement;
      card.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.task-detail-panel')).not.toBeNull();
      expect(
        (fixture.nativeElement.querySelector('#task-detail-panel-title') as HTMLInputElement).value,
      ).toBe('Zu löschen');

      (
        fixture.nativeElement.querySelector('.task-detail-panel__delete') as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(component['tasks']()).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();

      const undoButton = fixture.nativeElement.querySelector(
        '.undo-notice__button',
      ) as HTMLButtonElement;
      undoButton.click();
      fixture.detectChanges();

      expect(component['tasks']()).toEqual([firstTask, target]);
    });

    it('hides the undo notice once the undo period elapses', async () => {
      vi.useFakeTimers();
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Zu löschen');
      await submit(fixture);
      const component = fixture.componentInstance;
      const taskId = component['tasks']()[0].id;

      component['removeTask'](taskId);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.undo-notice')).not.toBeNull();

      // Advance by exactly the undo duration rather than vi.runAllTimers(): the task
      // store also schedules a self-rescheduling midnight rollover timer, which would
      // make runAllTimers() loop "forever" (it keeps requeuing a new 24h timer).
      vi.advanceTimersByTime(6000);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.undo-notice')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('Detail-/Bearbeitungsansicht (TDP-38)', () => {
    it('opens the panel with the clicked task and moves the update straight to the card and the store on save', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Ursprünglicher Titel');
      await submit(fixture);
      const taskId = fixture.componentInstance['tasks']()[0].id;

      const card = fixture.nativeElement.querySelector('.app-task-item__content') as HTMLElement;
      card.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const titleField = fixture.nativeElement.querySelector(
        '#task-detail-panel-title',
      ) as HTMLInputElement;
      expect(titleField.value).toBe('Ursprünglicher Titel');

      titleField.value = 'Überarbeiteter Titel';
      titleField.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      fixture.nativeElement
        .querySelector('.task-detail-panel__form')
        ?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fixture.componentInstance['tasks']().find((task) => task.id === taskId)?.title).toBe(
        'Überarbeiteter Titel',
      );
      expect(
        fixture.nativeElement.querySelector('.app-task-item__title')?.textContent?.trim(),
      ).toBe('Überarbeiteter Titel');
      expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();
    });

    it('returns focus to the triggering card once the panel closes via Escape', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Fokus-Test');
      await submit(fixture);

      const card = fixture.nativeElement.querySelector('.app-task-item') as HTMLElement;
      card.focus();
      card.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(document.activeElement?.id).toBe('task-detail-panel-title');

      const panel = fixture.nativeElement.querySelector('.task-detail-panel') as HTMLElement;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.task-detail-panel')).toBeNull();
      expect(document.activeElement).toBe(card);
    });

    it('shows a field-linked error instead of throwing when the title is cleared and saved', async () => {
      const fixture = await createStableFixture();
      enterTitle(fixture, 'Wird geleert');
      await submit(fixture);

      const card = fixture.nativeElement.querySelector('.app-task-item') as HTMLElement;
      card.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const titleField = fixture.nativeElement.querySelector(
        '#task-detail-panel-title',
      ) as HTMLInputElement;
      titleField.value = '';
      titleField.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(() =>
        fixture.nativeElement
          .querySelector('.task-detail-panel__form')
          ?.dispatchEvent(new Event('submit')),
      ).not.toThrow();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.task-detail-panel')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Titel darf nicht leer sein.');
      expect(fixture.componentInstance['tasks']()[0].title).toBe('Wird geleert');
    });
  });
});
