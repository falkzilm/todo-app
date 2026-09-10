# Design-Tokens

`src/styles/_tokens.scss` ist die einzige Quelle für Farbe, Typografie,
Spacing, Radien, Schatten und Motion-Dauer. Die Tokens werden als
CSS Custom Properties auf `:root` definiert und über `src/styles.scss`
global eingebunden (`@use 'styles/tokens';`). Komponenten referenzieren
ausschließlich `var(--token-name)` statt Werte hart zu kodieren.

Das Token-Set ist auf die FocusDay-Referenzgestaltung (Screenshot
"Dashboard/Kalender") umgestellt: Grün-Palette, vier Kategoriefarben, drei
Prioritätsfarbpaare, weichere Neutrale, rundere Radien und flachere
Schatten. Werte wurden per Pipette am Referenzbild abgelesen und
anschließend so nachjustiert, dass die Kontrast-Zielwerte (siehe unten)
eingehalten werden — sie sind daher als "sehr nah am Bild", nicht
Pixel-für-Pixel identisch zu verstehen.

## Farbe

### Primär-/Akzentgrün

Zwei Grüntöne statt einer einzelnen Akzentfarbe: Primär für gefüllte
Buttons/Chips, Akzent für grafische Elemente (Logo, Progress-Ring, aktive
Checkbox) mit einer dazugehörigen hellen Tint-Fläche für aktive
Navigations-/Progress-Karten.

| Token                      | Wert      | Verwendung                                  |
| --------------------------- | --------- | -------------------------------------------- |
| `--color-primary`           | `#0b7a5a` | Primärfarbe (gefüllter "Heute"-Chip, Buttons) |
| `--color-primary-contrast`  | `#ffffff` | Textfarbe auf Primärfläche                    |
| `--color-accent`             | `#10a37f` | Akzentfarbe (Logo-Kreis, Progress-Ring, aktive Checkbox) |
| `--color-accent-tint`       | `#e8f5ef` | Fläche für aktives Nav-Item/Progress-Karte    |
| `--color-accent-contrast`   | `#ffffff` | Icon-/Textfarbe auf Akzentfläche              |

### Kategoriefarben

Vier Farbtöne zur freien Zuordnung zu Aufgaben-/Termin-Kategorien (z. B.
"Arbeit", "Privat"), jeweils als Punkt-/Balken-Farbe plus dezenter
Tint-Fläche:

| Kategorie (Beispiel) | Punkt-/Balken-Token         | Wert      | Tint-Token                        | Wert      |
| --------------------- | ---------------------------- | --------- | ----------------------------------- | --------- |
| Arbeit                | `--color-category-violet`    | `#8b5cf6` | `--color-category-violet-tint`      | `#f3eefe` |
| Privat                | `--color-category-green`     | `#22c55e` | `--color-category-green-tint`       | `#e9fbf0` |
| —                      | `--color-category-orange`    | `#f59e0b` | `--color-category-orange-tint`      | `#fef3da` |
| —                      | `--color-category-blue`      | `#3b82f6` | `--color-category-blue-tint`        | `#eaf1fe` |

Die Kategoriefarben sind reine UI-Indikatoren (kleine Punkte, Termin-Balken,
Tint-Flächen) und werden nie als alleiniger Bedeutungsträger eingesetzt —
der Kategoriename steht immer als Text daneben (WCAG SC 1.4.1, Use of
Color). Deshalb gilt für sie nicht die Fließtext-/Badge-Kontrastpflicht;
Messwerte sind unten trotzdem dokumentiert.

### Prioritätsfarben

Drei Prioritätsstufen, jeweils als Badge-Text-Ton plus eigene helle
Flächenfarbe (Badge-Hintergrund):

| Priorität | Text-Token                    | Wert      | Flächen-Token                     | Wert      |
| --------- | ------------------------------ | --------- | ------------------------------------ | --------- |
| Hoch      | `--color-priority-high`        | `#e0364b` | `--color-priority-high-surface`      | `#ffe9e9` |
| Mittel    | `--color-priority-medium`      | `#c2751a` | `--color-priority-medium-surface`    | `#fff3da` |
| Niedrig   | `--color-priority-low`         | `#3b72e0` | `--color-priority-low-surface`       | `#e7f0ff` |

### Neutrale Graustufen

10-stufige Skala von hell (`50`) nach dunkel (`900`), leicht ins Teal
gezogen (statt neutralem Grau), passend zur Textfarbe `#16343b`:

`--color-gray-50` … `--color-gray-900`
(`#ffffff`, `#f7f9fa`, `#eef1f2`, `#dce2e4`, `#b9c2c6`, `#7a8a93`,
`#64747c`, `#3e4c53`, `#253138`, `#16343b`)

Semantische Aliase darauf:

