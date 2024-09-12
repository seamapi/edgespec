import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: [
    // Base library
    "src/index.ts",
    "src/middleware/index.ts",
    // Adapters
    "src/adapters/node.ts",
    "src/adapters/wintercg-minimal.ts",
    // Programmatic usage
    "src/cli/cli.ts",
    "src/dev/dev.ts",
    "src/config/index.ts",
    // Test fixtures
    "src/testing/ava/index.ts",
    "src/testing/ava/worker-wrapper.ts",
  ],
  format: ["esm", "cjs"],
  outDir: "dist",
  sourcemap: true,
  dts: true,
  treeshake: true,
  clean: true,
  external: ["ava", "ava/plugin", "ava-typescript-worker"],
})
