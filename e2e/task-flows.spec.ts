import { expect, test } from '@playwright/test';
import { addTaskForSelectedDay, germanDateLabel, gotoFresh } from './support';

/**
 * E2E-Smoke-Tests der Kernflüsse (DEMOPROJEK-52): Aufgabe anlegen, abhaken,
 * Persistenz über Reload, sowie Tag im Kalender auswählen und Aufgabe
 * darüber umplanen. Jeder Test startet über `gotoFresh` mit einem leeren
 * Storage-Zustand, damit die Läufe voneinander unabhängig und wiederholbar
 * grün sind.
 */
test.describe('Kernflüsse', () => {
  test('Aufgabe anlegen', async ({ page }) => {
    await gotoFresh(page, '/kalender');

    const title = 'Neue Testaufgabe';
    await page.getByPlaceholder('Aufgabe für diesen Tag hinzufügen').fill(title);
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
  });

  test('Aufgabe abhaken', async ({ page }) => {
    await gotoFresh(page, '/kalender');

    const title = 'Aufgabe zum Abhaken';
    await addTaskForSelectedDay(page, title);

    const checkbox = page.getByRole('checkbox', { name: title });
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();

    await expect(checkbox).toBeChecked();
    await expect(
      page.locator('li.app-task-item--completed').filter({ hasText: title }),
    ).toBeVisible();
  });

  test('Aufgaben bleiben nach einem Reload erhalten', async ({ page }) => {
    await gotoFresh(page, '/kalender');

    const title = 'Persistente Aufgabe';
    await addTaskForSelectedDay(page, title);
    await page.getByRole('checkbox', { name: title }).click();
    await expect(page.getByRole('checkbox', { name: title })).toBeChecked();

    await page.reload();

    const reloadedCheckbox = page.getByRole('checkbox', { name: title });
    await expect(reloadedCheckbox).toBeVisible();
    await expect(reloadedCheckbox).toBeChecked();
  });

  test('Tag im Kalender auswählen und Aufgabe darüber umplanen', async ({ page }) => {
    await gotoFresh(page, '/kalender');

    const today = new Date();
    const todayLabel = germanDateLabel(today);

    // Select today's cell in the main calendar grid explicitly.
    await page.getByRole('gridcell', { name: todayLabel }).click();

    const todayPanel = page.getByRole('region', { name: `Aufgaben für ${todayLabel}` });
    await expect(todayPanel).toBeVisible();

    const title = 'Aufgabe zum Umplanen';
    await addTaskForSelectedDay(page, title);
    const taskItem = todayPanel.getByRole('listitem').filter({ hasText: title });
    await expect(taskItem).toBeVisible();

    // Reschedule the task to tomorrow via the task's calendar date-picker.
    await taskItem.getByRole('button', { name: 'Fälligkeitsdatum ändern' }).click();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowLabel = germanDateLabel(tomorrow);

    await page.getByRole('dialog').getByRole('gridcell', { name: tomorrowLabel }).click();

    // The task moved away from today's list...
    await expect(todayPanel.getByRole('listitem').filter({ hasText: title })).toHaveCount(0);

    // ...and now shows up after selecting tomorrow in the calendar.
    await page.getByRole('gridcell', { name: tomorrowLabel }).click();
    const tomorrowPanel = page.getByRole('region', { name: `Aufgaben für ${tomorrowLabel}` });
    await expect(tomorrowPanel.getByRole('listitem').filter({ hasText: title })).toBeVisible();
  });
});
