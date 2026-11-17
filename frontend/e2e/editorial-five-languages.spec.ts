import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import type { Locale } from "../src/lib/locales";
import type { BlogPost } from "../src/content/blog";
import type { Guide } from "../src/content/guides";

const locales = ["en", "fr", "zh", "es", "pt"] as const;
const root = process.cwd();
const cache = new Map<string, Record<string, unknown>>();

// Load the static content through TypeScript without importing the client i18n provider.
function contentModule(path: string): Record<string, unknown> {
  const filename = resolve(root, path);
  const cached = cache.get(filename);
  if (cached) return cached;
  const mod = { exports: {} as Record<string, unknown> };
  cache.set(filename, mod.exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const relativeRequire = (request: string) => {
    if (!request.startsWith(".")) throw new Error(`Unexpected content dependency: ${request}`);
    return contentModule(resolve(dirname(filename), `${request}.ts`));
  };
  new Function("require", "module", "exports", source)(relativeRequire, mod, mod.exports);
  return mod.exports;
}

const blog = contentModule("src/content/blog.ts") as {
  getBlogPosts: (locale: Locale) => BlogPost[];
  getPostBySlug: (slug: string, locale?: Locale) => BlogPost | undefined;
};
const guides = contentModule("src/content/guides.ts") as {
  getGuides: (locale: Locale) => Guide[];
  getGuideBySlug: (slug: string, locale?: Locale) => Guide | undefined;
};
type Release = { version: string; date: string; summary: string; entries: { type: string; text: string }[] };
const changelog = contentModule("src/content/changelog.ts") as { getReleases: (locale: Locale) => Release[] };

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  return typeof value;
}

test("editorial catalogue preserves every section, identifier and runnable example in five languages", () => {
  const english = blog.getBlogPosts("en");
  expect(english).toHaveLength(6);
  for (const locale of locales) {
    const posts = blog.getBlogPosts(locale);
    expect(shape(posts), locale).toEqual(shape(english));
    posts.forEach((post, index) => {
      const original = english[index];
      expect(post.slug).toBe(original.slug);
      expect(post.date).toBe(original.date);
      expect(post.author.name).toBe(original.author.name);
      expect(blog.getPostBySlug(post.slug, locale)).toEqual(post);
      if (locale !== "en") {
        expect(post.title).not.toBe(original.title);
        expect(post.excerpt).not.toBe(original.excerpt);
        expect(post.author.role).not.toBe(original.author.role);
        expect(post.readingTime).not.toBe(original.readingTime);
      }
      post.body.forEach((section, sectionIndex) => {
        const originalSection = original.body[sectionIndex];
        expect(section.code, `${locale}:${post.slug}:${sectionIndex}`).toEqual(originalSection.code);
        if (locale !== "en") {
          if (section.heading) expect(section.heading).not.toBe(originalSection.heading);
          section.paragraphs?.forEach((paragraph, i) => {
            expect(paragraph.trim()).not.toBe("");
            expect(paragraph).not.toBe(originalSection.paragraphs![i]);
          });
          section.bullets?.forEach((bullet, i) => {
            expect(bullet.trim()).not.toBe("");
            expect(bullet).not.toBe(originalSection.bullets![i]);
          });
        }
      });
    });
    const translatedGuides = guides.getGuides(locale);
    expect(translatedGuides).toHaveLength(4);
    expect(shape(translatedGuides)).toEqual(shape(guides.getGuides("en")));
    translatedGuides.forEach((guide, index) => {
      const original = guides.getGuides("en")[index];
      expect(guide.slug).toBe(original.slug);
      expect(guides.getGuideBySlug(guide.slug, locale)).toEqual(guide);
      expect(guide.steps.map(step => step.code)).toEqual(original.steps.map(step => step.code));
      if (locale !== "en") expect(guide.title).not.toBe(original.title);
    });
    const releases = changelog.getReleases(locale);
    const originalReleases = changelog.getReleases("en");
    expect(releases).toHaveLength(6);
    expect(shape(releases)).toEqual(shape(originalReleases));
    releases.forEach((release, index) => {
      const original = originalReleases[index];
      expect(release.version).toBe(original.version);
      expect(release.date).toBe(original.date);
      expect(release.entries.map(entry => entry.type)).toEqual(original.entries.map(entry => entry.type));
      if (locale !== "en") {
        expect(release.summary).not.toBe(original.summary);
        release.entries.forEach((entry, entryIndex) => expect(entry.text).not.toBe(original.entries[entryIndex].text));
      }
    });
  }
  expect(blog.getPostBySlug("unknown", "pt")).toBeUndefined();
  expect(guides.getGuideBySlug("unknown", "pt")).toBeUndefined();
});

