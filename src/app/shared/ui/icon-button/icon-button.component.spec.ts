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
});
