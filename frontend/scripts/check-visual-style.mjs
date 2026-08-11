import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const failures = [];

function requireMatch(path, pattern, message) {
  if (!pattern.test(read(path))) failures.push(`${path}: ${message}`);
}

requireMatch("tailwind.config.ts", /TaskMatch Router/, "design system must identify the refined router direction");
requireMatch("tailwind.config.ts", /950:\s*["']#fbfbfd["']/, "main app surface must be near-white");
requireMatch("tailwind.config.ts", /500:\s*["']#6340e8["']/, "the visual system must use the restrained violet accent");
requireMatch("tailwind.config.ts", /panel:\s*["']0 1px 2px rgba\(17, 17, 19, 0\.04\)/, "panels need a subtle professional shadow");
requireMatch("src/app/globals.css", /--background:\s*240 20% 99%/, "semantic background must use the light canvas");
requireMatch("src/app/globals.css", /--radius:\s*0\.625rem/, "controls need the refined shared radius");
requireMatch("src/app/layout.tsx", /DM_Sans/, "body typography must use DM Sans");
requireMatch("src/app/layout.tsx", /Manrope/, "display typography must use Manrope");
requireMatch("src/app/\(dashboard\)/layout.tsx", /TaskMatch Console/, "dashboard chrome must use the new concise product label");
requireMatch("src/components/public/site-chrome.tsx", /bg-ink-950\/92/, "public navigation must use the clean translucent surface");

if (failures.length) {
  console.error(`Visual style contract failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("Visual style contract passed.");
