import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import {
  LOCALES,
  forbiddenMetaDesignPhrases,
  localizationManifest,
  reviewedLiteralAllowlist,
} from "./localization-manifest.mjs";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const visibleObjectKeys = /^(?:title|subtitle|heading|label|description|text|name|question|answer|features?|items?|bullets?|placeholder|message|empty|action|cta|caption|helper|note|excerpt|paragraphs?|intro|readingTime|tags?|role)$/i;
const visibleAttributes = new Set(["aria-label", "placeholder", "title", "alt"]);
const technicalRoleValues = new Set(["admin", "client", "agent_developer"]);

function location(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: line + 1, column: character + 1 };
}

function issue(file, sourceFile, node, rule, message) {
  return { scope: file.scope, path: file.path, ...location(sourceFile, node), rule, message };
}

function propertyName(node) {
  if (!node) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return undefined;
}

function unwrapExpression(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function exportedObject(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) declarations.set(declaration.name.text, unwrapExpression(declaration.initializer));
      }
    }
  }
  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement)) continue;
    const expression = unwrapExpression(statement.expression);
    const value = ts.isIdentifier(expression) ? declarations.get(expression.text) : expression;
    if (value && ts.isObjectLiteralExpression(value)) return value;
  }
  return undefined;
}

function englishImportBindings(sourceFile) {
  const bindings = new Set();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "./en" ||
      !statement.importClause
    ) {
      continue;
    }
    if (statement.importClause.name) bindings.add(statement.importClause.name.text);
    const namedBindings = statement.importClause.namedBindings;
    if (namedBindings && ts.isNamespaceImport(namedBindings)) bindings.add(namedBindings.name.text);
    if (namedBindings && ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) bindings.add(element.name.text);
    }
  }
  return bindings;
}

function rootIdentifier(node) {
  let current = unwrapExpression(node);
  while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
    current = unwrapExpression(current.expression);
  }
  return ts.isIdentifier(current) ? current.text : undefined;
}

function shapeOf(node, prefix = "", shape = new Set()) {
  if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = propertyName(property.name);
      if (key === undefined) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      shape.add(path);
      shapeOf(property.initializer, path, shape);
    }
  } else if (ts.isArrayLiteralExpression(node)) {
    shape.add(`${prefix}[]`);
    for (const element of node.elements) shapeOf(element, `${prefix}[]`, shape);
  }
  return shape;
}

function localeObject(node) {
  if (!ts.isObjectLiteralExpression(node)) return undefined;
  const map = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property.name);
    if (key && LOCALES.includes(key) && ts.isObjectLiteralExpression(property.initializer)) map.set(key, property.initializer);
  }
  return LOCALES.every((locale) => map.has(locale)) ? map : undefined;
}

function jsxTagName(node) {
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText();
  return undefined;
}

function inCodeContext(ancestors) {
  return ancestors.some((ancestor) => {
    const tag = jsxTagName(ancestor);
    if (tag === "code" || tag === "pre") return true;
    if (ts.isPropertyAssignment(ancestor)) return /^(?:code|sample|command|url|href|endpoint|method|status|id|key|value|type|variant|icon|color|className|tone|path|slug|subsets|axes)$/i.test(propertyName(ancestor.name) ?? "");
    return false;
  });
}

function isTechnicalRoleLiteral(value, ancestors) {
  if (!technicalRoleValues.has(value)) return false;
  return ancestors.some(
    (ancestor) =>
      ts.isPropertyAssignment(ancestor) && /^(?:role|roles)$/.test(propertyName(ancestor.name) ?? ""),
  );
}

function isAllowedLiteral(value, ancestors) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || /^[\p{P}\p{S}\d\s]+$/u.test(trimmed)) return true;
  if (reviewedLiteralAllowlist.productAndProtocols.has(trimmed)) return true;
  if (reviewedLiteralAllowlist.httpMethods.has(trimmed)) return true;
  if (reviewedLiteralAllowlist.patterns.some((pattern) => pattern.test(trimmed))) return true;
  if (isTechnicalRoleLiteral(trimmed, ancestors)) return true;
  return inCodeContext(ancestors);
}

function objectDataIsVisible(ancestors) {
  const property = [...ancestors].reverse().find(ts.isPropertyAssignment);
  return property ? visibleObjectKeys.test(propertyName(property.name) ?? "") : false;
}

