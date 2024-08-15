import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "tsconfig.build.cjs.json",
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist/cjs",
  treeshake: true,

  //   sourcemap: true,
  clean: true,
  // UPSTREAM: https://github.com/evanw/esbuild/issues/1921#issuecomment-1491470829
  //   banner: {
  //     js: `
  //         import { fileURLToPath } from 'node:url';
  //         import { createRequire as topLevelCreateRequire } from 'node:module';
  //         import path from 'node:path'
  //         const require = topLevelCreateRequire(import.meta.url);
  //         const __filename = fileURLToPath(import.meta.url);
  //         const __dirname = path.dirname(__filename);
  //       `,
  //   },
})
