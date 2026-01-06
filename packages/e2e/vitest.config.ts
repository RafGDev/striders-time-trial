import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    globalSetup: "./tests/global-setup.ts",
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    // Force single-threaded execution
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false,
      },
    },
  },
});
