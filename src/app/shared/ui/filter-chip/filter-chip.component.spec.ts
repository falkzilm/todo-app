import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterChipComponent } from './filter-chip.component';

@Component({
  standalone: true,
  imports: [FilterChipComponent],
  template: `
    <app-filter-chip icon="sun" label="Heute" [active]="active" (pressed)="onPressed()" />
  `,
})
class HostComponent {
  active = false;
  pressedCount = 0;

  onPressed(): void {
    this.pressedCount++;
  }
}

describe('FilterChipComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders the label and icon', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Heute');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('emits exactly one pressed event when clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(fixture.componentInstance.pressedCount).toBe(1);
  });

  it('emits exactly one pressed event when activated with Enter', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(fixture.componentInstance.pressedCount).toBe(1);
  });

  it('reflects the active state via aria-pressed and a modifier class', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.classList.contains('app-filter-chip--active')).toBe(false);

    fixture.componentInstance.active = true;
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('app-filter-chip--active')).toBe(true);
  });
});
