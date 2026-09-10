import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [disabled]="disabled" (pressed)="onPressed()">Save</app-button>`,
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
  imports: [ButtonComponent],
  template: `<app-button variant="secondary" size="sm" icon="star">Wichtig</app-button>`,
})
class IconHostComponent {}

describe('ButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders the projected label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Save');
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

  it('renders a leading icon before the projected label and applies size/variant classes', async () => {
    await TestBed.configureTestingModule({
      imports: [IconHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(IconHostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('app-button--secondary')).toBe(true);
    expect(button.classList.contains('app-button--sm')).toBe(true);

    expect(button.firstElementChild?.tagName.toLowerCase()).toBe('app-icon');
    expect(button.textContent).toContain('Wichtig');
  });
});
