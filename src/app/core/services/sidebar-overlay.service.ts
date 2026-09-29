import { Injectable, signal } from '@angular/core';

/**
 * Ab dieser Breite ist die Sidebar dauerhaft im Layout sichtbar statt als
 * ausklappbare Overlay-Leiste (TDP-27). Muss mit dem `(min-width: 960px)`
 * Breakpoint in `sidebar.component.scss`, `page-header.component.scss` und
 * `app.component.scss` übereinstimmen.
 */
export const SIDEBAR_COLLAPSE_BREAKPOINT_PX = 960;

function isNarrowViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT_PX;
}

/**
 * Teilt sich der Hamburger-Button (im `app-page-header`, siehe TDP-27) und die
 * `app-sidebar` als einzige gemeinsame Instanz: beide Komponenten hängen an
 * unterschiedlichen Stellen im Baum (die Sidebar neben, der Button innerhalb
 * des gerouteten Inhalts), ein Service ist daher der einfachste Weg, den
 * Öffnungszustand und den Fokus-Rücksprung zum auslösenden Button zu teilen.
 */
@Injectable({ providedIn: 'root' })
export class SidebarOverlayService {
  private readonly openSignal = signal(false);
  readonly open = this.openSignal.asReadonly();

  private readonly narrowViewportSignal = signal(isNarrowViewport());
  /**
   * Unterhalb von `SIDEBAR_COLLAPSE_BREAKPOINT_PX`: die Sidebar rendert dann
   * zwar immer, ist aber solange geschlossen visuell und für Tastatur-/AT-Fokus
   * unerreichbar (`inert`) statt nur off-canvas verschoben - sonst blieben
   * ihre Links per Tab erreichbar, obwohl sie unsichtbar sind.
   */
  readonly narrowViewport = this.narrowViewportSignal.asReadonly();

  private trigger: HTMLElement | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('resize', () => this.onResize());
  }

  registerTrigger(element: HTMLElement | null): void {
    this.trigger = element;
  }

  toggle(): void {
    this.openSignal.update((open) => !open);
  }

  /** Schließt die Overlay-Leiste und gibt den Fokus an den Hamburger-Button zurück (Akzeptanzkriterium). */
  close(): void {
    if (!this.openSignal()) {
      return;
    }
    this.openSignal.set(false);
    this.trigger?.focus();
  }

  private onResize(): void {
    this.narrowViewportSignal.set(isNarrowViewport());
    if (!this.narrowViewportSignal()) {
      this.openSignal.set(false);
    }
  }
}
