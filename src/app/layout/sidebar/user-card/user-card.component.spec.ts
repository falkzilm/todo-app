import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { UserCardComponent } from './user-card.component';

function createMockTaskStore(): Partial<TaskStoreService> {
  return { reset: () => undefined };
}

describe('UserCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent],
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        { provide: TaskStoreService, useValue: createMockTaskStore() },
      ],
    }).compileComponents();
  });

  it('shows the default demo user', () => {
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.user-card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('Laura Becker');
    expect(card.textContent).toContain('laura@focusday.de');
  });

  it('opens the menu on chevron click, exposing aria-expanded/aria-controls and the two menu entries', () => {
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu: HTMLElement = fixture.nativeElement.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'Einstellungen',
      'Demodaten zurücksetzen',
    ]);

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes the menu on Escape and returns focus to the chevron button', () => {
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    trigger.click();
    fixture.detectChanges();

    const menu: HTMLElement = fixture.nativeElement.querySelector('[role="menu"]');
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus between menu items with ArrowDown/ArrowUp', async () => {
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const menu: HTMLElement = fixture.nativeElement.querySelector('[role="menu"]');
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    expect(document.activeElement).toBe(items[0]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
  });

  it('closes on a trigger click even though the mousedown already moved focus there first', () => {
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    trigger.click();
    fixture.detectChanges();

    const menu: HTMLElement = fixture.nativeElement.querySelector('[role="menu"]');
    menu.dispatchEvent(new FocusEvent('focusout', { relatedTarget: trigger }));
    fixture.detectChanges();

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('asks for confirmation before resetting demo data, and only resets when confirmed', () => {
    const taskStore = TestBed.inject(TaskStoreService);
    const resetSpy = vi.spyOn(taskStore, 'reset');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    trigger.click();
    fixture.detectChanges();

    const resetButton = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    ).find((item) => (item as HTMLElement).textContent?.includes('Demodaten')) as HTMLButtonElement;

    resetButton.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalled();
    expect(resetSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();

    confirmSpy.mockReturnValue(true);
    trigger.click();
    fixture.detectChanges();
    (
      Array.from(fixture.nativeElement.querySelectorAll('[role="menuitem"]')).find((item) =>
        (item as HTMLElement).textContent?.includes('Demodaten'),
      ) as HTMLButtonElement
    ).click();

    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