| Token                 | Alias von           | Verwendung                      |
| ---------------------- | -------------------- | -------------------------------- |
| `--color-bg`           | `--color-gray-50`    | Seitenhintergrund                |
| `--color-surface`      | `#ffffff`            | Flächen (Cards, Inputs, Header)  |
| `--color-text`         | `--color-gray-900`   | Standard-Textfarbe               |
| `--color-text-muted`   | `--color-gray-600`   | Sekundärer/gedämpfter Text       |
| `--color-border`       | `--color-gray-200`   | Trennlinien, (dezente) Kartenränder |

`--color-gray-500` (`#7a8a93`, der am Bild gepickte Sekundärtext-Ton) ist
für UI-Elemente/Icons vorgesehen, nicht für Fließtext (3.57 : 1, siehe
Tabelle) — für Fließtext gilt `--color-text-muted`
(`--color-gray-600`, nachjustiert auf `#64747c` für AA-Kontrast).

### Zustandsfarben

Unverändert gegenüber dem vorherigen Token-Set (Erfolg, Warnung, Fehler),
jeweils als AA-taugliche Textfarbe plus dezenter Flächenfarbe:

| Zustand | Text-Token         | Wert      | Flächen-Token              | Wert      |
| ------- | ------------------- | --------- | ---------------------------- | --------- |
| Erfolg  | `--color-success`   | `#15803d` | `--color-success-surface`    | `#f0fdf4` |
| Warnung | `--color-warning`   | `#b45309` | `--color-warning-surface`    | `#fffbeb` |
| Fehler  | `--color-error`     | `#b91c1c` | `--color-error-surface`      | `#fef2f2` |

## Kontrastwerte hell (WCAG 2, ≥ 4.5 : 1 Fließtext, ≥ 3 : 1 große Texte/Badges)

`--color-bg` und `--color-surface` sind im hellen Schema beide `#ffffff`,
daher genügt eine Hintergrundspalte.

| Vordergrund-Token                | Wert      | Kontrast auf `#ffffff` | Anforderung          | Ergebnis |
| ---------------------------------- | --------- | ----------------------: | ---------------------- | :------: |
| `--color-text`                     | `#16343b` |                13.22 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-text-muted`               | `#64747c` |                 4.85 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-gray-500` (UI/Icon)       | `#7a8a93` |                 3.57 : 1 | UI-Komponente ≥ 3 : 1  |    ✅    |
| `--color-primary`                  | `#0b7a5a` |                 5.32 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-accent` (Icon-Kontext)    | `#10a37f` |                 3.20 : 1 | UI-Komponente ≥ 3 : 1  |    ✅    |
| `--color-success`                  | `#15803d` |                 5.02 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-warning`                  | `#b45309` |                 5.02 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-error`                    | `#b91c1c` |                 6.47 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-category-violet`          | `#8b5cf6` |                 4.23 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-green`           | `#22c55e` |                 2.28 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-orange`          | `#f59e0b` |                 2.15 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-blue`            | `#3b82f6` |                 3.68 : 1 | dekorativ (kein Text)  |   n/a    |

`--color-primary-contrast` (`#ffffff` auf `--color-primary`) und
`--color-accent-contrast` (`#ffffff` auf `--color-accent`) erreichen
denselben Kontrast wie die jeweilige Fläche selbst (5.32 : 1 / 3.20 : 1),
da das Kontrastverhältnis symmetrisch ist. `--color-accent-contrast` wird
ausschließlich für grafische/Icon-Inhalte (Haken, Ring) verwendet, nicht
für Fließtext — daher genügt hier die 3 : 1-Schwelle.

Text auf `--color-accent-tint` (`#e8f5ef`), z. B. Label des aktiven
Nav-Items in `--color-primary`: **4.75 : 1** ✅ (Fließtext-Anforderung
erfüllt).

Badge-Kontraste (Text-Token auf eigener Flächenfarbe), Anforderung
≥ 3 : 1 für Badges/große Texte:

| Priorität | Text auf Fläche             | Kontrast |
| --------- | ----------------------------- | -------: |
| Hoch      | `#e0364b` auf `#ffe9e9`       | 3.77 : 1 |
| Mittel    | `#c2751a` auf `#fff3da`       | 3.26 : 1 |
| Niedrig   | `#3b72e0` auf `#e7f0ff`       | 3.92 : 1 |

Kategoriefarbe auf eigener Tint-Fläche (zur Referenz, ebenfalls
dekorativ/kein Fließtext): violett 3.72 : 1, grün 2.12 : 1, orange
1.95 : 1, blau 3.24 : 1.

## Dunkles Farbschema

