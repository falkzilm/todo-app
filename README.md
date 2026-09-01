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

> **Node-Version:** Angular 22 setzt Node.js `^22.22.3 || ^24.15.0 || >=26.0.0` voraus
> (siehe `engines` in `package.json`). Mit einer älteren Node-22-Patch-Version bricht die
> Angular CLI mit einer entsprechenden Fehlermeldung ab.
>
> **Zur Angular-Versionswahl:** Die Abhängigkeiten sind auf die zum Zeitpunkt der Erstellung
> per `npm view @angular/core dist-tags` ermittelte aktuelle stabile Version (`22.1.4`,
> CLI/Build-Tooling `22.1.6`) ausgerichtet und mit `npm install` gegen die npm-Registry
> aufgelöst; `package-lock.json` ist entsprechend committet.

## Produktions-Build

```bash
npm run build
```

Das Bundle wird nach `dist/todo-app` erzeugt.
