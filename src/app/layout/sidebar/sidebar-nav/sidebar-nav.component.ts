import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../../shared/ui/icon/icon.component';

interface SidebarNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: IconName;
}

const NAV_ITEMS: readonly SidebarNavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'home' },
  { label: 'Aufgaben', route: '/aufgaben', icon: 'check-square' },
  { label: 'Kalender', route: '/kalender', icon: 'calendar' },
  { label: 'Projekte', route: '/projekte', icon: 'clipboard-list' },
  { label: 'Einstellungen', route: '/einstellungen', icon: 'settings' },
];

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss',
})
export class SidebarNavComponent {
  protected readonly items = NAV_ITEMS;

  /** Meldet die Auswahl eines Eintrags, damit eine offene Overlay-Leiste (TDP-27) sich schließen kann. */
  readonly linkActivated = output<void>();
}
