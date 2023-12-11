import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    "adapters/node": "src2/adapters/node.ts",
    "adapters/wintercg-minimal": "src2/adapters/wintercg-minimal.ts",
  },
  format: "esm",
  treeshake: true,
  dts: true,
  sourcemap: true,
})
