import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskQuickAddComponent } from './task-quick-add.component';

@Component({
  standalone: true,
  imports: [TaskQuickAddComponent],
  template: `<app-task-quick-add (add)="onAdd($event)" />`,
})
class HostComponent {
  added: string[] = [];

  onAdd(title: string): void {
    this.added.push(title);
  }
}

describe('TaskQuickAddComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

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

    expect(fixture.componentInstance.added).toEqual(['Milch kaufen']);
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
});