test("editorial catalogue explicitly covers resource, integration and security copy without English fallbacks", () => {
  for (const [file, name] of [["integration", "integrationCopy"], ["security", "securityCopy"]]) {
    const copy = contentModule(`src/content/${file}.ts`)[name] as Record<Locale, object>;
    expect(Object.keys(copy).sort()).toEqual([...locales].sort());
    for (const locale of locales) expect(shape(copy[locale])).toEqual(shape(copy.en));
  }
  for (const path of ["resources/blog/page.tsx", "resources/blog/[slug]/page.tsx", "resources/guides/page.tsx", "resources/guides/[slug]/page.tsx", "resources/sdk/page.tsx", "changelog/page.tsx"]) {
    const source = readFileSync(resolve(root, `src/app/(public)/${path}`), "utf8");
    expect(source).not.toMatch(/lang="en"|publicUi\.archive|COPY\[locale\]\s*\?\?/);
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && node.name.getText() === "COPY" && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        const properties = node.initializer.properties.filter(ts.isPropertyAssignment);
        const key = (property: ts.PropertyAssignment) => property.name.getText().replace(/^["']|["']$/g, "");
        expect(properties.map(key).sort(), path).toEqual([...locales].sort());
        const objectShape = (node: ts.Expression): unknown => {
          if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(property => [key(property), objectShape(property.initializer)]));
          if (ts.isArrayLiteralExpression(node)) return node.elements.map(element => objectShape(element as ts.Expression));
          return "value";
        };
        const english = properties.find(property => key(property) === "en")!;
        for (const property of properties) expect(objectShape(property.initializer), `${path}:${key(property)}`).toEqual(objectShape(english.initializer));
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
  }
});

for (const locale of locales) {
  test(`resource pages and complete editorial bodies render in ${locale}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(selected => localStorage.setItem("taskmatch_locale", selected), locale);
    const posts = blog.getBlogPosts(locale);
    await page.goto("/resources/blog");
    for (const post of posts) await expect(page.getByRole("heading", { name: post.title, exact: true })).toBeVisible();

    // Includes both a code sample and non-code editorial prose.
    const post = posts.find(post => post.slug === "explainable-agent-matching")!;
    await page.goto(`/resources/blog/${post.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(post.title);
    await expect(page).toHaveTitle(new RegExp(post.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator("main").getByText(post.body[0].paragraphs![0], { exact: true })).toBeVisible();
    await expect(page.locator("code")).toHaveText(post.body[2].code!.content);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);

    await page.goto("/resources/guides");
    for (const guide of guides.getGuides(locale)) await expect(page.getByRole("heading", { name: guide.title, exact: true })).toBeVisible();
    const guide = guides.getGuides(locale)[0];
    await page.goto(`/resources/guides/${guide.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
    await expect(page).toHaveTitle(new RegExp(guide.title));
    await expect(page.getByText(guide.steps[0].paragraphs[0], { exact: true })).toBeVisible();

    await page.goto("/changelog");
    for (const release of changelog.getReleases(locale)) {
      await expect(page.getByText(release.summary, { exact: true })).toBeVisible();
      await expect(page.getByText(release.entries[0].text, { exact: true })).toBeVisible();
    }
    const integration = contentModule("src/content/integration.ts").integrationCopy as Record<Locale, Record<string, string>>;
    await page.goto("/resources/documentation");
    await expect(page.getByText(integration[locale].jobsBody, { exact: true })).toBeVisible();
    await page.goto("/resources/api-reference");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(integration[locale].apiTitle);
    await expect(page.getByText(integration[locale].authBody, { exact: true })).toBeVisible();
    await page.goto("/resources/sdk");
    const sdkTitles = { en: "The SDKs are here.", fr: "Les SDK sont là.", es: "Los SDK ya están aquí.", zh: "SDK 已经上线。", pt: "Os SDK chegaram." };
    await expect(page.getByRole("heading", { level: 1 })).toContainText(sdkTitles[locale]);
    const missing = {
      en: ["Article not found", "Guide not found"],
      fr: ["Article introuvable", "Guide introuvable"],
      zh: ["未找到文章", "未找到指南"],
      es: ["Artículo no encontrado", "Guía no encontrada"],
      pt: ["Artigo não encontrado", "Guia não encontrado"],
    }[locale];
    for (let index = 0; index < 2; index += 1) {
      const kind = ["blog", "guides"][index];
      await page.goto(`/resources/${kind}/unknown-article`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(missing[index]);
      await expect(page).toHaveTitle(new RegExp(missing[index]));
    }
  });
}

test("Portuguese editorial content fits a mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
  for (const path of ["/resources/blog/escrow-payments-for-autonomous-agent-work", "/changelog", "/resources/sdk", "/resources/documentation"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
  }
});
