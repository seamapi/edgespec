import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "tsconfig.json",
  entry: ["src/index.ts"],
  format: "esm",
  treeshake: true,
  dts: true,
  sourcemap: true,
})
