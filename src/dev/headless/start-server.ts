import { once } from "node:events"
import { createServer } from "node:http"
import fs from "node:fs/promises"
import TypedEmitter from "typed-emitter"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { HeadlessBuildEvents } from "./types"
import { ResolvedEdgeSpecConfig } from "src/config/utils"
import { EdgeRuntime } from "edge-runtime"
import { handleRequestWithEdgeSpec } from "src/types/edge-spec"
import chalk from "chalk"

export interface StartHeadlessDevServerOptions {
  port: number
  config: ResolvedEdgeSpecConfig
  headlessEventEmitter: TypedEmitter<HeadlessBuildEvents>
  initialBundlePath?: string
}

/**
 * Start a headless EdgeSpec dev server. It receives a bundle from the headless dev bundler and serves it.
 *
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevServer = ({
  port,
  config,
  headlessEventEmitter,
  initialBundlePath,
}: StartHeadlessDevServerOptions) => {
  let runtime: EdgeRuntime
  let nonWinterCGHandler: ReturnType<typeof handleRequestWithEdgeSpec>

  let bundlePath: string
  if (initialBundlePath) {
    bundlePath = initialBundlePath
  }
  let shouldReload = true
  headlessEventEmitter.on("finished-building", (result) => {
    bundlePath = result.bundlePath
    shouldReload = true
  })

  const reload = async () => {
    if (config.emulateWinterCG) {
      const contents = await fs.readFile(bundlePath, "utf-8")
      runtime = new EdgeRuntime({
        initialCode: contents,
      })
    } else {
      // We append the timestamp to the path to bust the cache
      const edgeSpecModule = await import(`file:${bundlePath}#${Date.now()}`)
      // If the file is imported as CJS, the default export is nested.
      // Naming this with .mjs seems to break some on-the-fly transpiling tools downstream.
      const defaultExport =
        edgeSpecModule.default.default ?? edgeSpecModule.default
      nonWinterCGHandler = handleRequestWithEdgeSpec(defaultExport)
    }

    shouldReload = false
  }

  // Used to avoid a race condition where the server attempts to process a request before the first build is complete
  const firstBuildPromise = initialBundlePath
    ? Promise.resolve()
    : once(headlessEventEmitter, "finished-building")

  const server = createServer(
    transformToNodeBuilder({
      defaultOrigin: `http://localhost:${port}`,
    })(async (req) => {
      await firstBuildPromise
      if (shouldReload) {
        await reload()
      }

      if (config.emulateWinterCG) {
        const response = await runtime.dispatchFetch(req.url, req)
        await response.waitUntil()
        return response
      }

      try {
        return await nonWinterCGHandler(req)
      } catch (error) {
        if (error instanceof Error) {
          process.stderr.write(
            chalk.bgRed("\nUnhandled exception:\n") +
              (error.stack ?? error.message) +
              "\n"
          )
        } else {
          process.stderr.write(
            "Unhandled exception:\n" + JSON.stringify(error) + "\n"
          )
        }

        return new Response("Internal server error", {
          status: 500,
        })
      }
    })
  )

  return server
}
