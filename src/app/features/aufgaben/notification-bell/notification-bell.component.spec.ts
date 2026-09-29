import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';

@Component({
  standalone: true,
  imports: [NotificationBellComponent],
  template: `<app-notification-bell [unreadCount]="unreadCount" (pressed)="onPressed()" />`,
})
class HostComponent {
  unreadCount = 0;
  pressedCount = 0;

  onPressed(): void {
    this.pressedCount++;
  }
}

describe('NotificationBellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders a labeled bell button without an indicator by default', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Benachrichtigungen');
    expect(fixture.nativeElement.querySelector('.app-icon-button__indicator')).toBeNull();
  });

  it('shows an indicator with an accessible count when there are unread notifications', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.unreadCount = 2;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-icon-button__indicator')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('2 neue Benachrichtigung(en)');
  });

  it('emits pressed when clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(fixture.componentInstance.pressedCount).toBe(1);
  });
});
