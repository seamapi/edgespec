import Watcher from "watcher"
import * as esbuild from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"
import { constructManifest } from "./construct-manifest"
import { BundleOptions } from "./types"
import { getTempPathInApp } from "./get-temp-path-in-app"
import { isGitIgnored } from "globby"

/**
 * This does not directly provide a way to retrieve the contents or path of the bundle. You should provide a plugin in the `esbuild` option to do so.
 */
export const bundleAndWatch = async (options: BundleOptions) => {
  const ignore = await isGitIgnored({})

  const watcher = new Watcher(options.rootDirectory, {
    recursive: true,
    ignoreInitial: true,
    ignore,
  })

  const tempDir = await getTempPathInApp(options.rootDirectory)
  const manifestPath = path.join(tempDir, "dev-manifest.ts")

  const invalidateManifest = async () => {
    await fs.writeFile(manifestPath, await constructManifest(options), "utf-8")
    await ctx?.rebuild()
  }

  const ctx = await esbuild.context({
    entryPoints: [manifestPath],
    bundle: true,
    format: "esm",
    write: false,
    sourcemap: "inline",
    ...options.esbuild,
  })

  await invalidateManifest()

  watcher.on("change", async () => {
    await ctx.rebuild()
  })

  watcher.on("add", async () => {
    await invalidateManifest()
  })

  watcher.on("unlink", async () => {
    await invalidateManifest()
  })

  watcher.on("unlinkDir", async () => {
    await invalidateManifest()
  })

  return {
    stop: async () => {
      watcher.close()
      await ctx.dispose()
    },
  }
}
