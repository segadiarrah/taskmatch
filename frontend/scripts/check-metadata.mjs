import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Keeps three lists in agreement:
 *
 *   1. `PUBLIC_ROUTES` in src/lib/site.ts — what the sitemap advertises,
 *   2. `PAGE_METADATA` in src/lib/page-metadata.ts — what each page is called,
 *   3. the `layout.tsx` files under src/app/(public) — what actually attaches
 *      that title and canonical URL to the page.
 *
 * A route can drift out of any one of them silently. Advertise a URL in the
 * sitemap with no layout to carry its metadata and the page inherits the root
 * layout's `canonical: "/"`, telling every crawler that the page is a duplicate
 * of the home page — the page is submitted for indexing and disowned in the
 * same breath. That failure is invisible in a browser, so it needs a check.
 */

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));

function read(path) {
  return readFileSync(join(frontendRoot, path), "utf8");
}

/** Routes listed in PUBLIC_ROUTES, minus the home page, which the root layout owns. */
function declaredRoutes() {
  const source = read("src/lib/site.ts");
  const block = source.match(/PUBLIC_ROUTES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!block) throw new Error("Could not find PUBLIC_ROUTES in src/lib/site.ts");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]).filter((route) => route !== "/");
}

/** Routes that have a title and description. */
function describedRoutes() {
  const source = read("src/lib/page-metadata.ts");
  const block = source.match(/PAGE_METADATA:\s*Record<string,\s*PageMeta>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("Could not find PAGE_METADATA in src/lib/page-metadata.ts");
  return [...block[1].matchAll(/^\s{2}"([^"]+)":\s*\{/gm)].map((match) => match[1]);
}

/** Routes whose layout actually calls buildPageMetadata. */
function wiredRoutes() {
  const root = join(frontendRoot, "src/app/(public)");
  const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });

  return walk(root)
    .filter((path) => path.endsWith("layout.tsx"))
    .flatMap((path) => {
      const call = readFileSync(path, "utf8").match(/buildPageMetadata\("([^"]+)"\)/);
      return call ? [{ route: call[1], path: relative(frontendRoot, path).replaceAll("\\", "/") }] : [];
    });
}

const declared = declaredRoutes();
const described = describedRoutes();
const wired = wiredRoutes();
const wiredRouteNames = wired.map((entry) => entry.route);

const failures = [];

for (const route of declared) {
  if (!described.includes(route)) {
    failures.push(`${route} is in PUBLIC_ROUTES but has no entry in PAGE_METADATA`);
  }
  if (!wiredRouteNames.includes(route)) {
    failures.push(`${route} is in PUBLIC_ROUTES but no layout.tsx calls buildPageMetadata("${route}")`);
  }
}

for (const route of described) {
  if (!declared.includes(route)) {
    failures.push(`${route} has metadata but is not in PUBLIC_ROUTES, so no crawler is told it exists`);
  }
}

for (const { route, path } of wired) {
  if (!described.includes(route)) {
    failures.push(`${path} asks for metadata for ${route}, which PAGE_METADATA does not define`);
  }
}

const duplicates = wiredRouteNames.filter((route, index) => wiredRouteNames.indexOf(route) !== index);
for (const route of new Set(duplicates)) {
  failures.push(`${route} is claimed by more than one layout.tsx`);
}

if (failures.length) {
  console.error(`Page metadata check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Page metadata check passed: ${declared.length} public routes, each with a title and a self-referencing canonical URL.`,
);
