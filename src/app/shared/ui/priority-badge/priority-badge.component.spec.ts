import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Priority, PriorityBadgeComponent } from './priority-badge.component';

@Component({
  standalone: true,
  imports: [PriorityBadgeComponent],
  template: `<app-priority-badge [priority]="priority" />`,
})
class HostComponent {
  priority: Priority = 'high';
}

describe('PriorityBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  const cases: [Priority, string, string][] = [
    ['high', 'Hoch', 'app-priority-badge--high'],
    ['medium', 'Mittel', 'app-priority-badge--medium'],
    ['low', 'Niedrig', 'app-priority-badge--low'],
  ];

  it.each(cases)(
    'renders the "%s" priority with its label and modifier class',
    (priority, label, modifierClass) => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.priority = priority;
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.app-priority-badge') as HTMLElement;
      expect(badge.textContent).toContain(label);
      expect(badge.classList.contains(modifierClass)).toBe(true);
      expect(badge.getAttribute('aria-label')).toBe(`Priorität: ${label}`);
    },
  );

  it('shows the flag icon only for the "high" priority', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.priority = 'high';
    fixture.detectChanges();

    let badge = fixture.nativeElement.querySelector('.app-priority-badge') as HTMLElement;
    expect(badge.querySelector('svg')).not.toBeNull();

    fixture.componentInstance.priority = 'medium';
    fixture.detectChanges();
    badge = fixture.nativeElement.querySelector('.app-priority-badge') as HTMLElement;
    expect(badge.querySelector('svg')).toBeNull();

    fixture.componentInstance.priority = 'low';
    fixture.detectChanges();
    badge = fixture.nativeElement.querySelector('.app-priority-badge') as HTMLElement;
    expect(badge.querySelector('svg')).toBeNull();
  });
});
