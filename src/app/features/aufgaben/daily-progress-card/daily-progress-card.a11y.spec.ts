import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { DailyProgressCardComponent } from './daily-progress-card.component';

@Component({
  standalone: true,
  imports: [DailyProgressCardComponent],
  template: `<app-daily-progress-card [completed]="completed" [total]="total" />`,
})
class HostComponent {
  completed = 3;
  total = 5;
}

describe('DailyProgressCardComponent a11y', () => {
  async function render(completed: number, total: number) {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.completed = completed;
    fixture.componentInstance.total = total;
    fixture.detectChanges();
    return fixture;
  }

  it('has no WCAG 2 A/AA violations for partial progress', async () => {
    const fixture = await render(3, 5);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations when nothing is completed yet', async () => {
    const fixture = await render(0, 5);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations when everything is completed', async () => {
    const fixture = await render(5, 5);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations when there are no tasks for today', async () => {
    const fixture = await render(0, 0);
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
