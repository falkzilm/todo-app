import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CheckboxComponent],
  template: `<app-checkbox [formControl]="control" label="Akzeptieren" />`,
})
class HostComponent {
  control = new FormControl(false, { nonNullable: true });
}

describe('CheckboxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders the label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-checkbox__label')?.textContent).toContain('Akzeptieren');
  });

  it('updates the bound form control when toggled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('reflects the disabled state of the form control', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('exposes the checked state via aria-checked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.getAttribute('aria-checked')).toBe('false');

    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();

    expect(input.getAttribute('aria-checked')).toBe('true');
  });

  it('toggles the bound form control when Enter is pressed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(fixture.componentInstance.control.value).toBe(true);
  });
});
