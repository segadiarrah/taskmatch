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
    "forbidden meta prose in a central dictionary",
    dictionaryFiles.map((file) =>
      file.path.endsWith("fr.ts")
        ? { ...file, source: `const messages = { nav: { home: "Notre visual system", items: ["Un", "Deux"] }, action: "Continuer" }; export default messages;` }
        : file,
    ),
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
    "untranslated JSX expression string",
    [...dictionaryFiles, entry("src/app/page.tsx", `export default () => <button>{"Continue now"}</button>`)],
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
    "untranslated expression-valued attribute",
    [...dictionaryFiles, entry("src/app/page.tsx", `export default () => <input aria-label={"Search projects"} />`)],
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

  const editorialFields = issuesFor([
    ...dictionaryFiles,
    entry(
      "src/content/blog.ts",
      `export const posts = [{ excerpt: "A practical introduction", paragraphs: ["Start with a clear brief"], readingTime: "5 min read", tag: "Operations", role: "Product editor" }];`,
    ),
  ]).filter((issue) => issue.rule === "untranslated-data");
  assert.equal(editorialFields.length, 5, "excerpt, paragraphs, readingTime, tag, and editorial role must each be inspected");

  expectRule(
    inspectLocalizationSources,
    "untranslated standalone array",
    [...dictionaryFiles, entry("src/app/page.tsx", `const safeguards = ["Encrypt sensitive uploads", "Review access quarterly"]; export default () => <ul>{safeguards.map(String)}</ul>`)],
    "untranslated-data",
  );

  const guideFields = issuesFor([
    ...dictionaryFiles,
    entry("src/content/guides.ts", `export const guides = [{ intro: "Before you begin", paragraphs: ["Create an API key"] }];`),
  ]).filter((issue) => issue.rule === "untranslated-data");
  assert.equal(guideFields.length, 2, "guide intro and paragraphs must each be inspected");

  expectRule(
    inspectLocalizationSources,
    "untranslated blog editorial fields",
    [
      ...dictionaryFiles,
      entry(
        "src/content/blog.ts",
        `export const posts = [{ excerpt: "A practical introduction", paragraphs: ["Start with a clear brief"], readingTime: "5 min read", tag: "Operations", role: "Product editor" }];`,
      ),
    ],
    "untranslated-data",
  );

  expectRule(
    inspectLocalizationSources,
    "untranslated guide editorial fields",
    [...dictionaryFiles, entry("src/content/guides.ts", `export const guides = [{ intro: "Before you begin", paragraphs: ["Create an API key"] }];`)],
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

  const technicalRoles = issuesFor([
    ...dictionaryFiles,
    entry("src/app/page.tsx", `const access = { role: "agent_developer", roles: ["admin", "client"] }; export default access;`),
  ]);
  assert.deepEqual(technicalRoles, [], "technical role identifiers should remain allowlisted in role fields");

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
