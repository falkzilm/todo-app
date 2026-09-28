import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnnouncerService } from './core/services/announcer.service';
import { StorageStatusService } from './core/services/storage-status.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly storageUnavailable = inject(StorageStatusService).unavailable;
  protected readonly announcement = inject(AnnouncerService).message;
}
