import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: [
    "src/index.ts",
    "src/config/index.ts",
    "src/dev/dev.ts",
    "src/config/index.ts",
    "src/middleware/index.ts",
    "src/adapters/node.ts",
    "src/adapters/wintercg-minimal.ts",
    "src/testing/ava/index.ts",
  ],
  format: ["esm", "cjs"],
  outDir: "dist",
  sourcemap: true,
  dts: true,
  treeshake: true,
  clean: true,
  external: ["ava", "ava/plugin", "ava-typescript-worker"],
})
