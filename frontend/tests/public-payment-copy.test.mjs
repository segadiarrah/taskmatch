import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const walk = path => readdirSync(new URL(path, root), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);
const files = ["src/app/page.tsx", "src/lib/landing-copy.ts", "src/lib/page-metadata.ts", ...walk("src/app/(public)"), ...walk("src/components/public"), ...walk("src/content"), ...walk("src/i18n")].filter(path => /\.tsx?$/.test(path));

test("public copy and every locale keep the payment provider name out of rendered text", () => {
  const leaks = [];
  for (const path of files) {
    const source = readFileSync(new URL(path, root), "utf8");
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      const isText = ts.isStringLiteralLike(node) || ts.isJsxText(node);
      const structuralKey = node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name === node;
      if (isText && !structuralKey && /stripe/i.test(node.text)) leaks.push(`${path}:${parsed.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      ts.forEachChild(node, visit);
    }
    visit(parsed);
  }
  assert.deepEqual(leaks, [], "provider-specific dictionary keys may remain internal; user-facing values must be neutral");
});
