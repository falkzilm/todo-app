import { Injectable, signal } from '@angular/core';

/**
 * Zentrale Live-Region für Screenreader-Ankündigungen (DEMOPROJEK-49): Seiten
 * rufen `announce()` auf, `AppComponent` rendert die aktuelle Nachricht in
 * eine unsichtbare `aria-live="polite"`-Region, die auf jeder Route sichtbar
 * (für AT) bleibt.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncerService {
  private readonly messageSignal = signal('');

  readonly message = this.messageSignal.asReadonly();

  /**
   * Leert die Live-Region kurz, bevor die neue Nachricht gesetzt wird, damit
   * Screenreader auch zwei aufeinanderfolgende, identische Ankündigungen
   * (z. B. zweimal "gelöscht") als Änderung erkennen und vorlesen.
   */
  announce(text: string): void {
    this.messageSignal.set('');
    setTimeout(() => this.messageSignal.set(text));
  }
}
