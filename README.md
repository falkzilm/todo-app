# ToDo App

Angular-Workspace für die ToDo-App: Standalone-Komponenten, Signals als State-Primitive,
TypeScript `strict` (inkl. `strictTemplates`), SCSS und aktiviertes Routing.

## Struktur

Der Code unter `src/app` ist nach Feature-Slices organisiert:

- `core/` – anwendungsweite Services (z. B. `AppTitleService`)
- `shared/` – wiederverwendbare, feature-übergreifende UI-Bausteine (z. B. `PageHeaderComponent`)
- `features/tasks/` – Aufgabenverwaltung (Startseite unter `/tasks`)
- `features/calendar/` – Kalenderansicht unter `/calendar`

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

## Produktions-Build

```bash
npm run build
```

Das Bundle wird nach `dist/todo-app` erzeugt.
