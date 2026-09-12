import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProgressRingComponent } from './progress-ring.component';

@Component({
  standalone: true,
  imports: [ProgressRingComponent],
  template: `<app-progress-ring
    [value]="value"
    [max]="max"
    ariaLabel="Fortschritt heute"
    [ariaValueText]="valueText"
  />`,
})
class HostComponent {
  value = 0;
  max = 5;
  valueText = '0 von 5 Aufgaben erledigt';
}

function render() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    progressbar: root.querySelector('[role="progressbar"]') as HTMLElement,
    circle: root.querySelector('.app-progress-ring__progress') as SVGCircleElement,
    value: root.querySelector('.app-progress-ring__value') as HTMLElement,
    max: root.querySelector('.app-progress-ring__max') as HTMLElement,
  };
}

describe('ProgressRingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders a fully "empty" ring at 0%', () => {
    const { progressbar, circle, value, max } = render();

    expect(progressbar.getAttribute('role')).toBe('progressbar');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('5');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('0 von 5 Aufgaben erledigt');
    expect(progressbar.getAttribute('aria-label')).toBe('Fortschritt heute');
    expect(value.textContent).toBe('0');
    expect(max.textContent).toBe('/5');

    const circumference = Number(circle.getAttribute('stroke-dasharray'));
    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 5);
  });

  it('renders a partially filled ring at 60% (3/5)', () => {
    const { fixture, circle, progressbar, value, max } = render();
    fixture.componentInstance.value = 3;
    fixture.componentInstance.valueText = '3 von 5 Aufgaben erledigt';
    fixture.detectChanges();

    expect(progressbar.getAttribute('aria-valuenow')).toBe('3');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('3 von 5 Aufgaben erledigt');
    expect(value.textContent).toBe('3');
    expect(max.textContent).toBe('/5');

    const circumference = Number(circle.getAttribute('stroke-dasharray'));
    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.4, 5);
  });

  it('renders a fully filled ring at 100%', () => {
    const { fixture, circle, progressbar } = render();
    fixture.componentInstance.value = 5;
    fixture.componentInstance.valueText = '5 von 5 Aufgaben erledigt';
    fixture.detectChanges();

    expect(progressbar.getAttribute('aria-valuenow')).toBe('5');

    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 5);
  });

  it('renders an empty ring without dividing by zero when max is 0', () => {
    const { fixture, circle, progressbar, max } = render();
    fixture.componentInstance.value = 0;
    fixture.componentInstance.max = 0;
    fixture.componentInstance.valueText = '0 von 0 Aufgaben erledigt';
    fixture.detectChanges();

    expect(progressbar.getAttribute('aria-valuemax')).toBe('0');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
    expect(max.textContent).toBe('/0');

    const circumference = Number(circle.getAttribute('stroke-dasharray'));
    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 5);
    expect(Number.isNaN(Number(circle.getAttribute('stroke-dashoffset')))).toBe(false);
  });
});
