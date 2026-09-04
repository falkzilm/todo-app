import { Page } from '@playwright/test';

/** Must match `STORAGE_KEY` in `src/app/core/services/task-persistence.service.ts`. */
const TASKS_STORAGE_KEY = 'todo-app.tasks';

const EMPTY_TASKS_STATE = JSON.stringify({ version: 1, tasks: [] });

/**
 * Navigates to `path` with a guaranteed-empty task list. Persistence seeds
 * demo tasks only the very first time nothing has ever been saved, which
 * would otherwise make every test's initial state depend on whatever an
 * earlier test (or run) left behind; writing the empty state and reloading
 * gives every test the same deterministic, repeatable starting point.
 */
export async function gotoFresh(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: TASKS_STORAGE_KEY,
    value: EMPTY_TASKS_STATE,
  });
  await page.reload();
}

/** Adds a task for the currently selected calendar day via the quick-add form. */
export async function addTaskForSelectedDay(page: Page, title: string): Promise<void> {
  await page.getByPlaceholder('Aufgabe für diesen Tag hinzufügen').fill(title);
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
}

export function germanDateLabel(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
