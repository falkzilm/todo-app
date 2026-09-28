import { Component, inject } from '@angular/core';
import { AppTitleService } from '../../core/services/app-title.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';
import { UserCardComponent } from './user-card/user-card.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IconComponent, SidebarNavComponent, UserCardComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly title = inject(AppTitleService).title;
}
