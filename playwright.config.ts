import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const databaseUrl = path.join(".impeccable", "e2e", `fincat-${Date.now()}.db`);
process.env.FINCAT_E2E_DATABASE = databaseUrl;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3201",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
