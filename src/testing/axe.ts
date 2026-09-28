import axe, { RunOptions } from 'axe-core';

// jsdom führt kein echtes Layout/Rendering aus, daher liefert axe-core dort
// keine verlässlichen Farbkontrast-Ergebnisse. Kontrast wird stattdessen
// separat über die Design-Tokens sichergestellt (siehe src/styles/tokens.md).
// Geprüft wird hier gegen die WCAG-2-A/AA-Erfolgskriterien, nicht gegen
// zusätzliche "Best Practice"-Regeln (z. B. Landmark-Regionen), da einzelne
// Seitenkomponenten isoliert von der App-Shell gerendert werden.
const AXE_OPTIONS: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: {
    'color-contrast': { enabled: false },
  },
};

// axe-core hält seinen "läuft gerade"-Status in Modul-Scope, nicht pro Aufruf.
// Da mehrere *.a11y.spec.ts-Dateien im selben Test-Worker nebenläufig laufen
// können, würden parallele axe.run()-Aufrufe sonst nicht-deterministisch mit
// "Axe is already running" fehlschlagen. Diese Queue serialisiert sie.
let axeQueue: Promise<unknown> = Promise.resolve();

function runAxeSerialized(element: HTMLElement, options: RunOptions): Promise<axe.AxeResults> {
  const result = axeQueue.then(() => axe.run(element, options));
  axeQueue = result.catch(() => undefined);
  return result;
}

/**
 * Rendert `element` durch axe-core und wirft mit einer lesbaren Fehlermeldung,
 * falls WCAG-2-A/AA-Verstöße gefunden werden.
 */
export async function expectNoA11yViolations(element: HTMLElement): Promise<void> {
  const results = await runAxeSerialized(element, AXE_OPTIONS);

  if (results.violations.length > 0) {
    const details = results.violations
      .map((violation) => {
        const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
        return `- [${violation.impact}] ${violation.id}: ${violation.help} (${targets})`;
      })
      .join('\n');
    throw new Error(`A11y-Verstöße gefunden:\n${details}`);
  }
}
