import esbuild from "esbuild"
import { constructManifest } from "./construct-manifest"
import { BundleOptions } from "./types"
import { join as joinPath } from "node:path"
import { readFile } from "node:fs/promises"

export const bundle = async (options: BundleOptions) => {
  const result = await esbuild.build({
    stdin: {
      contents: await constructManifest(options),
      resolveDir: options.routesDirectory,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    write: false,
    sourcemap: "inline",
    ...options.esbuild,
  })

  return result.outputFiles![0].text
}
