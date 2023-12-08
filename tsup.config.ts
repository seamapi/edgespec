import { defineConfig } from 'tsup'

export default defineConfig({
  // entry: ['src2/adapters/node.ts', 'src2/adapters/wintercg-minimal.ts'],
  entry: {
    "adapters/node": "src2/adapters/node.ts",
    "adapters/wintercg-minimal": "src2/adapters/wintercg-minimal.ts",
  },
  format: "esm",
})
