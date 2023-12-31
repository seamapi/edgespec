import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    "adapters/node": "src/adapters/node.ts",
    "adapters/wintercg-minimal": "src/adapters/wintercg-minimal.ts",
  },
  format: "esm",
  treeshake: true,
  dts: true,
  sourcemap: true,
})