Gesteuert über die Systemeinstellung (`prefers-color-scheme: dark`), nicht
über einen manuellen Umschalter. Ein `@media (prefers-color-scheme: dark)`
-Block in `_tokens.scss` überschreibt ausschließlich die Farb-Tokens auf
`:root`; Spacing, Typografie, Radien, Schatten und Motion bleiben
unverändert, damit kein Layout-Sprung entsteht.

**Offener Punkt:** Das FocusDay-Referenzbild zeigt nur ein helles Schema.
Die folgenden Dunkel-Werte sind eine Ableitung aus den hellen Tokens
(gleiche Hue, für dunkle Flächen aufgehellt) und noch kein von
Design/Product abgenommenes Dunkel-Design — vor breiterem Rollout mit
Design gegenzuprüfen.

| Token                              | Hell      | Dunkel    |
| ------------------------------------ | --------- | --------- |
| `--color-bg`                         | `#ffffff` | `#10181c` |
| `--color-surface`                    | `#ffffff` | `#17222a` |
| `--color-text`                       | `#16343b` | `#f5f8f9` |
| `--color-text-muted`                 | `#64747c` | `#9dacb3` |
| `--color-border`                     | `#eef1f2` | `#24343d` |
| `--color-primary`                    | `#0b7a5a` | `#22c55e` |
| `--color-primary-contrast`           | `#ffffff` | `#10181c` |
| `--color-accent`                     | `#10a37f` | `#34d399` |
| `--color-accent-tint`                | `#e8f5ef` | `#123528` |
| `--color-accent-contrast`            | `#ffffff` | `#10181c` |
| `--color-category-violet`            | `#8b5cf6` | `#a78bfa` |
| `--color-category-violet-tint`       | `#f3eefe` | `#241c3d` |
| `--color-category-green`             | `#22c55e` | `#4ade80` |
| `--color-category-green-tint`        | `#e9fbf0` | `#14291b` |
| `--color-category-orange`            | `#f59e0b` | `#fbbf24` |
| `--color-category-orange-tint`       | `#fef3da` | `#362a12` |
| `--color-category-blue`              | `#3b82f6` | `#60a5fa` |
| `--color-category-blue-tint`         | `#eaf1fe` | `#16253f` |
| `--color-priority-high`              | `#e0364b` | `#ff8a97` |
| `--color-priority-high-surface`      | `#ffe9e9` | `#3a1620` |
| `--color-priority-medium`            | `#c2751a` | `#ffc069` |
| `--color-priority-medium-surface`    | `#fff3da` | `#3a2a10` |
| `--color-priority-low`               | `#3b72e0` | `#8fb4ff` |
| `--color-priority-low-surface`       | `#e7f0ff` | `#152540` |
| `--color-success`                    | `#15803d` | `#4ade80` |
| `--color-success-surface`            | `#f0fdf4` | `#10281a` |
| `--color-warning`                    | `#b45309` | `#fbbf24` |
| `--color-warning-surface`            | `#fffbeb` | `#2a2107` |
| `--color-error`                      | `#b91c1c` | `#f87171` |
| `--color-error-surface`              | `#fef2f2` | `#2e1414` |

### Kontrastwerte dunkel (WCAG 2, ≥ 4.5 : 1 Fließtext, ≥ 3 : 1 große Texte/Badges)

Gegen `--color-bg` (`#10181c`) und `--color-surface` (`#17222a`):

| Vordergrund-Token           | Wert      | Kontrast auf `#10181c` | Kontrast auf `#17222a` | Anforderung         | Ergebnis |
| ------------------------------ | --------- | ------------------------: | ------------------------: | ---------------------- | :------: |
| `--color-text`                 | `#f5f8f9` |                  16.83 : 1 |                  15.15 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-text-muted`           | `#9dacb3` |                   7.68 : 1 |                   6.92 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-primary`              | `#22c55e` |                   7.88 : 1 |                   7.10 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-accent`               | `#34d399` |                   9.34 : 1 |                   8.41 : 1 | UI-Komponente ≥ 3 : 1  |    ✅    |
| `--color-success`              | `#4ade80` |                  10.31 : 1 |                   9.28 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-warning`              | `#fbbf24` |                  10.76 : 1 |                   9.69 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-error`                | `#f87171` |                   6.49 : 1 |                   5.85 : 1 | Fließtext ≥ 4.5 : 1     |    ✅    |
| `--color-category-violet`      | `#a78bfa` |                   6.60 : 1 |                   5.94 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-green`       | `#4ade80` |                  10.31 : 1 |                   9.28 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-orange`      | `#fbbf24` |                  10.76 : 1 |                   9.69 : 1 | dekorativ (kein Text)  |   n/a    |
| `--color-category-blue`        | `#60a5fa` |                   7.06 : 1 |                   6.36 : 1 | dekorativ (kein Text)  |   n/a    |

