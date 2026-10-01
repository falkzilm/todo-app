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

  describe('Botschaftsvarianten', () => {
    it('shows a get-started message when nothing is completed yet (0%)', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.completed = 0;
      fixture.componentInstance.total = 5;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Auf geht’s!');
      expect(fixture.nativeElement.textContent).toContain(
        'Du hast heute noch keine Aufgabe erledigt. Leg los! 💪',
      );
    });

    it('shows an encouraging message for partial progress', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.completed = 3;
      fixture.componentInstance.total = 5;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Tolle Arbeit!');
      expect(fixture.nativeElement.textContent).toContain(
        'Du hast 3 von 5 Aufgaben für heute erledigt. 🎉',
      );
    });

    it('shows a celebratory message when everything is completed (100%)', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.completed = 5;
      fixture.componentInstance.total = 5;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Geschafft!');
      expect(fixture.nativeElement.textContent).toContain(
        'Du hast heute alle 5 Aufgaben erledigt. 🎉',
      );
    });
  });
});
