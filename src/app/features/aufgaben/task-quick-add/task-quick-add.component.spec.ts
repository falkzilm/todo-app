import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuickAddTaskInput, TaskQuickAddComponent } from './task-quick-add.component';

@Component({
  standalone: true,
  imports: [TaskQuickAddComponent],
  template: `<app-task-quick-add (add)="onAdd($event)" />`,
})
class HostComponent {
  added: QuickAddTaskInput[] = [];

  onAdd(input: QuickAddTaskInput): void {
    this.added.push(input);
  }
}

describe('TaskQuickAddComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  /**
   * Focuses the title input and waits for the card to expand.
   * `provideZoneChangeDetection({ eventCoalescing: true })` (see app.config.ts)
   * schedules the change-detection tick for DOM events via `setTimeout`/
   * `requestAnimationFrame` outside the Angular zone, so `whenStable()` alone
   * isn't guaranteed to observe it; flushing one more macrotask turn makes the
   * expanded category/priority/time pills reliably present before they're queried.
   */
  async function focusAndExpand(
    fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>,
    input: HTMLInputElement,
  ): Promise<void> {
    input.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  it('emits the trimmed title and clears the field on submit', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // ngModel registers with its parent form asynchronously (to avoid an
    // ExpressionChangedAfterItHasBeenCheckedError), so the first
    // detectChanges() alone isn't enough for it to start reflecting model changes.
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    input.value = '  Milch kaufen  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.added).toEqual([
      { title: 'Milch kaufen', categoryId: null, priority: null, startTime: null },
    ]);
    expect(input.value).toBe('');
  });

  it('shows a hint and does not emit when submitted empty', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.added).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Bitte einen Titel eingeben.',
    );
  });

  it('keeps an already-entered category/priority when an empty submit is rejected', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    await focusAndExpand(fixture, input);

    const categoryPill = Array.from(
      fixture.nativeElement.querySelectorAll('.task-quick-add__pill'),
    ).find((pill) => (pill as HTMLElement).textContent?.includes('Arbeit')) as
      | HTMLButtonElement
      | undefined;
    expect(categoryPill).toBeTruthy();
    categoryPill!.click();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.added).toEqual([]);
    expect(categoryPill!.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits the selected category, priority and time together with the title', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    await focusAndExpand(fixture, input);
    input.value = 'Design-Review';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const findPill = (label: string): HTMLButtonElement => {
      const pill = Array.from(
        fixture.nativeElement.querySelectorAll('.task-quick-add__pill'),
      ).find((candidate) => (candidate as HTMLElement).textContent?.includes(label));
      expect(pill).toBeTruthy();
      return pill as HTMLButtonElement;
    };

    findPill('Arbeit').click();
    fixture.detectChanges();
    findPill('Hoch').click();
    fixture.detectChanges();

    const timeInput = fixture.nativeElement.querySelector(
      '.task-quick-add__time-input',
    ) as HTMLInputElement;
    timeInput.value = '09:00';
    timeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.added).toEqual([
      { title: 'Design-Review', categoryId: 'arbeit', priority: 'high', startTime: '09:00' },
    ]);
  });

  it('discards the entry and collapses on Escape', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    input.value = 'Verworfen';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(fixture.nativeElement.querySelector('.task-quick-add__options')).toBeNull();
    expect(fixture.componentInstance.added).toEqual([]);
  });
});
