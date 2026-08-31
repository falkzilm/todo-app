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

> **Hinweis:** `package-lock.json` muss einmalig mit Netzwerkzugriff auf die npm-Registry
> erzeugt werden (`npm install`). In der aktuellen Sandbox dieses Agenten ist sowohl der
> `npm`-Aufruf selbst als auch jeglicher Netzwerkzugriff (Bash, WebFetch, WebSearch) von der
> Berechtigungsschicht blockiert, weshalb dieser Schritt sowie der lokale Start/Build hier
> nicht ausgeführt/verifiziert werden konnten.

## Produktions-Build

```bash
npm run build
```

Das Bundle wird nach `dist/todo-app` erzeugt.
