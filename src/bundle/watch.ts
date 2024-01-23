import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"
import Watcher from "watcher"
import * as esbuild from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"

const alphabet = "zyxwvutsrqponmlkjihgfedcba"

const getRandomId = (length: number): string => {
  let str = ""
  let num = length
  while (num--) str += alphabet[(Math.random() * alphabet.length) | 0]
  return str
}

interface BundleOptions {
  directoryPath: string
  esbuild?: esbuild.BuildOptions
  /**
   * This should not be provided in most cases so your bundle is maximally portable.
   */
  // todo: should this be an internal-only option?
  bundledAdapter?: "wintercg-minimal"
}

const constructEntrypoint = async (options: BundleOptions) => {
  const routeMap = await createRouteMapFromDirectory(options.directoryPath)

  const routes = Object.entries(routeMap).map(([route, { relativePath }]) => {
    return {
      route,
      relativePath,
      id: getRandomId(16),
    }
  })

  return `
    import {getRouteMatcher} from "next-route-matcher"

    ${routes
      .map(
        ({ id, relativePath }) =>
          `import * as ${id} from "${path.resolve(
            path.join(options.directoryPath, relativePath)
          )}"`
      )
      .join("\n")}

    const routeMapWithHandlers = {
      ${routes.map(({ id, route }) => `"${route}": ${id}.default`).join(",")}
    }

    const edgeSpec = {
      routeMatcher: getRouteMatcher(Object.keys(routeMapWithHandlers)),
      routeMapWithHandlers
    }

    ${
      // todo: should import from the edgespec package instead of an internal import
      options.bundledAdapter === "wintercg-minimal"
        ? `
    import {addFetchListener} from "src/adapters/wintercg-minimal.ts"
    addFetchListener(edgeSpec)
    `
        : "export default edgeSpec"
    }
  `
}

// todo: combine with bundle.ts
export const watchAndBundle = async (options: BundleOptions) => {
  // todo: this should watch all relevant paths from a tsconfig.json, not just the ./api directory
  const watcher = new Watcher(options.directoryPath, {
    recursive: true,
    ignoreInitial: true,
  })

  await fs.mkdir(".edgespec", { recursive: true })
  const manifestPath = path.resolve(".edgespec/dev-manifest.ts")

  const invalidateEntrypoint = async () => {
    await fs.writeFile(
      manifestPath,
      await constructEntrypoint(options),
      "utf-8"
    )
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

  await invalidateEntrypoint()

  watcher.on("change", async () => {
    await ctx.rebuild()
  })

  watcher.on("add", async () => {
    await invalidateEntrypoint()
  })

  watcher.on("unlink", async () => {
    await invalidateEntrypoint()
  })

  watcher.on("unlinkDir", async () => {
    await invalidateEntrypoint()
  })

  return {
    stop: async () => {
      watcher.close()
      await ctx.dispose()
    },
  }
}
