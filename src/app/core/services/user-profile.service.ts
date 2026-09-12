import { Injectable, inject, signal } from '@angular/core';
import { STORAGE } from './storage.token';

const STORAGE_KEY = 'todo-app.user-profile';

export interface UserProfile {
  displayName: string;
  email: string;
  avatarSrc: string | null;
}

/**
 * Fixed demo profile used until settings offer editing (see TDP-20): a
 * dedicated login/registration flow is out of scope for this local-only app.
 */
const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Laura Becker',
  email: 'laura@focusday.de',
  avatarSrc: null,
};

function isValidPersistedProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const profile = value as Record<string, unknown>;

  return (
    typeof profile['displayName'] === 'string' &&
    profile['displayName'].trim().length > 0 &&
    typeof profile['email'] === 'string' &&
    profile['email'].trim().length > 0 &&
    (profile['avatarSrc'] === null || typeof profile['avatarSrc'] === 'string')
  );
}

/**
 * Holds the current user's profile (display name, email, avatar) for the
 * dashboard greeting and the sidebar user card. Persisted locally via the
 * same `STORAGE` token the tasks use, kept writable from the start so a
 * future settings page can call the setters without a model change.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly storage = inject(STORAGE);

  private readonly initialProfile = this.load();

  private readonly displayNameSignal = signal(this.initialProfile.displayName);
  private readonly emailSignal = signal(this.initialProfile.email);
  private readonly avatarSrcSignal = signal(this.initialProfile.avatarSrc);

  readonly displayName = this.displayNameSignal.asReadonly();
  readonly email = this.emailSignal.asReadonly();
  readonly avatarSrc = this.avatarSrcSignal.asReadonly();

  setDisplayName(displayName: string): void {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('Display name must not be empty.');
    }

    this.displayNameSignal.set(trimmed);
    this.persist();
  }

  setEmail(email: string): void {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Email must not be empty.');
    }

    this.emailSignal.set(trimmed);
    this.persist();
  }

  setAvatarSrc(avatarSrc: string | null): void {
    this.avatarSrcSignal.set(avatarSrc);
    this.persist();
  }

  private load(): UserProfile {
    let raw: string | null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to read persisted user profile; using defaults.', error);
      return DEFAULT_PROFILE;
    }

    if (raw === null) {
      return DEFAULT_PROFILE;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return isValidPersistedProfile(parsed) ? parsed : DEFAULT_PROFILE;
    } catch {
      console.warn('Failed to parse persisted user profile; using defaults.');
      return DEFAULT_PROFILE;
    }
  }

  private persist(): void {
    const profile: UserProfile = {
      displayName: this.displayNameSignal(),
      email: this.emailSignal(),
      avatarSrc: this.avatarSrcSignal(),
    };

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to persist user profile; changes will not be saved.', error);
    }
  }
}
