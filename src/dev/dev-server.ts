import chalk from "chalk"
import { EdgeRuntime } from "edge-runtime"
import { once, EventEmitter } from "node:events"
import { createServer } from "node:http"
import { AddressInfo } from "node:net"
import path from "node:path"
import { EdgeSpecConfig, handleRequestWithEdgeSpec } from "src"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app"
import { bundleAndWatch } from "src/bundle/watch"
import { ResolvedEdgeSpecConfig, loadConfig } from "src/config/utils"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"

interface StartDevServerOptions {
  configPath?: string
  config?: EdgeSpecConfig
  port?: string
  onListening?: (port: string) => void
  onBuildStart?: () => void
  onBuildEnd?: () => void
  stderr?: NodeJS.WritableStream
}

/**
 * Start an EdgeSpec dev server. It will continuously watch your code and rebuild on changes.
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startDevServer = async (options: StartDevServerOptions) => {
  let runtime: EdgeRuntime
  let nonWinterCGHandler: ReturnType<typeof handleRequestWithEdgeSpec>

  let config: ResolvedEdgeSpecConfig
  if (options.configPath) {
    config = await loadConfig(options.configPath, options.config)
  } else {
    config = await loadConfig(undefined, options.config)
  }

  const stderr = options.stderr ?? process.stderr

  const buildEvents = new EventEmitter()
  // Allows us to block requests if we're currently rebuilding to avoid using a stale build
  let isBuilding = false

  // Used to avoid a race condition where the server attempts to process a request before the first build is complete
  const firstBuildPromise = once(buildEvents, "built")

  const server = createServer(
    transformToNodeBuilder({
      defaultOrigin: `http://localhost:${options.port}`,
    })(async (req) => {
      await firstBuildPromise
      if (isBuilding) {
        await once(buildEvents, "built")
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
          stderr.write(
            chalk.bgRed("\nUnhandled exception:\n") +
              (error.stack ?? error.message) +
              "\n"
          )
        } else {
          stderr.write("Unhandled exception:\n" + JSON.stringify(error) + "\n")
        }

        return new Response("Internal server error", {
          status: 500,
        })
      }
    })
  )

  server.listen(options.port, () => {
    const address = server.address()
    options.onListening?.((address as AddressInfo).port.toString())
  })

  const tempDir = await getTempPathInApp(config.rootDirectory)
  const devBundlePathForNode = path.join(tempDir, "dev-bundle.js")

  const { stop } = await bundleAndWatch({
    rootDirectory: config.rootDirectory,
    routesDirectory: config.routesDirectory,
    bundledAdapter: config.emulateWinterCG ? "wintercg-minimal" : undefined,
    esbuild: {
      platform: config.emulateWinterCG ? "browser" : "node",
      outfile: config.emulateWinterCG ? undefined : devBundlePathForNode,
      write: config.emulateWinterCG ? false : true,
      plugins: [
        {
          name: "watch",
          setup(build) {
            build.onStart(() => {
              isBuilding = true
              options.onBuildStart?.()
            })

            build.onEnd(async (result) => {
              if (config.emulateWinterCG) {
                if (!result.outputFiles) throw new Error("no output files")

                runtime = new EdgeRuntime({
                  initialCode: result.outputFiles[0].text,
                })
              } else {
                // We append the timestamp to the path to bust the cache
                const edgeSpecModule = await import(
                  `file:${devBundlePathForNode}#${Date.now()}`
                )
                nonWinterCGHandler = handleRequestWithEdgeSpec(
                  edgeSpecModule.default
                )
              }

              isBuilding = false
              buildEvents.emit("built")

              options.onBuildEnd?.()
            })
          },
        },
      ],
    },
  })

  return {
    port: (server.address() as AddressInfo).port.toString(),
    stop: async () => {
      await stop()
      const closePromise = once(server, "close")
      server.close()
      await closePromise
    },
  }
}
