import { Component, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { SidebarOverlayService } from '../../../core/services/sidebar-overlay.service';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconButtonComponent, IconComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly greeting = input<string>();

  protected readonly overlay = inject(SidebarOverlayService);

  private readonly sidebarToggleHost = viewChild<ElementRef<HTMLElement>, ElementRef<HTMLElement>>(
    'sidebarToggle',
    { read: ElementRef },
  );

  constructor() {
    // Registriert den echten `<button>` von `app-icon-button` als Fokus-Ziel
    // für SidebarOverlayService.close(), damit der Fokus nach dem Schließen
    // der Overlay-Leiste zurück zum Hamburger-Button springt (TDP-27). Läuft
    // pro Route neu, da `app-page-header` bei jedem Seitenwechsel neu erzeugt
    // wird.
    effect(() => {
      const hostElement = this.sidebarToggleHost()?.nativeElement ?? null;
      const button = hostElement?.querySelector<HTMLButtonElement>('button') ?? null;
      this.overlay.registerTrigger(button);
    });
  }

  protected toggleSidebar(): void {
    this.overlay.toggle();
  }
}
