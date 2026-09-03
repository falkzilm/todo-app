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
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self';
object-src 'none'
```

- Kein `unsafe-inline`/`unsafe-eval` in `script-src` – es werden ausschließlich
  die vom Build erzeugten, gehashten `<script>`-Dateien vom eigenen Origin
  geladen.
- Auch `style-src` kommt ohne `unsafe-inline` aus: Der Produktions-Build
  inlined standardmäßig kritisches CSS (samt eines `onload`-Inline-Handlers)
  in `index.html`; dieses "Critical CSS Inlining" ist in `angular.json` über
  `optimization.styles.inlineCritical: false` deaktiviert, damit ausschließlich
  die externe, eigene Stylesheet-Datei geladen wird.
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

Die App wurde nach Aktivierung der CSP gegen `npm run build` verifiziert
(Produktions-Build lädt ausschließlich Same-Origin-Skripte/-Stylesheets ohne
Inline-Code, siehe `npm test` und `npm run lint`).

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
