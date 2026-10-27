import { defineConfig } from "@playwright/test";

const publicURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 20000,
  use: {
    baseURL: publicURL || "http://127.0.0.1:4177",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: publicURL ? undefined : {
    command: "pnpm preview --host 127.0.0.1 --port 4177 --strictPort",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: false,
  },
});
