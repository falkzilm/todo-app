import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';

@Component({
  standalone: true,
  imports: [IconButtonComponent],
  template: `
    <app-icon-button ariaLabel="Löschen" [disabled]="disabled" (pressed)="onPressed()">
      <svg viewBox="0 0 24 24"></svg>
    </app-icon-button>
  `,
})
class HostComponent {
  disabled = false;
  pressedCount = 0;

  onPressed(): void {
    this.pressedCount++;
  }
}

@Component({
  standalone: true,
  imports: [IconButtonComponent],
  template: `
    <app-icon-button ariaLabel="Benachrichtigungen" [indicator]="'1 neue'">
      <svg viewBox="0 0 24 24"></svg>
    </app-icon-button>
  `,
})
class IndicatorHostComponent {}

describe('IconButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders the aria-label and projected icon', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Löschen');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('emits pressed when clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(fixture.componentInstance.pressedCount).toBe(1);
  });

  it('does not emit pressed and renders as disabled when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    button.click();
    expect(fixture.componentInstance.pressedCount).toBe(0);
  });

  it('renders a visually-only indicator dot and exposes its state via aria-describedby', () => {
    const fixture = TestBed.createComponent(IndicatorHostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen');

    const indicator = button.querySelector('.app-icon-button__indicator');
    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');

    const describedById = button.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();

    const description = fixture.nativeElement.querySelector(`#${describedById}`) as HTMLElement;
    expect(description).not.toBeNull();
    expect(description.textContent?.trim()).toBe('1 neue');
    expect(description.classList.contains('app-icon-button__visually-hidden')).toBe(true);
  });

  it('does not set aria-describedby when no indicator is shown', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});
