import { InjectionToken } from '@angular/core';

/**
 * Injectable handle to the Web Storage used for persistence.
 * Allows tests to provide a mocked `Storage` instead of the real `localStorage`.
 */
export const STORAGE = new InjectionToken<Storage>('STORAGE', {
  providedIn: 'root',
  factory: () => window.localStorage,
});
