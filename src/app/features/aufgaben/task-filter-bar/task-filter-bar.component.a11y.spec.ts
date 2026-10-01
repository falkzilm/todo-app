import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { TaskFilterBarComponent, TaskFilterId } from './task-filter-bar.component';

@Component({
  standalone: true,
  imports: [TaskFilterBarComponent],
  template: `<app-task-filter-bar [active]="active" />`,
})
class HostComponent {
  active: TaskFilterId = 'today';
}

describe('TaskFilterBarComponent a11y', () => {
  it('has no WCAG 2 A/AA violations with the popover closed', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with the Sliders popover open', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-filter-chip-icon') as HTMLElement).click();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
