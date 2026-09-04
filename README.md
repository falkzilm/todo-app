# ToDo App

Angular-Workspace für die ToDo-App: Standalone-Komponenten, Signals als State-Primitive,
TypeScript `strict` (inkl. `strictTemplates`), SCSS und aktiviertes Routing.

## Struktur

Der Code unter `src/app` ist nach Feature-Slices organisiert:

- `core/` – anwendungsweite Services (z. B. `AppTitleService`)
- `shared/` – wiederverwendbare, feature-übergreifende UI-Bausteine (z. B. `PageHeaderComponent`)
- `features/tasks/` – Aufgabenverwaltung (Startseite unter `/heute`)
- `features/calendar/` – Kalenderansicht unter `/kalender`

Es gibt kein Backend und keine Proxy-Konfiguration; alle Daten liegen aktuell nur im
Client-State (Signals).

## Sprache / i18n

Die UI-Texte sind aktuell fest auf Deutsch verdrahtet, aber ausschließlich in den
Templates (nicht im TypeScript-Code) hinterlegt. Offene Frage für Review: Soll die
Anwendung von Beginn an mit `@angular/localize` i18n-fähig gebaut werden?

## Entwicklung

```bash
npm ci
npm start
```

Die App ist danach unter `http://localhost:4200` erreichbar.

> **Zur Angular-Versionswahl:** Die zum Zeitpunkt der Erstellung per `npm view @angular/core
> versions` aktuelle stabile Version ist `22.1.4` (CLI/Build-Tooling `22.1.6`). Diese Version
> lässt sich in der hier verfügbaren Ausführungsumgebung jedoch nicht bauen: Die Angular-CLI
> bricht mit Node.js `v22.22.1` hart ab, da Angular 22.x mindestens Node `^22.22.3 || ^24.15.0
> || >=26.0.0` voraussetzt und ein Upgrade der Node-Installation in dieser Umgebung nicht
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

## Barrierefreiheit (A11y)

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
die Design-Tokens sichergestellt (siehe `src/styles/tokens.md`, alle
Text-/Hintergrund-Kombinationen sind dort mit ihrem Kontrastverhältnis
dokumentiert und erfüllen WCAG AA).

Die A11y-Spezifikationen laufen als Teilmenge auch über `npm test` mit;
`npm run a11y` filtert per `--include` gezielt nur auf sie, für einen
schnellen, eigenständigen A11y-Gate-Check.

### `prefers-reduced-motion`

Nutzer:innen mit aktivierter Systemeinstellung "Bewegung reduzieren" bekommen
keine Übergänge/Animationen: `src/styles.scss` deaktiviert global (für alle
aktuellen und künftigen Komponenten) `transition`/`animation` per
`@media (prefers-reduced-motion: reduce)`, statt dies einzeln pro Komponente
nachzuziehen.

## E2E-Tests (DEMOPROJEK-52)

```bash
npm run e2e
```

Führt [Playwright](https://playwright.dev/) headless gegen einen von
Playwright selbst gestarteten `ng serve` aus (`webServer` in
`playwright.config.ts`, Port `4399`); es ist kein manueller Setup-Schritt
nötig. Die Spezifikationen liegen unter `e2e/` (außerhalb der
TypeScript-Scopes von `ng build`/`ng test`/`ng lint`, siehe
`tsconfig*.json` bzw. `angular.json`).

Abgedeckte Kernflüsse (`e2e/task-flows.spec.ts`):

- Aufgabe anlegen
- Aufgabe abhaken
- Persistenz einer (abgehakten) Aufgabe über einen Reload
- Tag im Kalender auswählen und eine Aufgabe darüber auf einen anderen Tag
  umplanen

Jeder Test startet über den Helper `gotoFresh` (`e2e/support.ts`) mit einem
explizit auf einen leeren Zustand gesetzten `localStorage`-Eintrag
(`todo-app.tasks`). Das ist nötig, weil die Persistenz-Schicht nur beim
allerersten Laden (noch nie gespeicherter Zustand) Demo-Aufgaben einsät –
ohne das explizite Zurücksetzen würde der Startzustand eines Tests vom
Ergebnis vorheriger Testläufe abhängen. Dadurch sind die Tests voneinander
unabhängig und wiederholbar grün.

Die Selektoren nutzen durchgehend ARIA-Rollen/-Labels
(`getByRole('checkbox' | 'button' | 'gridcell' | 'dialog' | 'region' | 'listitem', ...)`)
statt CSS-Klassen oder Test-IDs und bauen damit auf der unter
["Barrierefreiheit"](#barrierefreiheit) dokumentierten Accessibility-Semantik
der App auf.

## Produktions-Build

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

## Barrierefreiheit

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

## Deployment (statisches Hosting)

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
Hosting-Ziel ist für dieses Projekt noch offen – siehe Ticket-Beschreibung;
das Deployment-Skript ist bewusst hosting-neutral gehalten.
