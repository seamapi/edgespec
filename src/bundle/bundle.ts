import esbuild from "esbuild"
import { constructManifest } from "./construct-manifest.js"
import { BundleOptions } from "./types.js"

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
