import { TestBed } from '@angular/core/testing';
import { STORAGE } from './storage.token';
import { UserProfileService } from './user-profile.service';

function createMockStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('UserProfileService', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE, useValue: storage }],
    });
  });

  it('defaults to the demo profile from the reference design when nothing is persisted', () => {
    const service = TestBed.inject(UserProfileService);

    expect(service.displayName()).toBe('Laura Becker');
    expect(service.email()).toBe('laura@focusday.de');
    expect(service.avatarSrc()).toBeNull();
  });

  it('exposes displayName, email and avatarSrc as readonly signals', () => {
    const service = TestBed.inject(UserProfileService);

    expect(typeof service.displayName).toBe('function');
    expect('set' in service.displayName).toBe(false);
    expect('set' in service.email).toBe(false);
    expect('set' in service.avatarSrc).toBe(false);
  });

  it('restores a previously persisted profile instead of the defaults', () => {
    storage.setItem(
      'todo-app.user-profile',
      JSON.stringify({
        displayName: 'Max Mustermann',
        email: 'max@focusday.de',
        avatarSrc: '/assets/max.png',
      }),
    );

    const service = TestBed.inject(UserProfileService);

    expect(service.displayName()).toBe('Max Mustermann');
    expect(service.email()).toBe('max@focusday.de');
    expect(service.avatarSrc()).toBe('/assets/max.png');
  });

  it('persists changes made via the setters', () => {
    const service = TestBed.inject(UserProfileService);

    service.setDisplayName('Erika Musterfrau');
    service.setEmail('erika@focusday.de');
    service.setAvatarSrc('/assets/erika.png');

    const raw = storage.getItem('todo-app.user-profile');
    expect(JSON.parse(raw as string)).toEqual({
      displayName: 'Erika Musterfrau',
      email: 'erika@focusday.de',
      avatarSrc: '/assets/erika.png',
    });
  });

  it('restores persisted changes on the next start', () => {
    const first = TestBed.inject(UserProfileService);
    first.setDisplayName('Erika Musterfrau');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE, useValue: storage }],
    });
    const second = TestBed.inject(UserProfileService);

    expect(second.displayName()).toBe('Erika Musterfrau');
  });

  it('trims whitespace and rejects an empty display name', () => {
    const service = TestBed.inject(UserProfileService);

    service.setDisplayName('  Erika Musterfrau  ');
    expect(service.displayName()).toBe('Erika Musterfrau');

    expect(() => service.setDisplayName('   ')).toThrow();
  });

  it('trims whitespace and rejects an empty email', () => {
    const service = TestBed.inject(UserProfileService);

    service.setEmail('  erika@focusday.de  ');
    expect(service.email()).toBe('erika@focusday.de');

    expect(() => service.setEmail('   ')).toThrow();
  });

  it('falls back to the defaults when the persisted value is not valid JSON', () => {
    storage.setItem('todo-app.user-profile', '{not-json');

    const service = TestBed.inject(UserProfileService);

    expect(service.displayName()).toBe('Laura Becker');
  });

  it('falls back to the defaults when the persisted value is not an object', () => {
    storage.setItem('todo-app.user-profile', JSON.stringify('not an object'));

    const service = TestBed.inject(UserProfileService);

    expect(service.displayName()).toBe('Laura Becker');
  });

  it('falls back to the defaults when the persisted value has missing or wrongly typed fields', () => {
    storage.setItem('todo-app.user-profile', JSON.stringify({ displayName: 'Nur ein Name' }));

    const service = TestBed.inject(UserProfileService);

    expect(service.displayName()).toBe('Laura Becker');
    expect(service.email()).toBe('laura@focusday.de');
  });

  describe('with a storage that rejects reads (e.g. blocked storage)', () => {
    it('does not throw and falls back to the default profile', () => {
      vi.spyOn(storage, 'getItem').mockImplementation(() => {
        throw new DOMException('storage disabled', 'SecurityError');
      });

      let service!: UserProfileService;
      expect(() => (service = TestBed.inject(UserProfileService))).not.toThrow();
      expect(service.displayName()).toBe('Laura Becker');
    });
  });

  describe('with a storage that rejects writes (e.g. quota exceeded)', () => {
    it('does not throw and keeps the in-memory change even though it was not saved', () => {
      const service = TestBed.inject(UserProfileService);
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      });

      expect(() => service.setDisplayName('Erika Musterfrau')).not.toThrow();
      expect(service.displayName()).toBe('Erika Musterfrau');
    });
  });
});
