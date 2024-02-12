import esbuild from "esbuild"
import { constructManifest } from "./construct-manifest"
import { BundleOptions } from "./types"
import { join as joinPath } from "node:path"
import { readFile } from "node:fs/promises"

export const bundle = async (options: BundleOptions) => {
  const rootDirPackageJson = await readFile(
    joinPath(options.rootDirectory, "package.json")
  )
    .then((r) => JSON.parse(r.toString()))
    .catch((e) => {
      throw new Error(
        `Could not read package.json in ${
          options.rootDirectory
        }\n\n${e.toString()}`
      )
    })

  const result = await esbuild.build({
    stdin: {
      contents: await constructManifest(options),
      resolveDir: options.routesDirectory,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    write: false,
    platform: "node",
    sourcemap: "inline",
    external: Object.values(rootDirPackageJson.dependencies || {}),
    ...options.esbuild,
  })

  return result.outputFiles![0].text
}
