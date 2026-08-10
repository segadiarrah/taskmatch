import { readFileSync } from "node:fs";

const config = readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8");

function readHex(token, block = "ink") {
  const blockMatch = config.match(new RegExp(`${block}: \\{([\\s\\S]*?)\\n\\s*\\},`));
  if (!blockMatch) throw new Error(`Missing ${block} palette`);
  const tokenMatch = blockMatch[1].match(new RegExp(`${token}:\\s*[\"'](#[0-9a-fA-F]{6})[\"']`));
  if (!tokenMatch) throw new Error(`Missing ${block}.${token} token`);
  return tokenMatch[1];
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const surfaces = [readHex("800"), readHex("850"), readHex("900"), readHex("950")];
const normalTextTokens = ["50", "100", "200", "300", "400", "500"];
const failures = [];

for (const token of normalTextTokens) {
  const foreground = readHex(token);
  for (const background of surfaces) {
    const ratio = contrast(foreground, background);
    if (ratio < 4.5) {
      failures.push(`ink-${token} on ${background}: ${ratio.toFixed(2)}:1 (requires 4.5:1)`);
    }
  }
}

for (const token of ["400", "500"]) {
  const foreground = readHex(token, "signal");
  for (const background of surfaces) {
    const ratio = contrast(foreground, background);
    if (ratio < 4.5) failures.push(`signal-${token} on ${background}: ${ratio.toFixed(2)}:1 (requires 4.5:1)`);
  }
}

const paperRatio = contrast(readHex("ink", "paper"), readHex("DEFAULT", "paper"));
if (paperRatio < 4.5) failures.push(`paper ink on paper: ${paperRatio.toFixed(2)}:1 (requires 4.5:1)`);

if (failures.length) {
  console.error(`Design contrast check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("Design contrast check passed for core dark, signal, and paper text pairs.");
