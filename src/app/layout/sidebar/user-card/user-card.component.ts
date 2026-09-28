import { Component, computed, inject } from '@angular/core';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';

/**
 * Stub für die Nutzerkarte in der Sidebar (TDP-23): zeigt vorerst nur
 * Avatar, Name und E-Mail. Interaktionen (Menü, Abmelden, …) aus dem
 * Referenzbild landen in einem Folge-Ticket, das ausschließlich in diesem
 * Ordner arbeitet.
 */
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
})
export class UserCardComponent {
  private readonly userProfile = inject(UserProfileService);
  protected readonly displayName = this.userProfile.displayName;
  protected readonly email = this.userProfile.email;
  protected readonly avatarSrc = computed(() => this.userProfile.avatarSrc() ?? undefined);
}
