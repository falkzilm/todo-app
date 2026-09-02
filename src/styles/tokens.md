# Design-Tokens

`src/styles/_tokens.scss` ist die einzige Quelle für Farbe, Typografie,
Spacing, Radien, Schatten und Motion-Dauer. Die Tokens werden als
CSS Custom Properties auf `:root` definiert und über `src/styles.scss`
global eingebunden (`@use 'styles/tokens';`). Komponenten referenzieren
ausschließlich `var(--token-name)` statt Werte hart zu kodieren.

## Farbe

### Akzentfarbe

Es gibt genau eine Akzentfarbe für interaktive/hervorgehobene Elemente
(aktive Navigation, primäre Buttons, Fokus-Zustände):

| Token                     | Wert      | Verwendung                 |
| ------------------------- | --------- | -------------------------- |
| `--color-accent`          | `#1a56db` | Akzentfarbe                |
| `--color-accent-contrast` | `#ffffff` | Textfarbe auf Akzentfläche |

### Neutrale Graustufen

10-stufige Skala von hell (`50`) nach dunkel (`900`), analog zur
Spacing-/Typo-Skala:

`--color-gray-50` … `--color-gray-900`
(`#fafafa`, `#f4f4f5`, `#e4e4e7`, `#d4d4d8`, `#a1a1aa`, `#71717a`,
`#52525b`, `#3f3f46`, `#27272a`, `#18181b`)

Semantische Aliase darauf:

| Token                | Alias von          | Verwendung                      |
| -------------------- | ------------------ | ------------------------------- |
| `--color-bg`         | `--color-gray-50`  | Seitenhintergrund               |
| `--color-surface`    | `#ffffff`          | Flächen (Cards, Inputs, Header) |
| `--color-text`       | `--color-gray-900` | Standard-Textfarbe              |
| `--color-text-muted` | `--color-gray-600` | Sekundärer/gedämpfter Text      |
| `--color-border`     | `--color-gray-300` | Trennlinien, Rahmen             |

### Zustandsfarben

Genau drei Zustandsfarben (Erfolg, Warnung, Fehler), jeweils als
AA-taugliche Textfarbe plus dezenter Flächenfarbe für Badges/Banner:

| Zustand | Text-Token        | Wert      | Flächen-Token             | Wert      |
| ------- | ----------------- | --------- | ------------------------- | --------- |
| Erfolg  | `--color-success` | `#15803d` | `--color-success-surface` | `#f0fdf4` |
| Warnung | `--color-warning` | `#b45309` | `--color-warning-surface` | `#fffbeb` |
| Fehler  | `--color-error`   | `#b91c1c` | `--color-error-surface`   | `#fef2f2` |

## Kontrastwerte (WCAG AA, ≥ 4.5:1 für Fließtext)

Kontrastverhältnisse nach der WCAG-2-Relativluminanz-Formel, jeweils gegen
`--color-surface` (`#ffffff`) und `--color-bg` (`#fafafa`), den beiden im
Projekt verwendeten Hintergrundflächen:

| Vordergrund-Token    | Wert      | Kontrast auf `#ffffff` | Kontrast auf `#fafafa` | AA (4.5:1) |
| -------------------- | --------- | ---------------------: | ---------------------: | :--------: |
| `--color-text`       | `#18181b` |              17.76 : 1 |              17.01 : 1 |     ✅     |
| `--color-text-muted` | `#52525b` |               7.74 : 1 |               7.42 : 1 |     ✅     |
| `--color-gray-500`   | `#71717a` |               4.83 : 1 |               4.63 : 1 | ✅ (knapp) |
| `--color-accent`     | `#1a56db` |               6.19 : 1 |               5.93 : 1 |     ✅     |
| `--color-success`    | `#15803d` |               5.02 : 1 |               4.81 : 1 |     ✅     |
| `--color-warning`    | `#b45309` |               5.02 : 1 |               4.81 : 1 |     ✅     |
| `--color-error`      | `#b91c1c` |               6.47 : 1 |               6.20 : 1 |     ✅     |

`--color-accent-contrast` (`#ffffff` Text auf `--color-accent`-Fläche)
erreicht denselben Kontrast wie `--color-accent` selbst (6.19 : 1 /
5.93 : 1), da das Kontrastverhältnis symmetrisch ist — auch das erfüllt
WCAG AA.

`--color-gray-500` liegt nur knapp über der AA-Schwelle und ist daher für
UI-Elemente/Icons vorgesehen, nicht als Minimum für Fließtext — dafür
`--color-text-muted` (`--color-gray-600`) verwenden.

## Dunkles Farbschema

Gesteuert über die Systemeinstellung (`prefers-color-scheme: dark`), nicht
über einen manuellen Umschalter. Ein `@media (prefers-color-scheme: dark)`
-Block in `_tokens.scss` überschreibt ausschließlich die Farb-Tokens auf
`:root`; Spacing, Typografie, Radien, Schatten und Motion bleiben
unverändert, damit kein Layout-Sprung entsteht. Komponenten referenzieren
weiterhin nur `var(--token-name)` und brauchen keine eigenen Farbwerte.

Die neutrale Graustufen-Skala wird invertiert (`--color-gray-50` ↔
`--color-gray-900` usw.), sodass die semantischen Aliase (`--color-bg`,
`--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`)
unverändert auf dieselben Gray-Tokens zeigen können. Akzent- und
Zustandsfarben werden auf hellere, für dunkle Flächen taugliche Varianten
umgestellt; `--color-accent-contrast` zeigt im Dunkelmodus auf
`--color-gray-50` (dunkler Text auf der helleren Akzentfläche) statt auf
Weiß.

