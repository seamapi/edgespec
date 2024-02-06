import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "adapters/node": "src/adapters/node.ts",
    "adapters/wintercg-minimal": "src/adapters/wintercg-minimal.ts",
    cli: "src/cli/cli.ts",
    dev: "src/dev/dev.ts",
    middleware: "src/middleware/index.ts",
  },
  format: "esm",
  treeshake: true,
  dts: true,
  sourcemap: true,
})
