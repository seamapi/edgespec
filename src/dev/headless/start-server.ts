import { once } from "node:events"
import { createServer } from "node:http"
import TypedEmitter from "typed-emitter"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { HeadlessBuildEvents } from "./types"
import { ResolvedEdgeSpecConfig } from "src/config/utils"
import chalk from "chalk"
import { RequestHandlerController } from "./request-handler-controller"
import { Middleware } from "src/middleware"

export interface StartHeadlessDevServerOptions {
  port: number
  config: ResolvedEdgeSpecConfig
  headlessEventEmitter: TypedEmitter<HeadlessBuildEvents>
  initialBundlePath?: string
  middlewares?: Middleware[]
}

/**
 * Start a headless EdgeSpec dev server. It receives a bundle from the headless dev bundler and serves it.
 *
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevServer = async ({
  port,
  config,
  headlessEventEmitter,
  initialBundlePath,
  middlewares = [],
}: StartHeadlessDevServerOptions) => {
  const controller = new RequestHandlerController(
    headlessEventEmitter,
    middlewares,
    initialBundlePath
  )

  const server = createServer(
    transformToNodeBuilder({
      defaultOrigin: `http://localhost:${port}`,
    })(async (req) => {
      try {
        if (config.emulateWinterCG) {
          const runtime = await controller.getWinterCGRuntime()
          const response = await runtime.dispatchFetch(req.url, req)
          await response.waitUntil()
          return response
        }

        const nodeHandler = await controller.getNodeHandler()
        return await nodeHandler(req)
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

  const listeningPromise = once(server, "listening")
  server.listen(port)
  await listeningPromise

  return {
    server,
    stop: async () => {
      const closePromise = once(server, "close")
      server.close()
      await closePromise
      controller.teardown()
    },
  }
}
