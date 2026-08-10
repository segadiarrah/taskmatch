import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const locales = ["en", "fr", "es", "zh"];
const entry = (path, source, localization = "inline") => ({
  path,
  scope: "public-auth",
  localization,
  source,
});

function expectRule(inspectLocalizationSources, name, files, rule) {
  const issuesFor = (sources) => inspectLocalizationSources(sources, { locales, runDictionaryParity: true });
  const issues = issuesFor(files);
  assert.ok(
    issues.some((issue) => issue.rule === rule),
    `${name}: expected ${rule}, received ${issues.map((issue) => issue.rule).join(", ") || "no issues"}`,
  );
}

export function runLocalizationFixtures(inspectLocalizationSources) {
  const issuesFor = (sources) => inspectLocalizationSources(sources, { locales, runDictionaryParity: true });
  const completeDictionary = `
    const messages = ({
      nav: { home: "Home", items: ["One", "Two"] },
      action: "Continue",
    } as const);
    export default messages;
  `;

  const dictionaryFiles = locales.map((locale) =>
    entry(`src/i18n/${locale}.ts`, completeDictionary, "dictionary"),
  );
  assert.deepEqual(issuesFor(dictionaryFiles), [], "complete explicit dictionaries should pass");

  expectRule(
    inspectLocalizationSources,
    "dictionary parity",
    dictionaryFiles.map((file) =>
      file.path.endsWith("es.ts")
        ? { ...file, source: `const messages = { nav: { home: "Inicio" } }; export default messages;` }
        : file,
    ),
    "dictionary-parity",
  );

  expectRule(
    inspectLocalizationSources,
    "English inheritance",
    dictionaryFiles.map((file) =>
      file.path.endsWith("zh.ts")
        ? { ...file, source: `import en from "./en"; const messages = { ...en }; export default messages;` }
        : file,
    ),
    "english-inheritance",
  );

  expectRule(
    inspectLocalizationSources,
    "forbidden meta prose",
    [
      ...dictionaryFiles,
      entry(
        "src/app/page.tsx",
        `const COPY = { en: { title: "Our obsidian surfaces" }, fr: { title: "Surface" }, es: { title: "Superficie" }, zh: { title: "界面" } }; export default () => <p>{COPY.en.title}</p>`,
      ),
    ],
    "forbidden-meta-prose",
  );

  expectRule(
    inspectLocalizationSources,
    "untranslated JSX",
    [...dictionaryFiles, entry("src/app/page.tsx", `export default () => <button>Continue now</button>`)],
    "untranslated-jsx",
  );

  expectRule(
    inspectLocalizationSources,
    "untranslated attribute",
    [...dictionaryFiles, entry("src/app/page.tsx", `export default () => <input aria-label="Search projects" placeholder="Find work" />`)],
    "untranslated-attribute",
  );

  expectRule(
    inspectLocalizationSources,
    "untranslated object and array strings",
    [
      ...dictionaryFiles,
      entry(
        "src/app/page.tsx",
        `const cards = [{ title: "Recent projects", bullets: ["Fast delivery"] }]; export default () => <div>{cards[0].title}</div>`,
      ),
    ],
    "untranslated-data",
  );

  const allowed = issuesFor([
    ...dictionaryFiles,
    entry(
      "src/app/page.tsx",
      `const sample = { method: "POST", url: "https://api.taskmatch.ai/v1/jobs", status: "200", id: "job_id" }; export default () => <code>npm install @taskmatch/sdk</code>`,
    ),
  ]);
  assert.deepEqual(allowed, [], "reviewed code, URL, protocol, status, and identifier literals should pass");

  const localized = issuesFor([
    ...dictionaryFiles,
    entry(
      "src/app/page.tsx",
      `const COPY = { en: { title: "Hello" }, fr: { title: "Bonjour" }, es: { title: "Hola" }, zh: { title: "你好" } }; export default () => <h1>{COPY.en.title}</h1>`,
    ),
  ]);
  assert.deepEqual(localized, [], "complete inline locale copy should pass");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { inspectLocalizationSources } = await import("./check-localization.mjs");
  runLocalizationFixtures(inspectLocalizationSources);
  console.log("Localization checker fixtures passed.");
}
