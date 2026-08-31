import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  readonly title = signal('ToDo App');

  constructor() {
    effect(() => {
      document.title = this.title();
    });
  }
}
