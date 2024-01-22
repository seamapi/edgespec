import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"
import Watcher from "watcher"
import * as esbuild from "esbuild"

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
        ({ id, relativePath }) => `import * as ${id} from "./${relativePath}"`
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
      options.bundledAdapter === "wintercg-minimal"
        ? `
    import {addFetchListener} from "src/adapters/wintercg-minimal.ts"
    addFetchListener(edgeSpec)
    `
        : "export default edgeSpec"
    }
  `
}

export const watchAndBundle = async (options: BundleOptions) => {
  const watcher = new Watcher(options.directoryPath, {
    recursive: true,
  })

  let ctx: esbuild.BuildContext

  const invalidateEntrypoint = async () => {
    await ctx?.dispose()
    ctx = await esbuild.context({
      stdin: {
        contents: await constructEntrypoint(options),
        resolveDir: options.directoryPath,
        loader: "ts",
      },
      bundle: true,
      format: "esm",
      write: false,
      ...options.esbuild,
    })
    await ctx.rebuild()
  }

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
