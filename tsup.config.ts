import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "tsconfig.build.cjs.json",
  entry: ["src/commonjs.ts"],
  format: ["cjs"],
  outDir: "dist/cjs",
  treeshake: true,
  clean: true,
})
