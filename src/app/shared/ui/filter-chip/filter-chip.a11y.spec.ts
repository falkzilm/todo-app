import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { FilterChipIconComponent } from './filter-chip-icon.component';
import { FilterChipComponent } from './filter-chip.component';

@Component({
  standalone: true,
  imports: [FilterChipComponent, FilterChipIconComponent],
  template: `
    <app-filter-chip icon="sun" label="Heute" [active]="true" />
    <app-filter-chip icon="calendar-range" label="Diese Woche" />
    <app-filter-chip icon="star" label="Wichtig" />
    <app-filter-chip-icon icon="sliders" ariaLabel="Weitere Filter" />
  `,
})
class HostComponent {}

describe('FilterChipComponent a11y', () => {
  it('has no WCAG 2 A/AA violations for a group of chips plus an icon-only chip', async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
