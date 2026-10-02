import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  TaskFilterBarComponent,
  TaskFilterId,
  TaskSortOption,
  isTaskFilterId,
} from './task-filter-bar.component';

@Component({
  standalone: true,
  imports: [TaskFilterBarComponent],
  template: `
    <app-task-filter-bar
      [active]="active"
      [sort]="sort"
      [categoryId]="categoryId"
      [showCompleted]="showCompleted"
      (filterChange)="onFilterChange($event)"
      (sortChange)="onSortChange($event)"
      (categoryChange)="onCategoryChange($event)"
      (showCompletedChange)="onShowCompletedChange($event)"
    />
  `,
})
class HostComponent {
  active: TaskFilterId = 'today';
  sort: TaskSortOption = 'time';
  categoryId: string | null = null;
  showCompleted = true;

  lastChange: TaskFilterId | null = null;
  lastSort: TaskSortOption | null = null;
  lastCategory: string | null | undefined = undefined;
  lastShowCompleted: boolean | null = null;

  onFilterChange(id: TaskFilterId): void {
    this.lastChange = id;
  }

  onSortChange(sort: TaskSortOption): void {
    this.lastSort = sort;
  }

  onCategoryChange(categoryId: string | null): void {
    this.lastCategory = categoryId;
  }

  onShowCompletedChange(showCompleted: boolean): void {
    this.lastShowCompleted = showCompleted;
  }
}

describe('TaskFilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  function setUp() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function trigger(fixture: ReturnType<typeof setUp>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.app-filter-chip-icon');
  }

  function popover(fixture: ReturnType<typeof setUp>): HTMLElement | null {
    return fixture.nativeElement.querySelector('.task-filter-bar__popover');
  }

  /** The popover's `app-checkbox` registers its `ngModel` asynchronously (see the
   * identical note in task-quick-add.component.spec.ts), so a plain `detectChanges()`
   * right after opening isn't enough to settle it — wait for stability too. */
  async function openMenu(fixture: ReturnType<typeof setUp>): Promise<void> {
    trigger(fixture).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function pillByLabel(fixture: ReturnType<typeof setUp>, label: string): HTMLButtonElement {
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.task-filter-bar__pill'),
    ) as HTMLButtonElement[];
    return pills.find((pill) => pill.textContent?.trim() === label)!;
  }

  it('renders a chip for each filter, marking the active one', () => {
    const fixture = setUp();

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

  it('is grouped and labelled for assistive technology', () => {
    const fixture = setUp();

    const group = fixture.nativeElement.querySelector('.task-filter-bar');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBeTruthy();
  });

  it('emits the clicked filter id', () => {
    const fixture = setUp();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    buttons[2].click();

    expect(fixture.componentInstance.lastChange).toBe('important');
  });

  it('does not emit when the already-active filter is clicked again', () => {
    const fixture = setUp();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-filter-chip'),
    ) as HTMLButtonElement[];
    buttons[0].click();

    expect(fixture.componentInstance.lastChange).toBeNull();
  });

  it('renders a trailing icon-only button for further filters', () => {
    const fixture = setUp();

    const moreFilters = fixture.nativeElement.querySelector('.app-filter-chip-icon');
    expect(moreFilters).not.toBeNull();
    expect(moreFilters.getAttribute('aria-label')).toBe('Weitere Filter');
  });

  describe('Sliders-Popover', () => {
    it('is closed by default, with aria-expanded false and no aria-controls target rendered', () => {
      const fixture = setUp();

      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(popover(fixture)).toBeNull();
    });

    it('opens the popover and links it via aria-controls/aria-expanded', async () => {
      const fixture = setUp();

      await openMenu(fixture);

      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
      const controlsId = trigger(fixture).getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      expect(popover(fixture)?.id).toBe(controlsId);
    });

    it('closes again when the trigger is clicked a second time', async () => {
      const fixture = setUp();

      await openMenu(fixture);
      trigger(fixture).click();
      fixture.detectChanges();

      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(popover(fixture)).toBeNull();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const fixture = setUp();

      await openMenu(fixture);
      popover(fixture)!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();

      expect(popover(fixture)).toBeNull();
      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(trigger(fixture));
    });

    it('closes when clicking outside the bar', async () => {
      const fixture = setUp();

      await openMenu(fixture);
      document.body.click();
      fixture.detectChanges();

      expect(popover(fixture)).toBeNull();
    });

    it('emits sortChange when a sort pill is clicked', async () => {
      const fixture = setUp();
      await openMenu(fixture);

      pillByLabel(fixture, 'Priorität').click();

      expect(fixture.componentInstance.lastSort).toBe('priority');
    });

    it('emits categoryChange for a category pill, and null when clicked again', async () => {
      const fixture = setUp();
      await openMenu(fixture);

      pillByLabel(fixture, 'Arbeit').click();
      expect(fixture.componentInstance.lastCategory).toBe('arbeit');

      fixture.componentInstance.categoryId = 'arbeit';
      fixture.detectChanges();
      pillByLabel(fixture, 'Arbeit').click();
      expect(fixture.componentInstance.lastCategory).toBeNull();
    });

    it('emits null when "Alle" is clicked', async () => {
      const fixture = setUp();
      fixture.componentInstance.categoryId = 'arbeit';
      fixture.detectChanges();
      await openMenu(fixture);

      pillByLabel(fixture, 'Alle').click();

      expect(fixture.componentInstance.lastCategory).toBeNull();
    });

    it('emits showCompletedChange when the toggle changes', async () => {
      const fixture = setUp();
      await openMenu(fixture);

      const toggle = fixture.nativeElement.querySelector(
        '.task-filter-bar__toggle input[type="checkbox"]',
      ) as HTMLInputElement;
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));

      expect(fixture.componentInstance.lastShowCompleted).toBe(false);
    });
  });
});

describe('isTaskFilterId', () => {
  it('accepts the three known filter ids', () => {
    expect(isTaskFilterId('today')).toBe(true);
    expect(isTaskFilterId('week')).toBe(true);
    expect(isTaskFilterId('important')).toBe(true);
  });

  it('rejects unknown values and null', () => {
    expect(isTaskFilterId('bogus')).toBe(false);
    expect(isTaskFilterId(null)).toBe(false);
    expect(isTaskFilterId('')).toBe(false);
  });
});
