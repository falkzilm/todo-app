import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnnouncerService } from './core/services/announcer.service';
import { AppTitleService } from './core/services/app-title.service';
import { StorageStatusService } from './core/services/storage-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly title = inject(AppTitleService).title;
  protected readonly storageUnavailable = inject(StorageStatusService).unavailable;
  protected readonly announcement = inject(AnnouncerService).message;
}
