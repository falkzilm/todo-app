#!/usr/bin/env bash
set -euo pipefail

# Baut die App als statisches Bundle und bereitet es fuer die Auslieferung
# ueber einen beliebigen Static-File-Host vor (keine Serverlogik noetig).
#
# Nutzung:
#   scripts/deploy-static.sh [BASE_HREF]
#
# BASE_HREF ist der Unterpfad, unter dem die App ausgeliefert wird, z. B.
# "/todo-app/" fuer GitHub Pages unter https://<user>.github.io/todo-app/.
# Ohne Argument wird "/" verwendet (App liegt am Domain-Root).
#
# Beispiel fuer GitHub Pages:
#   scripts/deploy-static.sh /todo-app/
#   npx gh-pages -d dist/todo-app/browser
#
# Siehe README.md, Abschnitt "Deployment (statisches Hosting)", fuer die
# Hintergruende zum SPA-Fallback und weitere Hosting-Ziele.

BASE_HREF="${1:-/}"

# Ein Pfad-Base-Href muss mit "/" beginnen und enden, sonst loest der Browser
# relative Bundle-URLs am falschen Ort auf (z. B. "/todo-app" statt
# "/todo-app/"). Normalisieren, statt eine kaputte Konfiguration zuzulassen.
[[ "${BASE_HREF}" == /* ]] || BASE_HREF="/${BASE_HREF}"
[[ "${BASE_HREF}" == */ ]] || BASE_HREF="${BASE_HREF}/"

OUTPUT_DIR="dist/todo-app/browser"

echo "Baue Produktionsbuild mit base-href=${BASE_HREF} ..."
npm run build -- --base-href="${BASE_HREF}"

# SPA-Fallback fuer dateibasiertes Hosting (z. B. GitHub Pages): Kopie von
# index.html als 404.html, damit der direkte Aufruf einer Deep-Link-Route
# (z. B. /calendar) nicht in einem echten 404 endet, sondern die Angular-App
# ausliefert, die die Route anschliessend clientseitig aufloest.
cp "${OUTPUT_DIR}/index.html" "${OUTPUT_DIR}/404.html"

echo ""
echo "Statisches Bundle liegt bereit unter: ${OUTPUT_DIR}"
echo "Enthaelt index.html + 404.html (SPA-Fallback) und kann unveraendert"
echo "auf einen Static-File-Host hochgeladen werden."
