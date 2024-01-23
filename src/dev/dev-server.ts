import chalk from "chalk"
import { EdgeRuntime } from "edge-runtime"
import { once } from "node:events"
import { createServer } from "node:http"
import path from "node:path"
import { handleRequestWithEdgeSpec } from "src"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app"
import { bundleAndWatch } from "src/bundle/watch"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"

interface StartDevServerOptions {
  appDirectory: string
  emulateWinterCG: boolean
  port: string
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

  const stderr = options.stderr ?? process.stderr

  const server = createServer(
    transformToNodeBuilder({
      defaultOrigin: `http://localhost:${options.port}`,
    })(async (req) => {
      if (options.emulateWinterCG) {
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
    options.onListening?.(options.port)
  })

  const tempDir = await getTempPathInApp(options.appDirectory)
  const devBundlePathForNode = path.join(tempDir, "dev-bundle.js")

  const { stop } = await bundleAndWatch({
    directoryPath: options.appDirectory,
    bundledAdapter: options.emulateWinterCG ? "wintercg-minimal" : undefined,
    esbuild: {
      platform: options.emulateWinterCG ? "browser" : "node",
      outfile: options.emulateWinterCG ? undefined : devBundlePathForNode,
      write: options.emulateWinterCG ? false : true,
      plugins: [
        {
          name: "watch",
          setup(build) {
            build.onStart(() => {
              options.onBuildStart?.()
            })

            build.onEnd(async (result) => {
              if (options.emulateWinterCG) {
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

              options.onBuildEnd?.()
            })
          },
        },
      ],
    },
  })

  return {
    stop: async () => {
      await stop()
      const closePromise = once(server, "close")
      server.close()
      await closePromise
    },
  }
}
