/**
 * Reference to a category color token (`--color-category-*` in
 * `src/styles/_tokens.scss`), e.g. for a category's dot/bar fill color.
 */
export type CategoryColor = 'violet' | 'green' | 'orange' | 'blue';

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly color: CategoryColor;
}

/**
 * Fixed starting set of categories, extensible by appending further entries
 * (no dedicated management UI exists yet).
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'arbeit', name: 'Arbeit', color: 'violet' },
  { id: 'privat', name: 'Privat', color: 'green' },
];
