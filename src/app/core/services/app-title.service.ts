import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  readonly title = signal('FocusDay');

  constructor() {
    effect(() => {
      document.title = this.title();
    });
  }
}
