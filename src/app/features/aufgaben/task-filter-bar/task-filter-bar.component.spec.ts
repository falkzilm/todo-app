import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskFilterBarComponent, TaskFilterId } from './task-filter-bar.component';

@Component({
  standalone: true,
  imports: [TaskFilterBarComponent],
  template: `<app-task-filter-bar [active]="active" (filterChange)="onFilterChange($event)" />`,
})
class HostComponent {
  active: TaskFilterId = 'today';
  lastChange: TaskFilterId | null = null;

  onFilterChange(id: TaskFilterId): void {
    this.lastChange = id;
  }
}

describe('TaskFilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders a chip for each filter, marking the active one', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Heute',
      'Diese Woche',
      'Wichtig',
    ]);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('emits the clicked filter id', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    buttons[2].click();

    expect(fixture.componentInstance.lastChange).toBe('important');
  });

  it('does not emit when the already-active filter is clicked again', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    buttons[0].click();

    expect(fixture.componentInstance.lastChange).toBeNull();
  });

  it('renders a trailing icon-only button for further filters', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const moreFilters = fixture.nativeElement.querySelector('.app-filter-chip-icon');
    expect(moreFilters).not.toBeNull();
    expect(moreFilters.getAttribute('aria-label')).toBe('Weitere Filter');
  });
});
