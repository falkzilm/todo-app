// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");

// Aufgabentexte (Titel, Notizen) duerfen nie als HTML interpretiert werden, siehe
// DEMOPROJEK-20: innerHTML-Zuweisungen sowie DomSanitizer/bypassSecurityTrust* umgehen
// Angulars eingebautes XSS-Escaping und sind daher projektweit verboten - Rendering
// erfolgt ausschliesslich per Interpolation ({{ ... }}).
const noUnsafeHtmlPlugin = {
  rules: {
    "no-inner-html-assignment": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          forbidden:
            "innerHTML darf nicht verwendet werden, da Aufgabentexte dadurch als HTML statt als Text interpretiert werden koennten. Rendering ausschliesslich per Interpolation.",
        },
      },
      create(context) {
        return {
          "MemberExpression[property.name='innerHTML']"(node) {
            context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-bypass-security-trust": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          forbidden:
            "DomSanitizer/bypassSecurityTrust* darf fuer Aufgabentexte nicht verwendet werden, da damit Angulars XSS-Schutz umgangen wird.",
        },
      },
      create(context) {
        return {
          "ImportSpecifier[imported.name='DomSanitizer']"(node) {
            context.report({ node, messageId: "forbidden" });
          },
          "MemberExpression[property.name=/^bypassSecurityTrust/]"(node) {
            context.report({ node, messageId: "forbidden" });
          },
          "Identifier[name=/^bypassSecurityTrust/]"(node) {
            context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
  },
};

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      "no-unsafe-html": noUnsafeHtmlPlugin,
    },
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          // "attribute" zusätzlich zu "element" erlaubt, damit Komponenten wie
          // TaskItemComponent per Attribut-Selektor auf einem semantisch
          // vorgegebenen Host-Tag (z. B. <li app-task-item>) sitzen können,
          // statt die Tag-Struktur (hier: direktes <li>-Kind einer <ul>) durch
          // ein eigenes Custom-Element zu brechen.
          type: ["element", "attribute"],
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "no-unsafe-html/no-inner-html-assignment": "error",
      "no-unsafe-html/no-bypass-security-trust": "error",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    plugins: {
      "no-unsafe-html": noUnsafeHtmlPlugin,
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: ":matches(BoundAttribute, TextAttribute)[name='innerHTML']",
          message:
            "[innerHTML] darf in Templates nicht gebunden werden, da Aufgabentexte dadurch als HTML statt als Text interpretiert werden koennten. Rendering ausschliesslich per Interpolation ({{ ... }}).",
        },
      ],
    },
  }
]);
