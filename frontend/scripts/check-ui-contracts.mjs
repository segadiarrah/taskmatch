import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const failures = [];

function requireMatch(path, pattern, message) {
  if (!pattern.test(read(path))) failures.push(`${path}: ${message}`);
}

requireMatch(
  "src/app/globals.css",
  /:where\([^)]*button[^)]*\):focus-visible/,
  "shared interactive controls need a visible focus treatment"
);
requireMatch("src/components/ui/dialog.tsx", /role="dialog"/, "dialog content needs dialog semantics");
requireMatch("src/components/ui/dialog.tsx", /aria-modal="true"/, "dialog content must be marked modal");
requireMatch("src/components/ui/dialog.tsx", /aria-labelledby=\{titleId\}/, "dialog content needs an accessible name");
requireMatch("src/components/ui/dialog.tsx", /event\.key === "Escape"/, "dialogs must close with Escape");
requireMatch("src/components/ui/dialog.tsx", /event\.key === "Tab"/, "modal keyboard focus must remain inside the dialog");
requireMatch("src/components/ui/dialog.tsx", /previouslyFocused\?\.focus\(\)/, "dialogs must restore focus on close");
requireMatch("src/components/ui/dialog.tsx", /onOpenChangeRef\.current\(false\)/, "dialog focus lifecycle must not depend on an unstable callback");
requireMatch("src/components/ui/dialog.tsx", /aria-label="Close dialog"/, "the icon-only close control needs an accessible name");
requireMatch(
  "src/app/\(dashboard\)/layout.tsx",
  /aria-label=\{sidebarCollapsed \? "Expand sidebar" : "Collapse sidebar"\}/,
  "the desktop sidebar toggle needs a state-aware accessible name"
);
requireMatch("src/app/\(dashboard\)/layout.tsx", /aria-label="Close navigation"/, "the mobile close control needs an accessible name");
requireMatch("src/app/\(dashboard\)/layout.tsx", /aria-label="Open navigation"/, "the mobile menu control needs an accessible name");
requireMatch(
  "src/app/(dashboard)/developer/agents/[id]/page.tsx",
  /aria-label=\{`Remove \$\{cap\.name\}`\}/,
  "capability remove controls need item-specific accessible names"
);
requireMatch(
  "src/app/(dashboard)/developer/agents/new/page.tsx",
  /aria-label=\{`Remove \$\{cap\.name\}`\}/,
  "new-agent capability remove controls need item-specific accessible names"
);
requireMatch(
  "src/app/(dashboard)/client/jobs/new/page.tsx",
  /aria-label=\{`Remove requirement \$\{idx \+ 1\}`\}/,
  "requirement remove controls need accessible names"
);
requireMatch("src/app/(public)/company/careers/page.tsx", /aria-expanded=\{open\}/, "role disclosures must expose their state");
requireMatch("src/app/(public)/resources/api-reference/page.tsx", /aria-expanded=\{isOpen\}/, "API disclosures must expose their state");

if (/focus:outline-none/.test(read("src/components/language-switcher.tsx"))) {
  failures.push("src/components/language-switcher.tsx: do not suppress the shared keyboard focus outline");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function suppressesFocusWithoutReplacement(line) {
  const suppressesOutline = /(?:^|[^\w:-])(?:focus(?:-visible)?:)?outline-none(?:$|[^\w-])/.test(line);
  const suppliesRing = /focus(?:-visible)?:ring-(?:[1-9]\d*|\[[^\]]+\])/.test(line);
  const suppliesOutline = /focus-visible:outline-(?:[1-9]\d*|\[[^\]]+\])/.test(line);
  return suppressesOutline && !suppliesRing && !suppliesOutline;
}

if (!suppressesFocusWithoutReplacement('className="focus-visible:outline-none"')) {
  failures.push("UI guard self-check: focus-visible outline suppression was not detected");
}
if (!suppressesFocusWithoutReplacement("outline-none focus:bg-ink-800")) {
  failures.push("UI guard self-check: unprefixed outline suppression was not detected");
}
if (suppressesFocusWithoutReplacement('className="focus:outline-none focus:ring-1"')) {
  failures.push("UI guard self-check: a nonzero focus ring must count as a visible replacement");
}

function enclosingString(source, index) {
  const candidates = ['"', "'", "`"].flatMap((quote) => {
    const start = source.lastIndexOf(quote, index);
    const end = source.indexOf(quote, index + 1);
    return start >= 0 && end >= 0 ? [{ start, end }] : [];
  });
  const closest = candidates.sort((a, b) => b.start - a.start)[0];
  return closest ? source.slice(closest.start + 1, closest.end) : source.slice(index, index + 120);
}

for (const path of walk(new URL("src", root).pathname).filter((file) => file.endsWith(".tsx"))) {
  const source = readFileSync(path, "utf8");
  const suppressions = source.matchAll(/(?:focus(?:-visible)?:)?outline-none/g);
  for (const match of suppressions) {
    const literal = enclosingString(source, match.index ?? 0);
    if (suppressesFocusWithoutReplacement(literal)) {
      const line = source.slice(0, match.index).split("\n").length;
      failures.push(`${relative(new URL(".", root).pathname, path)}:${line}: focus outline is suppressed without a visible replacement`);
    }
  }
}

if (failures.length) {
  console.error(`UI contract check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("UI contract check passed.");
