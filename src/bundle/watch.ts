import Watcher from "watcher"
import * as esbuild from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"
import { constructManifest } from "./construct-manifest.ts"
import { BundleOptions } from "./types.ts"
import { getTempPathInApp } from "./get-temp-path-in-app.ts"
import { isGitIgnored } from "globby"

/**
 * This does not directly provide a way to retrieve the contents or path of the bundle. You should provide a plugin in the `esbuild` option to do so.
 */
export const bundleAndWatch = async (options: BundleOptions) => {
  const ignore = await isGitIgnored({
    cwd: options.rootDirectory,
  })

  const watcher = new Watcher(options.rootDirectory, {
    recursive: true,
    ignoreInitial: true,
    debounce: 0,
    ignore: (filePath: string) => {
      if (filePath.includes(".edgespec")) {
        return true
      }

      // globby breaks when the path being tested is not within the current working directory (cwd/rootDirectory)
      if (!path.relative(options.rootDirectory, filePath).startsWith("..")) {
        return ignore(filePath)
      }

      return true
    },
  })

  const tempDir = await getTempPathInApp(options.rootDirectory)
  const manifestPath = path.join(tempDir, "dev-manifest.ts")

  const rebuildWithErrorHandling = async () => {
    try {
      await ctx?.rebuild()
    } catch {
      // Error is ignored here because it's assumed the caller handles it in the build.onEnd() callback
    }
  }

  const invalidateManifest = async () => {
    await fs.writeFile(manifestPath, await constructManifest(options), "utf-8")
    await rebuildWithErrorHandling()
  }

  const ctx = await esbuild.context({
    entryPoints: [manifestPath],
    bundle: true,
    format: "esm",
    write: false,
    sourcemap: "inline",
    logLevel: "silent",
    ...options.esbuild,
  })

  await invalidateManifest()

  watcher.on("change", async () => {
    await rebuildWithErrorHandling()
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