| Token                     | Hell      | Dunkel    |
| ------------------------- | --------- | --------- |
| `--color-bg`              | `#fafafa` | `#18181b` |
| `--color-surface`         | `#ffffff` | `#27272a` |
| `--color-text`            | `#18181b` | `#fafafa` |
| `--color-text-muted`      | `#52525b` | `#d4d4d8` |
| `--color-border`          | `#d4d4d8` | `#52525b` |
| `--color-accent`          | `#1a56db` | `#6a91e8` |
| `--color-accent-contrast` | `#ffffff` | `#18181b` |
| `--color-success`         | `#15803d` | `#4ade80` |
| `--color-success-surface` | `#f0fdf4` | `#10281a` |
| `--color-warning`         | `#b45309` | `#fbbf24` |
| `--color-warning-surface` | `#fffbeb` | `#2a2107` |
| `--color-error`           | `#b91c1c` | `#f87171` |
| `--color-error-surface`   | `#fef2f2` | `#2e1414` |

Kontrastverhältnisse im Dunkelmodus (WCAG AA, ≥ 4.5:1 für Fließtext),
jeweils gegen `--color-bg` (`#18181b`) und `--color-surface` (`#27272a`):

| Vordergrund-Token    | Kontrast auf `#18181b` | Kontrast auf `#27272a` | AA (4.5:1) |
| -------------------- | ---------------------: | ---------------------: | :--------: |
| `--color-text`       |              16.97 : 1 |              14.27 : 1 |     ✅     |
| `--color-text-muted` |              11.99 : 1 |              10.08 : 1 |     ✅     |
| `--color-accent`     |               5.76 : 1 |               4.84 : 1 |     ✅     |
| `--color-success`    |              10.17 : 1 |               8.55 : 1 |     ✅     |
| `--color-warning`    |              10.61 : 1 |               8.92 : 1 |     ✅     |
| `--color-error`      |               6.40 : 1 |               5.38 : 1 |     ✅     |

`--color-accent-contrast` (`--color-gray-50`-Text auf `--color-accent`-Fläche)
erreicht denselben Kontrast wie `--color-accent` selbst (5.76 : 1), da
beide Werte identisch sind und das Kontrastverhältnis symmetrisch ist.

## Typografie

| Token                    | Wert                                               |
| ------------------------ | -------------------------------------------------- |
| `--font-family-base`     | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--font-size-xs`         | `0.75rem` (12px)                                   |
| `--font-size-sm`         | `0.875rem` (14px)                                  |
| `--font-size-base`       | `1rem` (16px)                                      |
| `--font-size-lg`         | `1.125rem` (18px)                                  |
| `--font-size-xl`         | `1.25rem` (20px)                                   |
| `--font-size-2xl`        | `1.5rem` (24px)                                    |
| `--font-size-3xl`        | `1.875rem` (30px)                                  |
| `--font-weight-normal`   | `400`                                              |
| `--font-weight-medium`   | `500`                                              |
| `--font-weight-semibold` | `600`                                              |
| `--font-weight-bold`     | `700`                                              |
| `--line-height-tight`    | `1.25`                                             |
| `--line-height-normal`   | `1.5`                                              |
| `--line-height-relaxed`  | `1.75`                                             |

## Spacing-Skala

4px-Basis (`1 space unit = 4px`), als `rem` definiert (bei 16px
Root-Font-Size):

| Token        | Wert      |   Px |
| ------------ | --------- | ---: |
| `--space-1`  | `0.25rem` |  4px |
| `--space-2`  | `0.5rem`  |  8px |
| `--space-3`  | `0.75rem` | 12px |
| `--space-4`  | `1rem`    | 16px |
| `--space-5`  | `1.25rem` | 20px |
| `--space-6`  | `1.5rem`  | 24px |
| `--space-8`  | `2rem`    | 32px |
| `--space-10` | `2.5rem`  | 40px |
| `--space-12` | `3rem`    | 48px |
| `--space-16` | `4rem`    | 64px |

Die Namen entsprechen `space-N` = `N × 4px`; Zwischenwerte (z. B. 28px)
sind bewusst ausgelassen, um die Skala klein und konsistent zu halten.

## Radien

| Token           | Wert                  |
| --------------- | --------------------- |
| `--radius-sm`   | `0.25rem` (4px)       |
| `--radius-md`   | `0.5rem` (8px)        |
| `--radius-lg`   | `0.75rem` (12px)      |
| `--radius-full` | `9999px` (Pill/Kreis) |

## Schatten

| Token         | Wert                          |
| ------------- | ----------------------------- |
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 5%)`   |
| `--shadow-md` | `0 2px 6px rgb(0 0 0 / 8%)`   |
| `--shadow-lg` | `0 8px 24px rgb(0 0 0 / 12%)` |

## Motion

| Token                      | Wert                           |
| -------------------------- | ------------------------------ |
| `--motion-duration-fast`   | `120ms`                        |
| `--motion-duration-base`   | `200ms`                        |
| `--motion-duration-slow`   | `320ms`                        |
| `--motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |

## Layout

| Token                        | Wert            | Verwendung                                  |
| ---------------------------- | --------------- | ------------------------------------------- |
| `--layout-content-max-width` | `48rem` (768px) | Maximalbreite der zentrierten Inhaltsspalte |

Header- und Hauptbereich der App-Shell teilen sich diese Maximalbreite
und werden per `margin-inline: auto` zentriert; auf schmalen Viewports
(z. B. 360px) füllt die Inhaltsspalte die volle Breite abzüglich des
seitlichen `--space-6`-Abstands.
