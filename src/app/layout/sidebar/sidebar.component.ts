import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { AppTitleService } from '../../core/services/app-title.service';
import { SidebarOverlayService } from '../../core/services/sidebar-overlay.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';
import { UserCardComponent } from './user-card/user-card.component';

/**
 * Auf schmalen Viewports (< 960px, siehe `SIDEBAR_COLLAPSE_BREAKPOINT_PX`)
 * verhält sich dieselbe `<aside>` als ausklappbare Overlay-Leiste statt als
 * dauerhaft sichtbare Spalte im Layout (TDP-27): Escape, Klick auf die
 * Abdunkelung und die Auswahl eines Navigationseintrags schließen sie
 * wieder, der Tab-Fokus bleibt währenddessen innerhalb der Leiste.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IconComponent, SidebarNavComponent, UserCardComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly title = inject(AppTitleService).title;
  protected readonly overlay = inject(SidebarOverlayService);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      if (!this.overlay.open()) {
        return;
      }
      afterNextRender(() => this.focusFirstElement(), { injector: this.injector });
    });
  }

  protected onBackdropClick(): void {
    this.overlay.close();
  }

  protected onNavigate(): void {
    this.overlay.close();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (!this.overlay.open()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.overlay.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    this.getFocusableElements()[0]?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>(selector));
  }
}
