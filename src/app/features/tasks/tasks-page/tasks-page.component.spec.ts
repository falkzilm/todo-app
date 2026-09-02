import { TestBed } from '@angular/core/testing';
import { todayAsCalendarDate } from '../../../core/models/task.model';
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

  it('hides the hint again once the user starts typing a new title', async () => {
    const fixture = await createStableFixture();
    await submit(fixture);
    expect(fixture.nativeElement.querySelector('.task-form__hint')).not.toBeNull();

    enterTitle(fixture, 'A');

    expect(fixture.nativeElement.querySelector('.task-form__hint')).toBeNull();
  });
});
