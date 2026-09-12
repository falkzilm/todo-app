import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { ProgressRingComponent } from './progress-ring.component';

@Component({
  standalone: true,
  imports: [ProgressRingComponent],
  template: `
    <app-progress-ring
      [value]="3"
      [max]="5"
      ariaLabel="Fortschritt heute"
      ariaValueText="3 von 5 Aufgaben erledigt"
    />
  `,
})
class HostComponent {}

describe('ProgressRingComponent a11y', () => {
  it('has no WCAG 2 A/AA violations', async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
