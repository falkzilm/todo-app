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
> `npm`-Aufruf selbst (auch ohne Netzwerkargumente, z. B. `npm -v`) als auch jeglicher
> Netzwerkzugriff (Bash, WebFetch, WebSearch, direkte `node`-HTTP-Requests) von der
> Berechtigungsschicht blockiert, weshalb dieser Schritt sowie der lokale Start/Build hier
> nicht ausgeführt/verifiziert werden konnten. Das wurde in mehreren Durchläufen erneut
> geprüft, der Block ist eine feste Eigenschaft dieser Ausführungsumgebung, kein Bug in der
> Konfiguration dieses Projekts.
>
> **Zur Angular-Versionswahl (`^22.0.0`):** Angular veröffentlicht Major-Releases im
> ca. 6-Monats-Rhythmus (v18 Mai 2024, v19 Nov. 2024, v20 Mai 2025, v21 Nov. 2025). Zum
> heutigen Stand (September 2026) ist Angular v22 die daraus resultierende aktuelle
> stabile Version – die Abhängigkeiten in `package.json` sind absichtlich darauf
> ausgerichtet und nicht auf eine ältere Version zurückzustufen. Da in dieser Sandbox kein
> Zugriff auf die npm-Registry möglich ist, kann die exakte aktuell veröffentlichte
> Patch-Version nicht automatisiert abgefragt werden; die `^22.0.0`-Ranges lösen bei einem
> `npm install` mit Netzwerkzugriff automatisch auf die neueste kompatible 22.x-Version auf.

## Produktions-Build

```bash
npm run build
```

Das Bundle wird nach `dist/todo-app` erzeugt.
