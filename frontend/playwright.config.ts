import { defineConfig } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:3120";
const localCommand =
  process.env.PLAYWRIGHT_SERVER_COMMAND ??
  "NEXT_DIST_DIR=.next-e2e npm run dev -- --hostname 127.0.0.1 --port 3120";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 2,
  expect: { timeout: 8_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          command: localCommand,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
});
