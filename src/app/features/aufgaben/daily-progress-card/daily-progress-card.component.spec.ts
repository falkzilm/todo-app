import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

describe('DailyProgressCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('shows the completed/total count and a progress ring', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Du hast 3 von 5 Aufgaben für heute erledigt.',
    );
    const ring = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(ring.getAttribute('aria-valuenow')).toBe('3');
    expect(ring.getAttribute('aria-valuemax')).toBe('5');
  });

  it('shows a quiet empty state instead of a ring when there are no tasks for today', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.completed = 0;
    fixture.componentInstance.total = 0;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Für heute steht nichts an.');
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
  });
});
