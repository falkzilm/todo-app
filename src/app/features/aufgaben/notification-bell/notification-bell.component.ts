import { Component, computed, input, output } from '@angular/core';
import { IconButtonComponent } from '../../../shared/ui/icon-button/icon-button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [IconButtonComponent, IconComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  /** No notifications backend exists yet; a future item is expected to feed this from real data. */
  readonly unreadCount = input(0);

  readonly pressed = output<void>();

  protected readonly indicator = computed(() => {
    const count = this.unreadCount();
    return count > 0 ? `${count} neue Benachrichtigung(en)` : false;
  });

  protected onClick(): void {
    this.pressed.emit();
  }
}
