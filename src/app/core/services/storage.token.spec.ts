import { createInMemoryStorage, resolveAvailableStorage } from './storage.token';

/** A storage whose writes always fail, e.g. a browser reporting a full quota. */
function createWriteRejectingStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: () => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
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

describe('createInMemoryStorage', () => {
  it('behaves like a fully usable Storage', () => {
    const storage = createInMemoryStorage();

    expect(storage.getItem('missing')).toBeNull();

    storage.setItem('a', '1');
    storage.setItem('b', '2');
    expect(storage.getItem('a')).toBe('1');
    expect(storage.length).toBe(2);
    expect(storage.key(0)).toBe('a');

    storage.removeItem('a');
    expect(storage.getItem('a')).toBeNull();
    expect(storage.length).toBe(1);

    storage.clear();
    expect(storage.length).toBe(0);
  });

  it('keeps separate state per instance', () => {
    const first = createInMemoryStorage();
    const second = createInMemoryStorage();

    first.setItem('key', 'value');

    expect(second.getItem('key')).toBeNull();
  });
});

describe('resolveAvailableStorage', () => {
  it('returns the real storage and does not call onFallback when it is usable', () => {
    const real = createInMemoryStorage();
    const onFallback = vi.fn();

    const resolved = resolveAvailableStorage(() => real, onFallback);

    expect(resolved).toBe(real);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('falls back to an in-memory storage and calls onFallback when accessing storage throws', () => {
    const onFallback = vi.fn();

    const resolved = resolveAvailableStorage(() => {
      throw new DOMException('storage disabled', 'SecurityError');
    }, onFallback);

    expect(onFallback).toHaveBeenCalledOnce();
    expect(() => resolved.setItem('a', '1')).not.toThrow();
    expect(resolved.getItem('a')).toBe('1');
  });

  it('falls back to an in-memory storage and calls onFallback when writing to storage throws', () => {
    const onFallback = vi.fn();
    const blocked = createWriteRejectingStorage();

    const resolved = resolveAvailableStorage(() => blocked, onFallback);

    expect(onFallback).toHaveBeenCalledOnce();
    expect(resolved).not.toBe(blocked);
    expect(() => resolved.setItem('a', '1')).not.toThrow();
    expect(resolved.getItem('a')).toBe('1');
  });
});
