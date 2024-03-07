import esbuild from "esbuild"
import { constructManifest } from "./construct-manifest.js"
import { ResolvedEdgeSpecConfig } from "src/config/utils.js"

export const bundle = async (config: ResolvedEdgeSpecConfig) => {
  let platformBundleOptions: Partial<esbuild.BuildOptions> = {}

  if (config.platform === "node") {
    platformBundleOptions = {
      platform: "node",
      packages: "external",
    }
  }

  const result = await esbuild.build({
    stdin: {
      contents: await constructManifest(config),
      resolveDir: config.routesDirectory,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    write: false,
    sourcemap: "inline",
    ...platformBundleOptions,
  })

  return result.outputFiles![0].text
}
