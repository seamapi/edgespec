import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    // Base library
    index: "src/index.ts",
    middleware: "src/middleware/index.ts",
    // Adapters
    "adapters/node": "src/adapters/node.ts",
    "adapters/wintercg-minimal": "src/adapters/wintercg-minimal.ts",
    // Programmatic usage
    cli: "src/cli/cli.ts",
    dev: "src/dev/dev.ts",
    config: "src/config/index.ts",
    // Test fixtures
    "testing/ava": "src/testing/ava/index.ts",
    "testing/ava/worker-wrapper": "src/testing/ava/worker-wrapper.ts",
  },
  format: "esm",
  treeshake: true,
  dts: false,
  sourcemap: true,
  splitting: false,
  external: ["ava", "ava/plugin", "ava-typescript-worker"],
})
