import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnnouncerService } from './core/services/announcer.service';
import { AppTitleService } from './core/services/app-title.service';
import { StorageStatusService } from './core/services/storage-status.service';
import { UserProfileService } from './core/services/user-profile.service';
import { AvatarComponent } from './shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly title = inject(AppTitleService).title;
  protected readonly storageUnavailable = inject(StorageStatusService).unavailable;
  protected readonly announcement = inject(AnnouncerService).message;

  private readonly userProfile = inject(UserProfileService);
  protected readonly userDisplayName = this.userProfile.displayName;
  protected readonly userEmail = this.userProfile.email;
  protected readonly userAvatarSrc = computed(() => this.userProfile.avatarSrc() ?? undefined);
}
