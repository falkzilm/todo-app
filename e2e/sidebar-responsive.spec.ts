import { expect, test } from '@playwright/test';

/**
 * E2E-Tests der responsiven Sidebar (TDP-27): unter 960px klappt sie aus dem
 * Layout heraus und wird über einen Hamburger-Button im Inhaltskopf als
 * Overlay-Leiste eingeblendet. Läuft gegen einen echten Browser, weil die
 * betroffenen Kriterien (Viewport-Breakpoint, horizontales Scrollen,
 * Tab-Fokus-Reihenfolge) sich in jsdom-Komponententests nicht verlässlich
 * prüfen lassen.
 */
test.describe('Sidebar: Verhalten auf schmalen Viewports', () => {
  test('ab 960px ist die Sidebar dauerhaft sichtbar und es gibt keinen Hamburger-Button', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 960, height: 800 });
    await page.goto('/kalender');

    await expect(page.getByRole('complementary')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Navigation öffnen' })).toBeHidden();
  });

  test('unter 960px ist die Sidebar ausgeblendet und über den Hamburger-Button erreichbar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/kalender');

    const toggle = page.getByRole('button', { name: 'Navigation öffnen' });
    await expect(toggle).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toHaveCount(0);

    await toggle.click();

    const overlay = page.getByRole('dialog', { name: 'Navigation' });
    await expect(overlay).toBeVisible();
    await expect(overlay.getByRole('link', { name: 'Kalender' })).toBeVisible();
  });

  test('Escape schließt die Overlay-Leiste und gibt den Fokus an den Hamburger-Button zurück', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/kalender');

    const toggle = page.getByRole('button', { name: 'Navigation öffnen' });
    await toggle.click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Navigation' })).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test('Klick auf die Abdunkelung schließt die Overlay-Leiste', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/kalender');

    await page.getByRole('button', { name: 'Navigation öffnen' }).click();
    const overlay = page.getByRole('dialog', { name: 'Navigation' });
    await expect(overlay).toBeVisible();

    // Klick in die obere linke Ecke, außerhalb der (von links einfahrenden) Leiste.
    await page.mouse.click(690, 10);

    await expect(overlay).toHaveCount(0);
  });

  test('Auswahl eines Navigationseintrags schließt die Overlay-Leiste und navigiert', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/kalender');

    await page.getByRole('button', { name: 'Navigation öffnen' }).click();
    const overlay = page.getByRole('dialog', { name: 'Navigation' });
    await overlay.getByRole('link', { name: 'Einstellungen' }).click();

    await expect(overlay).toHaveCount(0);
    await expect(page).toHaveURL(/\/einstellungen$/);
  });

  test('Solange die Overlay-Leiste offen ist, verlässt Tab die Leiste nicht in den Inhalt', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/kalender');

    await page.getByRole('button', { name: 'Navigation öffnen' }).click();
    const overlay = page.getByRole('dialog', { name: 'Navigation' });
    const navLinks = overlay.getByRole('link');
    const linkCount = await navLinks.count();

    await expect(navLinks.first()).toBeFocused();

    // Tab durch alle Links und noch einmal darüber hinaus: der Fokus muss
    // innerhalb der Leiste bleiben statt in den Hauptinhalt zu wandern.
    for (let i = 0; i < linkCount + 2; i++) {
      await page.keyboard.press('Tab');
      const isInsideOverlay = await page.evaluate(() => {
        const active = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return !!dialog && !!active && dialog.contains(active);
      });
      expect(isInsideOverlay).toBe(true);
    }
  });

  for (const path of ['/aufgaben', '/kalender']) {
    test(`bei 375px Breite ist der Inhalt von ${path} ohne horizontales Scrollen bedienbar`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);

      await expect(page.getByRole('button', { name: 'Navigation öffnen' })).toBeVisible();
    });
  }
});
