import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks whether task changes are currently being persisted, so the UI can
 * show a subtle hint instead of the app silently failing to save.
 *
 * Two independent conditions feed into this:
 * - `inMemoryMode`: `localStorage` was unusable at startup (private
 *   browsing, disabled storage); the app fell back to an in-memory store for
 *   the whole session, so this never clears again.
 * - `saveFailed`: an individual write failed (e.g. `QuotaExceededError`)
 *   while storage itself is otherwise usable; this clears again once a
 *   later write succeeds.
 */
@Injectable({ providedIn: 'root' })
export class StorageStatusService {
  private readonly _inMemoryMode = signal(false);
  private readonly _saveFailed = signal(false);

  readonly inMemoryMode = this._inMemoryMode.asReadonly();
  readonly saveFailed = this._saveFailed.asReadonly();

  /** Whether changes are currently not being persisted, for any reason. */
  readonly unavailable = computed(() => this._inMemoryMode() || this._saveFailed());

  markInMemoryMode(): void {
    this._inMemoryMode.set(true);
  }

  markSaveFailed(): void {
    this._saveFailed.set(true);
  }

  markSaveSucceeded(): void {
    this._saveFailed.set(false);
  }
}
