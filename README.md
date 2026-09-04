# ToDo App

Eine lokale, browserbasierte ToDo-Anwendung: Aufgaben mit Titel, Notiz und
Fälligkeitsdatum anlegen, erledigen und im Kalender einsehen. Gebaut als
Angular-Workspace mit Standalone-Komponenten, Signals als alleinigem
State-Primitiv, TypeScript `strict` (inkl. `strictTemplates`) und SCSS.

Das Projekt ist bewusst klein und clientseitig gehalten (siehe
[Bekannte Grenzen und offene Fragen](#bekannte-grenzen-und-offene-fragen)):
Alle Daten liegen ausschließlich im Browser, es gibt kein Backend.

## Inhalt

- [Screenshots](#screenshots)
- [Setup](#setup)
- [npm-Skripte](#npm-skripte)
- [Architektur und Datenfluss](#architektur-und-datenfluss)
- [Design-Prinzipien und Design-Tokens](#design-prinzipien-und-design-tokens)
- [Barrierefreiheit](#barrierefreiheit)
- [Sicherheit](#sicherheit)
- [Performance und Bundle-Budget](#performance-und-bundle-budget)
- [Deployment (statisches Hosting)](#deployment-statisches-hosting)
- [Bekannte Grenzen und offene Fragen](#bekannte-grenzen-und-offene-fragen)

## Screenshots

Es sind keine Bilddateien im Repository hinterlegt (um es klein zu halten);
die App lässt sich stattdessen in unter einer Minute lokal ansehen
(`npm ci && npm start`, siehe [Setup](#setup)). Die zwei über die Navigation
erreichbaren Ansichten:

- **Heute** (`/heute`, Startseite): Fortschrittsanzeige für den Tag, gefolgt
  von den Gruppen "Heute", "Überfällig" und einem einklappbaren
  "Erledigt"-Bereich.
- **Kalender** (`/kalender`): Monatsraster mit einem Indikator pro Tag
  (offene Aufgaben, komplett erledigt) und einer Tagesliste für den
  ausgewählten Tag.

## Setup

Voraussetzung ist eine Node.js-Version gemäß `engines` in `package.json`
(`^20.19.0 || ^22.12.0 || >=24.0.0`).

```bash
npm ci
npm start
```

Die App ist danach unter `http://localhost:4200` erreichbar (Angular-CLI
Dev-Server mit Live-Reload).

> **Zur Angular-Versionswahl:** Die zum Zeitpunkt der Erstellung per `npm view @angular/core
versions` aktuelle stabile Version ist `22.1.4` (CLI/Build-Tooling `22.1.6`). Diese Version
> lässt sich in der hier verfügbaren Ausführungsumgebung jedoch nicht bauen: Die Angular-CLI
> bricht mit Node.js `v22.22.1` hart ab, da Angular 22.x mindestens Node `^22.22.3 || ^24.15.0
|| >=26.0.0` voraussetzt und ein Upgrade der Node-Installation in dieser Umgebung nicht
> möglich war. Der eigentliche Compiler/Build (`ngc`, `@angular/build`) läuft nachweislich
> fehlerfrei auch unter `v22.22.1` – es ist ausschließlich der hartkodierte Versions-Gate in
> `@angular/cli` (`bin/ng.js`), der hier ohne Patch an `node_modules` (nicht versioniert) nicht
> umgangen werden kann. Damit `npm ci && npm start` / `npm run build` in dieser Umgebung
> tatsächlich fehlerfrei laufen, ist das Workspace auf die aktuellste `21.x`-Version
> (`21.2.22`) ausgerichtet – das vom Ticket als Minimum erlaubte Angular `21`. Sobald die
> Ausführungsumgebung auf Node `≥22.22.3` aktualisiert ist, ist ein Upgrade auf Angular `22.1.4`
> ein reines Versions-Bump in `package.json` ohne Codeänderungen.
>
> Die Abhängigkeiten sind mit `npm install` gegen die npm-Registry aufgelöst;
> `package-lock.json` ist entsprechend committet.

## npm-Skripte

| Skript                  | Befehl                                                    | Zweck                                                                                                                        |
| ----------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm start`             | `ng serve`                                                | Dev-Server mit Live-Reload unter `http://localhost:4200`.                                                                    |
| `npm run build`         | `ng build`                                                | Produktions-Build nach `dist/todo-app` (siehe [Deployment](#deployment-statisches-hosting)).                                 |
| `npm run watch`         | `ng build --watch --configuration development`            | Fortlaufender Dev-Build ohne Dev-Server, z. B. um das Bundle bei Änderungen zu beobachten.                                   |
| `npm test`              | `ng test`                                                 | Unit-/Komponententests mit Vitest, inkl. Coverage (siehe [Tests](#tests)).                                                   |
| `npm run a11y`          | `ng test --include="src/**/*.a11y.spec.ts" --watch=false` | Nur die Barrierefreiheits-Spezifikationen (axe-core), als eigenständiges Gate (siehe [Barrierefreiheit](#barrierefreiheit)). |
| `npm run lint`          | `ng lint`                                                 | ESLint (inkl. Angular- und Barrierefreiheits-/Sicherheitsregeln aus `eslint.config.js`).                                     |
| `npm run format`        | `prettier --write "src/**/*.{ts,html,scss}"`              | Formatiert `.ts`/`.html`/`.scss` unter `src/` gemäß `.prettierrc.json`.                                                      |
| `npm run deploy:static` | `bash scripts/deploy-static.sh`                           | Produktions-Build mit SPA-Fallback für statisches Hosting (siehe [Deployment](#deployment-statisches-hosting)).              |
| `npm run ng`            | `ng`                                                      | Direkter Zugriff auf die Angular-CLI, z. B. für `ng generate`.                                                               |

## Architektur und Datenfluss

Der Code unter `src/app` ist nach Feature-Slices organisiert:

- `core/` – anwendungsweite Services ohne UI: State (`TaskStoreService`),
  Persistenz (`TaskPersistenceService`, `storage.token.ts`,
  `StorageStatusService`), Datums-Utilities (`date/date-utils.ts`) und das
  Task-Domänenmodell (`models/task.model.ts`).
- `shared/ui/` – wiederverwendbare, feature-übergreifende UI-Bausteine ohne
  eigenen State (z. B. `ButtonComponent`, `CheckboxComponent`,
  `TaskItemComponent`, `MonthGridComponent`, `PageHeaderComponent`).
- `features/heute/` – Startseite unter `/heute`: Tagesfortschritt, heutige,
  überfällige und erledigte Aufgaben.
- `features/calendar/` – Kalenderansicht unter `/kalender`: Monatsraster
  plus Tagesliste.
- `features/tasks/` – eine weitere Aufgabenlisten-Ansicht
  (`TasksPageComponent`/`TASKS_ROUTES`); aktuell **nicht** in
  `app.routes.ts` eingebunden und über die Navigation nicht erreichbar. Beim
  Einstieg in den Code nicht mit der tatsächlichen Startseite (`/heute`)
  verwechseln.

Es gibt kein Backend und keine Proxy-Konfiguration; alle Daten liegen
ausschließlich im Client-State (Signals), gespiegelt in `localStorage`.

### Store und Selektoren

`TaskStoreService` (`core/services/task-store.service.ts`) ist die einzige
Quelle für Task-State. Der aktuelle Task-Array liegt in einem privaten
`signal<Task[]>`, öffentlich nur als `readonly` Signal (`tasks`) exponiert –
Mutationen laufen ausschließlich über die Methoden des Stores
(`add`, `update`, `toggleCompleted`, `remove`, `restore`, `reset`), nie über
direktes Setzen von außen.

Alle abgeleiteten Ansichten sind `computed`-Selektoren auf `tasks` (und, wo
relevant, dem intern verwalteten "heute"-Datum, das um Mitternacht
automatisch nachgeführt wird):

- `openTasks` / `completedTasks` – nach Erledigt-Status.
- `todayTasks` / `overdueTasks` – offene Aufgaben mit Fälligkeit heute bzw.
  in der Vergangenheit (überfällig sortiert nach Datum).
- `todayTotalCount` / `todayCompletedCount` / `todayCompletedTasks` – für
  die Fortschrittsanzeige und den "Erledigt"-Bereich der Heute-Seite.
- `taskSummaryByDate` – Map von Kalendertag auf `{ openCount, allCompleted }`
  für die Tages-Indikatoren im Kalenderraster.
- `tasksForDate(date)` – Aufgaben eines bestimmten Tages, für die Tagesliste
  im Kalender.

Komponenten lesen also nie den rohen `tasks()`-Wert und filtern selbst,
sondern binden sich an den passenden Selektor.

### Persistenz

Schreibender Datenfluss: Store-Mutation → `tasksSignal` ändert sich → ein
`effect()` im Store merkt sich die neuen Tasks und speichert sie erst nach
300 ms Inaktivität (`SAVE_DEBOUNCE_MS`) über `TaskPersistenceService.save()`
– so erzeugt eine Serie schneller Änderungen (z. B. Tippen in ein Feld) nur
einen Schreibvorgang. Beim Verlassen/Verstecken der Seite
(`pagehide`/`visibilitychange`) wird ein noch ausstehender Schreibvorgang
sofort ausgeführt, damit nichts verloren geht. `remove`/`restore` (Löschen
mit Undo) persistieren dagegen sofort und synchron, ohne Debounce.

`TaskPersistenceService` (`core/services/task-persistence.service.ts`)
kapselt das Format in `localStorage`:

- Persistierter Zustand ist versioniert (`{ version, tasks }`); `MIGRATIONS`
  hebt ältere/unversionierte Daten schrittweise auf die aktuelle
  Schema-Version an. Nicht migrierbare oder strukturell kaputte Daten führen
  zu einer leeren Liste statt zu einem Absturz.
- Jeder geladene Task wird gegen das Domänenmodell validiert
  (`isValidPersistedTask`) und auf die erlaubten Textlängen begrenzt
  (`clampTaskTextLengths`); ungültige Einträge werden verworfen und
  geloggt, statt manipulierte/korrupte Daten in die App zu lassen.
- Ist noch nichts gespeichert (erster Start), wird ein kleines
  Demo-Aufgabenset (`core/models/demo-tasks.ts`) erzeugt und sofort
  gespeichert, damit die App nicht leer wirkt.

Der eigentliche Storage-Zugriff läuft über den injizierbaren `STORAGE`-Token
(`core/services/storage.token.ts`), nicht direkt über `window.localStorage`:
Beim ersten Zugriff wird per Testschreibzugriff geprüft, ob `localStorage`
tatsächlich nutzbar ist (nicht nur vorhanden – privates Browsing lässt es in
manchen Browsern zwar existieren, aber jeden Zugriff werfen). Schlägt das
fehl, springt die App transparent auf einen In-Memory-`Storage` um. Dieser
Zustand sowie einzelne fehlgeschlagene Schreibvorgänge (z. B.
`QuotaExceededError`) werden von `StorageStatusService` verfolgt; die
App-Shell zeigt in diesem Fall einen nicht blockierenden Hinweis
("Änderungen werden in dieser Sitzung nicht gespeichert."), statt still
Daten zu verlieren. Der Token macht `localStorage` außerdem in Tests durch
einen Mock ersetzbar.

## Design-Prinzipien und Design-Tokens

Design-Prinzipien der UI:

- **Ein einziges Tokens-File als Quelle der Wahrheit.**
  `src/styles/_tokens.scss` definiert Farbe, Typografie, Spacing, Radien,
  Schatten und Motion-Dauer als CSS Custom Properties auf `:root`.
  Komponenten referenzieren ausschließlich `var(--token-name)`, nie
  hart kodierte Werte.
- **Eine Akzentfarbe.** Genau eine Farbe (`--color-accent`) markiert
  interaktive/hervorgehobene Elemente (aktive Navigation, primäre Buttons,
  Fokus); alles andere ist neutrales Grau oder eine von drei
  Zustandsfarben (Erfolg/Warnung/Fehler).
- **Kontrast ist vorab geprüft, nicht nachträglich gepatcht.** Jede
  Text-/Hintergrund-Kombination (hell wie dunkel) ist in
  `src/styles/tokens.md` mit ihrem tatsächlichen Kontrastverhältnis
  dokumentiert und erfüllt WCAG AA (≥ 4.5:1 für Fließtext).
- **Dunkles Farbschema folgt der Systemeinstellung.** Gesteuert über
  `prefers-color-scheme: dark`, kein manueller Umschalter. Nur Farb-Tokens
  ändern sich; Spacing/Typografie/Radien/Schatten/Motion bleiben gleich, um
  Layout-Sprünge zu vermeiden.
- **Bewegung ist reduzierbar.** `prefers-reduced-motion: reduce` schaltet
  `transition`/`animation` global ab (siehe
  [`prefers-reduced-motion`](#prefers-reduced-motion)).
- **Kleine, konsistente Skalen statt freier Werte.** 4px-Spacing-Skala
  (`--space-1` … `--space-16`), vier Radien, drei Schatten- und drei
  Motion-Dauer-Stufen – bewusst ohne Zwischenwerte, um die Oberfläche
  konsistent zu halten.

Wichtigste Token-Gruppen im Überblick (Details, alle Werte und
Kontrastwerte in `src/styles/tokens.md`):

| Gruppe              | Beispiel-Tokens                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akzentfarbe         | `--color-accent`, `--color-accent-contrast`                                                                                                          |
| Neutrale Graustufen | `--color-gray-50` … `--color-gray-900`, semantische Aliase (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`) |
| Zustandsfarben      | `--color-success`/`-warning`/`-error`, jeweils mit `-surface`-Variante                                                                               |
| Typografie          | `--font-family-base`, `--font-size-xs` … `--font-size-3xl`, `--font-weight-*`, `--line-height-*`                                                     |
| Spacing (4px-Basis) | `--space-1` … `--space-16`                                                                                                                           |
| Radien              | `--radius-sm`/`-md`/`-lg`/`-full`                                                                                                                    |
| Schatten            | `--shadow-sm`/`-md`/`-lg`                                                                                                                            |
| Motion              | `--motion-duration-fast`/`-base`/`-slow`, `--motion-easing-standard`                                                                                 |
| Layout              | `--layout-content-max-width` (zentrierte Inhaltsspalte, 768px)                                                                                       |

## Tests

```bash
npm test -- --watch=false
```

Der Test-Runner ist Vitest, angebunden über den offiziellen Angular-Builder
`@angular/build:unit-test` (`architect.test` in `angular.json`, Konfiguration
in `vitest-base.config.ts`). Vitest führt die Tests standardmäßig in einer
Node.js-Umgebung mit `jsdom` aus – es wird kein echter Browser gestartet,
der Lauf ist damit von Haus aus headless und CI-tauglich, ganz ohne
zusätzliche Browser-/Headless-Flags.

Coverage ist über `coverage: true` im `test`-Target in `angular.json` fest
aktiviert; jeder Testlauf erzeugt einen HTML- und Text-Report unter
`coverage/todo-app` (Ordner `/coverage` ist in `.gitignore` und wird nicht
versioniert).

Beispieltests als Vorlage für neue Komponenten/Services:

- Komponente: `src/app/shared/ui/page-header/page-header.component.spec.ts`
- Service: `src/app/core/services/app-title.service.spec.ts`

## Barrierefreiheit

```bash
npm run a11y
```

Prüft die Hauptansichten (`/heute`, `/kalender`) automatisiert gegen die
WCAG-2-A/AA-Erfolgskriterien: `*.a11y.spec.ts`-Dateien rendern die jeweilige
Seiten-Komponente per Angular TestBed (inkl. repräsentativer Beispieldaten)
und lassen [axe-core](https://github.com/dequelabs/axe-core) gegen das
Ergebnis laufen (`src/testing/axe.ts`). Der Lauf schlägt fehl, sobald axe-core
einen Verstoß meldet. Die Farbkontrast-Regel (`color-contrast`) ist dabei
deaktiviert, da jsdom kein echtes Layout/Rendering durchführt und daher keine
verlässlichen Kontrastwerte liefert – Kontrast wird stattdessen separat über
die Design-Tokens sichergestellt (siehe
[Design-Prinzipien und Design-Tokens](#design-prinzipien-und-design-tokens)).

Die A11y-Spezifikationen laufen als Teilmenge auch über `npm test` mit;
`npm run a11y` filtert per `--include` gezielt nur auf sie, für einen
schnellen, eigenständigen A11y-Gate-Check.

### `prefers-reduced-motion`

Nutzer:innen mit aktivierter Systemeinstellung "Bewegung reduzieren" bekommen
keine Übergänge/Animationen: `src/styles.scss` deaktiviert global (für alle
aktuellen und künftigen Komponenten) `transition`/`animation` per
`@media (prefers-reduced-motion: reduce)`, statt dies einzeln pro Komponente
nachzuziehen.

### ARIA-Rollen, -Beschriftungen und Live-Region (DEMOPROJEK-49)

- **Aufgabenlisten**: Alle `<ul class="task-list">` (Aufgaben-, Heute- und
  Kalender-Tagesansicht) tragen zusätzlich zum semantischen `<ul>` ein
  explizites `role="list"` sowie ein beschriftendes `aria-label`. Grund: Die
  Listen sind aus Layoutgründen mit `list-style: none` gestylt, wodurch
  WebKit/VoiceOver (Safari) der `<ul>` ihre implizite `list`-Rolle entzieht
  ("list-style: none removes list semantics"-Verhalten) – `role="list"`
  stellt sie explizit wieder her, unabhängig vom CSS.
- **Kalenderraster** (`app-month-grid`): nutzt bereits `role="grid"` /
  `role="row"` / `role="columnheader"` / `role="gridcell"` mit
  `aria-label` je Zelle (Datum, "heute", Aufgabenanzahl) sowie
  `aria-selected`/`aria-current` und Roving-Tabindex mit Pfeiltasten-
  Navigation (aus DEMOPROJEK-48). Für diesen Task nur verifiziert, keine
  Änderung nötig.
- **Icon-only-Bedienelemente**: `app-icon-button` (Löschen, Monatsnavigation
  im Datepicker) und `app-checkbox` (Erledigt-Status) erzwingen `ariaLabel`
  als Pflicht-Input; alle Verwendungsstellen im Code liefern bereits einen
  sprechenden Text (z. B. "Aufgabe löschen", "Vorheriger Monat"). Ebenfalls
  nur verifiziert, keine Änderung nötig.
- **Live-Region für Anlegen/Abhaken/Löschen**: Neuer `AnnouncerService`
  (`core/services/announcer.service.ts`) hält eine `message`-Signal; die
  aktuelle Nachricht wird in `AppComponent` in einer global vorhandenen,
  visuell versteckten (`.visually-hidden`) Region mit `role="status"
aria-live="polite"` gerendert. `TasksPageComponent`, `HeutePageComponent`
  und `CalendarPageComponent` rufen `announce(...)` beim Anlegen, Abhaken/
  Wieder-Öffnen und Löschen einer Aufgabe auf (z. B. „Milch kaufen“
  hinzugefügt./als erledigt markiert./gelöscht.). In der Aufgaben-Ansicht
  übernimmt für das Löschen weiterhin die bestehende Undo-Meldung
  (`role="status"`) die Ankündigung, um keine doppelte Sprachausgabe für
  dieselbe Aktion zu erzeugen.

### Dokumentierter Screenreader-Durchgang

In dieser (headless) Ausführungsumgebung steht kein echter Screenreader zur
Verfügung (kein NVDA/VoiceOver/Orca installierbar). Der Durchgang wurde
deshalb anhand des tatsächlich gerenderten DOM/Accessibility-Baums
durchgeführt: Für jede interaktive Komponente wurde Rolle, berechneter
Accessible Name und Status anhand der ARIA-Spezifikation nachvollzogen (so,
wie NVDA/VoiceOver sie vorlesen würden), ergänzt um die Tastatur-Interaktion
aus DEMOPROJEK-48. Geprüft wurden:

1. Skip-Link → Hauptinhalt, Navigation mit `aria-current="page"`.
2. Aufgabenliste (`/aufgaben`): Formular mit Label-losem, aber per
   `placeholder` **und** sichtbarem "Hinzufügen"-Button beschriftetem Feld;
   Liste als `list` mit 1..n `listitem`s; Checkbox mit Titel als Name;
   Inline-Edit-Buttons für Titel/Notiz mit sichtbarem Text als Name;
   Schnelldatum-Gruppe mit `role="group"` + `aria-label`; Löschen-Button mit
   `aria-label="Aufgabe löschen"`.
3. Heute-Ansicht: Fortschrittsanzeige als `role="progressbar"` mit
   `aria-valuenow`/`aria-valuetext`; Gruppen ("Heute", "Überfällig",
   "Erledigt (n)") mit Überschrift vor der jeweiligen Liste; Erledigt-
   Bereich als `aria-expanded`-Button mit `aria-controls` auf die Liste.
4. Kalender: Monatsraster als `grid` mit Pfeiltasten-Navigation und
   sprechenden Zellenbeschriftungen ("Dienstag, 3. September 2026, heute, 2
   offene Aufgaben"); Tagesliste rechts mit kontextgebendem
   `aria-label="Aufgaben für …"` auf der Sektion.
5. Anlegen/Abhaken/Löschen auf allen drei Seiten: Live-Region
   (`role="status" aria-live="polite"`) enthält nach der Aktion den
   erwarteten Ankündigungstext (siehe oben).

**Gefundene Mängel, die in diesem Änderungssatz behoben wurden:**

- Aufgabenlisten hatten keine explizite `list`-Rolle (Safari/VoiceOver-Bug
  durch `list-style: none`) und die Aufgabenliste unter `/aufgaben` keine
  eigene Beschriftung → `role="list"` + `aria-label` ergänzt (siehe oben).
- Abhaken (Checkbox-Toggle) und Anlegen einer Aufgabe wurden bisher gar
  nicht angekündigt, Löschen nur auf der Aufgaben-Seite (über die
  Undo-Meldung) → einheitlich über `AnnouncerService` auf allen drei Seiten
  ergänzt.

**Als Folge-Item notiert (nicht in diesem Change behoben):**

- Das Datumsauswahl-Popover (`app-date-picker`, `role="dialog"
aria-modal="false"`) fängt den Tab-Fokus nicht ein: Per Tab kann der
  Fokus aus dem geöffneten Popover heraus in den dahinterliegenden Inhalt
  wandern, während das Popover optisch noch offen ist. Ein echter
  Fokus-Trap (oder `aria-modal="true"` mit entsprechendem Trap) ist ein
  separates, größeres Stück Arbeit und war nicht Teil dieses ARIA-/
  Live-Region-Tickets – als Folge-Ticket vorzumerken.

## Sicherheit

### Aufgabentexte (Titel, Notizen) werden nie als HTML interpretiert

Titel und Notizen sind frei eingebbarer, nutzergesteuerter Text. Sie werden im
gesamten Quellcode ausschließlich per Angular-Interpolation (`{{ ... }}`)
gerendert, niemals über `innerHTML` oder `DomSanitizer.bypassSecurityTrust*`.
Angular escaped interpolierte Werte automatisch, wodurch z. B. ein Titel wie
`<img src=x onerror=alert(1)>` als sichtbarer Text dargestellt wird und kein
Skript ausführt (siehe Test in
`src/app/shared/ui/task-item/task-item.component.spec.ts`).

Dies ist zusätzlich per Lint-Regel abgesichert (`eslint.config.js`):

- `no-unsafe-html/no-inner-html-assignment` verbietet `.innerHTML`-Zuweisungen
  in TypeScript-Code.
- `no-unsafe-html/no-bypass-security-trust` verbietet den Import von
  `DomSanitizer` sowie Aufrufe von `bypassSecurityTrust*`.
- `no-restricted-syntax` verbietet `[innerHTML]`-Bindings in Templates
  (`**/*.html`).

`npm run lint` schlägt fehl, sobald eine dieser APIs verwendet wird.

### Content-Security-Policy

Da die App als reines Static-Asset-Bundle ohne eigenen Server ausgeliefert
wird (siehe unten), kann sie keine HTTP-Response-Header setzen. Die CSP ist
deshalb als `<meta http-equiv="Content-Security-Policy">`-Tag in
`src/index.html` hinterlegt und landet damit unverändert in jedem
Produktions-Build:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self';
form-action 'self'; object-src 'none'
```

- Kein `unsafe-inline`/`unsafe-eval` in `script-src` – es werden ausschließlich
  die vom Build erzeugten, gehashten `<script>`-Dateien vom eigenen Origin
  geladen. Das ist die für XSS relevante Direktive: Sie verhindert, dass über
  Aufgabentexte eingeschleuster Inline-Code je ausgeführt wird.
- `style-src` erlaubt `'unsafe-inline'`: Angular hängt die Styles jeder
  Komponente (z. B. `task-item.component.scss`) zur Laufzeit als eigene
  `<style>`-Elemente in den `<head>` (Renderer2-Style-Injection, nicht über
  Constructable Stylesheets). Ohne eigenen Server, der pro Request ein
  frisches Nonce ausliefern kann, lässt sich dafür kein CSP-Nonce setzen – ein
  fest im Static-Build hinterlegtes Nonce wäre öffentlich einsehbar und böte
  keinen echten Schutz gegenüber `'unsafe-inline'`. Da Aufgabentexte
  ausschließlich per Interpolation (kein `[innerHTML]`/`[style]`-Binding auf
  Nutzerinput) gerendert werden, existiert kein Weg, über Aufgabentexte CSS in
  diese Style-Elemente einzuschleusen; die Lockerung bleibt bewusst auf
  `style-src` beschränkt und betrifft `script-src` nicht.
- `object-src 'none'` unterbindet Plugins (Flash u. ä.).
- `img-src` erlaubt zusätzlich `data:`, da das Favicon als Data-URI eingebunden
  ist.

Einschränkung von `<meta>`-basierten CSPs: Direktiven wie `frame-ancestors`,
`report-uri`/`report-to` und `sandbox` werden von Browsern in einem
`<meta>`-Tag ignoriert und wirken nur über einen echten HTTP-Header. Hosts,
die eigene Response-Header setzen können (Nginx, Netlify, CDN, ...), sollten
daher zusätzlich `Content-Security-Policy: frame-ancestors 'none'` bzw.
`X-Frame-Options: DENY` als Header konfigurieren, um Clickjacking zu
verhindern; das Deployment-Skript selbst bleibt hosting-neutral (siehe unten).

Die App wurde nach Aktivierung der CSP gegen einen `npm run build`
(Produktionskonfiguration) verifiziert: Der Build liefert ausschließlich
gehashte, same-origin `<script>`-Dateien aus (kein Inline-Skript), sodass
`script-src 'self'` ohne `'unsafe-inline'`/`'unsafe-eval'` greift. Die von
Angular zur Laufzeit injizierten Komponenten-Styles werden durch das
`'unsafe-inline'` in `style-src` abgedeckt, wodurch die App ohne
CSP-Verstöße lädt und vollständig gestylt gerendert wird.

In `angular.json` ist dafür `optimization.styles.inlineCritical: false` für
die Produktionskonfiguration gesetzt: Angulars Standardverhalten
("Critical CSS Inlining") würde das nicht-kritische Stylesheet sonst per
`<link rel="stylesheet" media="print" onload="this.media='all'">` laden –
ein Inline-Event-Handler, den `script-src 'self'` ohne `'unsafe-inline'`
blockiert, wodurch die App ungestylt bliebe. Mit `inlineCritical: false`
wird das Stylesheet stattdessen als gewöhnlicher `<link rel="stylesheet">`
ohne Inline-Handler eingebunden.

## Performance und Bundle-Budget

Damit eine bewusst minimalistische App wie diese nicht unbemerkt über die Zeit
wächst, sind in `angular.json` (Produktionskonfiguration) Größenbudgets
hinterlegt, die den Build ab einem `maximumError`-Schwellwert fehlschlagen
lassen (`ng build` bricht mit Exit-Code ≠ 0 ab):

| Budget-Typ         | Warnung | Fehler | Betrifft                                                        |
| ------------------ | ------- | ------ | ---------------------------------------------------------------- |
| `initial`          | 320 kB  | 450 kB | Summe aller initial geladenen JS-/CSS-Dateien (Raw-Size)          |
| `anyComponentStyle` | 3 kB    | 5 kB   | Kompiliertes Stylesheet einer einzelnen Komponente                |

Die Werte orientieren sich an den tatsächlichen Größen und lassen bewusst nur
moderaten Spielraum für organisches Wachstum, statt der sehr weiten
CLI-Standardwerte (500 kB/1 MB bzw. 4 kB/8 kB), die bei dieser kleinen App
Verdopplungen unbemerkt durchließen.

Aktueller Stand eines Produktions-Builds (`npm run build`, Angular
`21.2.22`, ungzippt/"Raw size"):

```
Initial chunk files   | Names               |  Raw size | Estimated transfer size
chunk-622DW6YV.js     | -                   | 150.90 kB |                43.96 kB
chunk-QIWV3FMO.js     | -                   |  88.25 kB |                22.24 kB
polyfills-5CFQRCPP.js | polyfills           |  34.59 kB |                11.33 kB
main-KGJAKJB3.js      | main                |   3.73 kB |                 1.36 kB
styles-UGZUCUP7.css   | styles              |   2.80 kB |               814 bytes
chunk-44AGDEVN.js     | -                   | 799 bytes |               799 bytes

                      | Initial total       | 281.06 kB |                80.51 kB
```

Das initiale Bundle liegt damit bei rund 281 kB und damit unter der
320-kB-Warnschwelle bzw. deutlich unter der 450-kB-Fehlerschwelle. Die größte
kompilierte Komponenten-Stylesheet (`task-item.component.scss`) liegt bei
rund 2.46 kB und damit unter dem 3-kB/5-kB-Budget für `anyComponentStyle`.

### Lazy Loading

Die beiden über die Navigation erreichbaren Feature-Routen werden per
`loadChildren`-Dynamic-Import lazy geladen (`src/app/app.routes.ts`):

```ts
{ path: 'heute', loadChildren: () => import('./features/heute/heute.routes').then(...) },
{ path: 'kalender', loadChildren: () => import('./features/calendar/calendar.routes').then(...) },
```

Dadurch landet Kalender-spezifischer Code (u. a. `CalendarPageComponent`,
`MonthGridComponent`) nicht im initialen Bundle, sondern in einem eigenen
Lazy-Chunk (`calendar-routes`, ca. 7.05 kB Raw-Size / 2.31 kB Transfer-Size
laut obigem Build), der erst beim Navigieren zu `/kalender` nachgeladen wird.
Analog gilt das für `/heute` (`heute-routes`-Chunk). Ein zusätzliches
`loadComponent` innerhalb der jeweiligen Routen-Datei wäre hier kein
weiterer Gewinn: Jede Route hat nur eine einzige Seiten-Komponente, sodass
das Splitting bereits auf Routen-Ebene vollständig greift.

## Deployment (statisches Hosting)

```bash
npm run build
```

Das Bundle wird nach `dist/todo-app` erzeugt; die statisch ausliefer­baren
Dateien (inkl. `index.html`) liegen dabei unter `dist/todo-app/browser`. Es
handelt sich um ein reines Static-Asset-Bundle (HTML/JS/CSS) ohne
Serverlogik – jeder Static-File-Host (Nginx, Netlify, GitHub Pages, S3, ...)
kann den Ordner unverändert ausliefern.

### base-href für Unterpfade

Die App ist standardmäßig für die Auslieferung am Domain-Root gebaut
(`<base href="/">` in `src/index.html`). Soll die App stattdessen unter
einem Unterpfad laufen (z. B. `https://beispiel.de/todo-app/` oder
GitHub Pages unter `https://<user>.github.io/<repo>/`), lässt sich der
`base-href` über den Standard-Build-Parameter der Angular-CLI setzen:

```bash
npm run build -- --base-href=/todo-app/
```

Alle generierten Assets und der Router referenzieren dann konsequent den
angegebenen Unterpfad.

### SPA-Fallback

Da die App ausschließlich clientseitiges Routing nutzt (`provideRouter`
ohne `withHashLocation`), führt der direkte Aufruf einer Deep-Link-Route
wie `/kalender` auf einem naiv konfigurierten Static-Host zu einem echten
404, weil unter diesem Pfad keine Datei existiert. Der Host muss deshalb so
konfiguriert sein, dass unbekannte Pfade auf `index.html` zurückfallen
("SPA-Fallback"), damit der Angular-Router die Route anschließend
clientseitig auflöst:

- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Netlify:** `_redirects`-Datei mit `/* /index.html 200`
- **GitHub Pages:** kennt kein serverseitiges Rewriting; stattdessen wird
  `index.html` zusätzlich als `404.html` abgelegt – GitHub Pages liefert
  diese Datei bei jedem unbekannten Pfad aus, wodurch die Angular-App
  geladen wird und die Route clientseitig übernimmt.

Das Skript `scripts/deploy-static.sh` kapselt Build und SPA-Fallback in
einem Schritt:

```bash
npm run deploy:static -- /todo-app/
# oder direkt:
scripts/deploy-static.sh /todo-app/
```

Es baut die App mit dem übergebenen `base-href` (Default `/`) und legt in
`dist/todo-app/browser` zusätzlich eine `404.html` (Kopie von `index.html`)
ab. Der Ordner `dist/todo-app/browser` kann danach unverändert auf den
Ziel-Host hochgeladen werden.

### Beispiel: GitHub Pages

```bash
npm run deploy:static -- /todo-app/
npx gh-pages -d dist/todo-app/browser
```

`gh-pages` veröffentlicht den Ordnerinhalt (inkl. `404.html`) auf dem
`gh-pages`-Branch des Repositories. Der `base-href` muss dabei zum
Repository-Namen passen, unter dem GitHub Pages die Seite ausliefert
(`https://<user>.github.io/<repo>/`). Andere Hosting-Ziele (internes Nginx,
Netlify, S3 + CDN, ...) funktionieren analog: `base-href` passend zum
Ziel-Unterpfad setzen und den Inhalt von `dist/todo-app/browser` inkl.
SPA-Fallback-Konfiguration des jeweiligen Hosts ausliefern. Das konkrete
Hosting-Ziel ist für dieses Projekt noch offen (siehe unten).

## Bekannte Grenzen und offene Fragen

Bewusst nicht umgesetzt:

- **Kein Backend.** Es gibt keinen Server und keine API; die App ist ein
  reines Static-Asset-Bundle (siehe
  [Deployment](#deployment-statisches-hosting)).
- **Keine Synchronisierung.** Aufgaben liegen ausschließlich lokal im
  `localStorage` des jeweiligen Browsers (siehe
  [Persistenz](#persistenz)). Es gibt keinen Abgleich zwischen Geräten oder
  Browsern; ein anderer Browser/Rechner sieht eine leere App mit eigenem
  Demo-Datensatz.
- **Keine wiederkehrenden Aufgaben.** Jede Aufgabe ist ein einmaliges
  Item mit höchstens einem Fälligkeitsdatum; es gibt keine Wiederholung
  (täglich/wöchentlich/...) und kein automatisches Neu-Erzeugen erledigter
  Aufgaben.

Offene Produktfragen:

- **i18n:** Die UI-Texte sind aktuell fest auf Deutsch verdrahtet, aber
  ausschließlich in den Templates (nicht im TypeScript-Code) hinterlegt.
  Offen: Soll die Anwendung von Beginn an mit `@angular/localize`
  i18n-fähig gebaut werden?
- **Hosting-Ziel:** Das konkrete Hosting-Ziel für ein Deployment (internes
  Nginx, Netlify, GitHub Pages, S3 + CDN, ...) ist noch nicht festgelegt;
  das Deployment-Skript ist deshalb bewusst hosting-neutral gehalten (siehe
  [Deployment](#deployment-statisches-hosting)).
- **Datepicker-Fokus-Trap:** Das Datumsauswahl-Popover fängt den
  Tab-Fokus nicht ein (siehe
  [Als Folge-Item notiert](#dokumentierter-screenreader-durchgang)) – als
  separates Folge-Ticket vorgemerkt.

Bekannte Inkonsistenz im Code (kein Produktentscheid, sondern offener
Aufräumpunkt): `features/tasks/` (`TasksPageComponent`/`TASKS_ROUTES`) ist
nicht in `app.routes.ts` eingebunden und über die Navigation nicht
erreichbar – siehe
[Architektur und Datenfluss](#architektur-und-datenfluss).
