import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testMatch: ["**/tests/integration/**/*.spec.ts"],
  use: {
    headless: true,
  },
  projects: [
    {
      name: "chromium-extension",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--disable-extensions-except=./dist",
            "--load-extension=./dist",
          ],
        },
      },
    },
  ],
  globalSetup: "./tests/integration/global-setup.ts",
  globalTeardown: "./tests/integration/global-teardown.ts",
});
