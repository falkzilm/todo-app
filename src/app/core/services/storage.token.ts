import { InjectionToken, inject } from '@angular/core';
import { StorageStatusService } from './storage-status.service';

/** A `Storage` implementation backed by an in-memory map instead of the browser. */
export function createInMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

/**
 * Returns `getRealStorage()` if it is actually usable, or an in-memory
 * fallback otherwise. "Usable" is verified with a real write, not just
 * presence: private browsing in some browsers exposes `localStorage` but
 * throws on every read/write (or caps it at zero quota), and some browsers
 * throw on accessing `localStorage` itself when storage is disabled.
 * `onFallback` is called exactly when the fallback is used.
 */
export function resolveAvailableStorage(
  getRealStorage: () => Storage,
  onFallback: () => void,
): Storage {
  try {
    const storage = getRealStorage();
    const probeKey = '__storage_probe__';
    storage.setItem(probeKey, probeKey);
    storage.removeItem(probeKey);
    return storage;
  } catch (error) {
    console.warn('localStorage is unavailable; falling back to in-memory storage.', error);
    onFallback();
    return createInMemoryStorage();
  }
}

/**
 * Injectable handle to the Web Storage used for persistence.
 * Allows tests to provide a mocked `Storage` instead of the real `localStorage`.
 */
export const STORAGE = new InjectionToken<Storage>('STORAGE', {
  providedIn: 'root',
  factory: () => {
    const status = inject(StorageStatusService);
    return resolveAvailableStorage(
      () => window.localStorage,
      () => status.markInMemoryMode(),
    );
  },
});