function isStandaloneArrayCopy(ancestors) {
  return ancestors.some(ts.isArrayLiteralExpression);
}

function templateText(node, sourceFile) {
  return `${node.head.text}${node.templateSpans
    .map((span) => `\${${span.expression.getText(sourceFile)}}${span.literal.text}`)
    .join("")}`;
}

function literalText(node, sourceFile) {
  if (ts.isTemplateExpression(node)) return templateText(node, sourceFile);
  if (ts.isJsxText(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function enclosingJsxExpression(node, ancestors) {
  return ts.isJsxExpression(node.parent)
    ? node.parent
    : [...ancestors].reverse().find(ts.isJsxExpression);
}

function visibleAttributeFor(node, ancestors) {
  if (ts.isJsxAttribute(node.parent) && visibleAttributes.has(node.parent.name.text)) return node.parent;
  const jsxExpression = enclosingJsxExpression(node, ancestors);
  return jsxExpression && ts.isJsxAttribute(jsxExpression.parent) && visibleAttributes.has(jsxExpression.parent.name.text)
    ? jsxExpression.parent
    : undefined;
}

function jsxLiteralRule(node, ancestors) {
  if (ts.isJsxText(node)) return "untranslated-jsx";
  if (visibleAttributeFor(node, ancestors)) return "untranslated-attribute";
  const jsxExpression = enclosingJsxExpression(node, ancestors);
  if (jsxExpression) {
    const container = jsxExpression.parent;
    if (ts.isJsxElement(container) || ts.isJsxFragment(container)) return "untranslated-jsx";
  }
  return undefined;
}

export function inspectLocalizationSources(files, options = {}) {
  const issues = [];
  const parsed = files.map((file) => ({
    ...file,
    sourceFile: ts.createSourceFile(file.path, file.source, ts.ScriptTarget.Latest, true, file.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS),
  }));

  for (const file of parsed) {
    const scanForbidden = (node) => {
      const value = literalText(node, file.sourceFile);
      if (value !== undefined) {
        const normalized = value.replace(/\s+/g, " ").trim();
        const forbidden = forbiddenMetaDesignPhrases.find((phrase) =>
          normalized.toLowerCase().includes(phrase),
        );
        if (forbidden) {
          issues.push(
            issue(
              file,
              file.sourceFile,
              node,
              "forbidden-meta-prose",
              `remove internal design commentary containing “${forbidden}”`,
            ),
          );
        }
      }
      ts.forEachChild(node, scanForbidden);
    };
    scanForbidden(file.sourceFile);
  }

  if (options.runDictionaryParity !== false) {
    const dictionaries = new Map();
    for (const file of parsed.filter((candidate) => candidate.localization === "dictionary")) {
      const root = exportedObject(file.sourceFile);
      if (!root) {
        issues.push(issue(file, file.sourceFile, file.sourceFile, "dictionary-shape", "dictionary must default-export an object literal"));
        continue;
      }
      dictionaries.set(file.path.match(/\/(en|fr|es|zh)\.ts$/)?.[1], { file, root, shape: shapeOf(root) });
      const englishBindings = englishImportBindings(file.sourceFile);
      const visitSpread = (node) => {
        if (ts.isSpreadAssignment(node) && englishBindings.has(rootIdentifier(node.expression))) {
          issues.push(issue(file, file.sourceFile, node, "english-inheritance", "non-English dictionaries must define every key explicitly instead of spreading English"));
        }
        ts.forEachChild(node, visitSpread);
      };
      if (!file.path.endsWith("/en.ts")) visitSpread(root);
    }
    const english = dictionaries.get("en")?.shape;
    if (english) {
      for (const locale of LOCALES.filter((value) => value !== "en")) {
        const dictionary = dictionaries.get(locale);
        if (!dictionary) continue;
        const missing = [...english].filter((key) => !dictionary.shape.has(key));
        const extra = [...dictionary.shape].filter((key) => !english.has(key));
        if (missing.length || extra.length) {
          issues.push(issue(dictionary.file, dictionary.file.sourceFile, dictionary.root, "dictionary-parity", `dictionary shape differs from English (missing: ${missing.slice(0, 8).join(", ") || "none"}; extra: ${extra.slice(0, 8).join(", ") || "none"})`));
        }
      }
    }
  }

  for (const file of parsed.filter((candidate) => candidate.localization !== "dictionary")) {
    const localizedNodes = [];
    const findLocaleObjects = (node) => {
      const map = localeObject(node);
      if (map) {
        for (const value of map.values()) localizedNodes.push(value);
        const referenceShape = shapeOf(map.get("en"));
        for (const locale of LOCALES.filter((value) => value !== "en")) {
          const candidateShape = shapeOf(map.get(locale));
          if ([...referenceShape].some((key) => !candidateShape.has(key)) || [...candidateShape].some((key) => !referenceShape.has(key))) {
            issues.push(issue(file, file.sourceFile, map.get(locale), "inline-parity", `inline ${locale} copy must match the English key shape`));
          }
        }
      }
      ts.forEachChild(node, findLocaleObjects);
    };
    findLocaleObjects(file.sourceFile);

    const walk = (node, ancestors = []) => {
      const nextAncestors = [...ancestors, node];
      const localized = ancestors.some((ancestor) => localizedNodes.includes(ancestor));
      const value = literalText(node, file.sourceFile);

      if (value !== undefined) {
        const normalized = value.replace(/\s+/g, " ").trim();

        if (!localized && !isAllowedLiteral(normalized, ancestors)) {
          const jsxRule = jsxLiteralRule(node, ancestors);
          if (jsxRule === "untranslated-jsx") {
            issues.push(issue(file, file.sourceFile, node, "untranslated-jsx", `visible JSX text is not locale-backed: “${normalized.slice(0, 80)}”`));
          } else if (jsxRule === "untranslated-attribute") {
            const attribute = visibleAttributeFor(node, ancestors);
            issues.push(issue(file, file.sourceFile, node, "untranslated-attribute", `${attribute.name.text} is not locale-backed: “${normalized.slice(0, 80)}”`));
          } else if (objectDataIsVisible(ancestors) || isStandaloneArrayCopy(ancestors)) {
            issues.push(issue(file, file.sourceFile, node, "untranslated-data", `static object/array copy is not locale-backed: “${normalized.slice(0, 80)}”`));
          }
        }
      }

      ts.forEachChild(node, (child) => walk(child, nextAncestors));
    };
    walk(file.sourceFile);
  }

  return issues;
}

function parseScope(argv) {
  const argument = argv.find((value) => value.startsWith("--scope="));
  if (!argument) return undefined;
  const scope = argument.slice("--scope=".length);
  const valid = new Set(localizationManifest.map((entry) => entry.scope));
  if (!valid.has(scope)) throw new Error(`Unknown localization scope: ${scope}. Expected one of ${[...valid].join(", ")}`);
  return scope;
}

export async function runLocalizationCheck(argv = process.argv.slice(2)) {
  const { runLocalizationFixtures } = await import("./check-localization-fixtures.mjs");
  runLocalizationFixtures(inspectLocalizationSources);

  const scope = parseScope(argv);
  const selected = localizationManifest.filter((entry) => !scope || entry.scope === scope);
  const missing = selected.filter((entry) => !existsSync(new URL(entry.path, pathToFileURL(`${frontendRoot}/`))));
  const files = selected
    .filter((entry) => !missing.includes(entry))
    .map((entry) => ({ ...entry, source: readFileSync(new URL(entry.path, pathToFileURL(`${frontendRoot}/`)), "utf8") }));
  const issues = [
    ...missing.map((entry) => ({ ...entry, line: 1, column: 1, rule: "manifest", message: "manifest source does not exist" })),
    ...inspectLocalizationSources(files, { runDictionaryParity: !scope || scope === "dashboard-shared" }),
  ];

  if (issues.length) {
    const groups = new Map();
    for (const current of issues) groups.set(current.scope, [...(groups.get(current.scope) ?? []), current]);
    console.error("Localization contract failed:");
    for (const [group, failures] of groups) {
      console.error(`\n[${group}] (${failures.length})`);
      for (const failure of failures) console.error(`- ${failure.path}:${failure.line}:${failure.column} [${failure.rule}] ${failure.message}`);
    }
    process.exitCode = 1;
    return issues;
  }
  console.log(`Localization contract passed${scope ? ` for ${scope}` : ""}.`);
  return [];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runLocalizationCheck();
