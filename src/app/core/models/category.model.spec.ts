import { DEFAULT_CATEGORIES } from './category.model';

describe('DEFAULT_CATEGORIES', () => {
  it('includes "Arbeit" and "Privat" with a unique id and color each', () => {
    const names = DEFAULT_CATEGORIES.map((category) => category.name);
    expect(names).toContain('Arbeit');
    expect(names).toContain('Privat');

    const ids = DEFAULT_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