`--color-primary-contrast`/`--color-accent-contrast` (`#10181c` auf
`--color-primary`/`--color-accent`) erreichen denselben Kontrast wie die
jeweilige Fläche selbst (7.88 : 1 / 9.34 : 1), da symmetrisch.

Text auf `--color-accent-tint` dunkel (`#123528`) in `--color-accent`:
**6.98 : 1** ✅.

Badge-Kontraste dunkel (Text-Token auf eigener Flächenfarbe):

| Priorität | Text auf Fläche              | Kontrast |
| --------- | ------------------------------ | -------: |
| Hoch      | `#ff8a97` auf `#3a1620`        | 7.10 : 1 |
| Mittel    | `#ffc069` auf `#3a2a10`        | 8.56 : 1 |
| Niedrig   | `#8fb4ff` auf `#152540`        | 7.40 : 1 |

Kategoriefarbe auf eigener Tint-Fläche dunkel: violett 5.90 : 1, grün
8.84 : 1, orange 8.40 : 1, blau 6.03 : 1.

## Typografie

| Token                     | Wert                                               |
| --------------------------- | --------------------------------------------------- |
| `--font-family-base`       | `system-ui, -apple-system, 'Segoe UI', sans-serif` (Systemschriftarten, keine externe Webfont-Einbindung — sonst bricht die CSP) |
| `--font-size-xs`           | `0.75rem` (12px)                                    |
| `--font-size-sm`           | `0.875rem` (14px)                                   |
| `--font-size-base`         | `1rem` (16px)                                       |
| `--font-size-lg`           | `1.125rem` (18px)                                   |
| `--font-size-xl`           | `1.25rem` (20px)                                    |
| `--font-size-2xl`          | `1.5rem` (24px)                                     |
| `--font-size-3xl`          | `1.875rem` (30px)                                   |
| `--font-size-display`      | `1.875rem` (30px) — Begrüßungstext ("Guten Morgen, …"), zusammen mit `--font-weight-semibold` |
| `--font-weight-normal`     | `400`                                                |
| `--font-weight-medium`     | `500`                                                |
| `--font-weight-semibold`   | `600`                                                |
| `--font-weight-bold`       | `700`                                                |
| `--line-height-tight`      | `1.25`                                               |
| `--line-height-normal`     | `1.5`                                                |
| `--line-height-relaxed`    | `1.75`                                               |

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

Deutlich runder als im vorherigen Token-Set, passend zu den weichen Karten
im Referenzdesign:

| Token           | Wert                  | Verwendung             |
| --------------- | --------------------- | ----------------------- |
| `--radius-sm`   | `0.375rem` (6px)       | Checkbox                |
| `--radius-md`   | `0.625rem` (10px)      | Buttons, Inputs         |
| `--radius-lg`   | `0.875rem` (14px)      | Karten                  |
| `--radius-full` | `9999px` (Pill/Kreis)  | Chips, Pills, Avatare   |

## Schatten

Sehr weich und flach (niedrige Deckkraft, großer Blur, kaum Versatz) statt
hartem Rahmen — Karten wirken dadurch nahezu randlos:

| Token         | Wert                            |
| ------------- | -------------------------------- |
| `--shadow-sm` | `0 1px 2px rgb(16 24 32 / 4%)`   |
| `--shadow-md` | `0 4px 12px rgb(16 24 32 / 6%)`  |
| `--shadow-lg` | `0 12px 32px rgb(16 24 32 / 8%)` |

## Motion

| Token                      | Wert                            |
| --------------------------- | --------------------------------- |
| `--motion-duration-fast`   | `120ms`                          |
| `--motion-duration-base`   | `200ms`                          |
| `--motion-duration-slow`   | `320ms`                          |
| `--motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)`   |

## Layout

| Token                           | Wert              | Verwendung                                    |
| ---------------------------------- | ----------------- | ------------------------------------------------ |
| `--layout-sidebar-width`           | `15.625rem` (250px) | Breite der Sidebar-Navigation                    |
| `--layout-content-padding`         | `2rem` (32px)      | Innenabstand des Hauptinhaltsbereichs             |
| `--layout-content-max-width`       | `90rem` (1440px)   | Maximalbreite der Inhaltsspalte neben der Sidebar |

`--layout-content-max-width` ersetzt den bisherigen Wert `48rem` (768px):
Das Referenzdesign zeigt eine volle Breite mit Sidebar statt einer schmalen
zentrierten Spalte, daher eine deutlich breitere Inhaltsspalte. Der
konkrete Wert (1440px) ist am Bild orientiert, aber nicht pixelgenau
abgelesen — er markiert die praktische Obergrenze, darunter füllt der
Inhalt die verfügbare Breite neben der Sidebar.
