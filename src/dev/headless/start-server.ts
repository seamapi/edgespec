import { once } from "node:events"
import { createServer } from "node:http"
import kleur from "kleur"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"
import { RequestHandlerController } from "./request-handler-controller.ts"
import { Middleware } from "src/middleware/index.ts"
import { createBirpc, type ChannelOptions } from "birpc"
import { BundlerRpcFunctions } from "./types.ts"

export interface StartHeadlessDevServerOptions {
  port: number
  config: ResolvedEdgeSpecConfig
  rpcChannel: ChannelOptions
  middleware?: Middleware[]
  onListening?: (port: number) => void
}

/**
 * Start a headless EdgeSpec dev server. It receives a bundle from the headless dev bundler and serves it.
 *
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevServer = async ({
  port,
  config,
  rpcChannel,
  middleware = [],
  onListening,
}: StartHeadlessDevServerOptions) => {
  const birpc = createBirpc<BundlerRpcFunctions>({}, rpcChannel)
  const controller = new RequestHandlerController(birpc, middleware)

  const server = createServer(
    transformToNodeBuilder({
      defaultOrigin: `http://localhost:${port}`,
    })(async (req) => {
      try {
        if (config.platform === "wintercg-minimal") {
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
            kleur.bgRed("\nUnhandled exception:\n") +
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
  onListening?.(port)

  return {
    server,
    stop: async () => {
      const closePromise = once(server, "close")
      server.close()
      await closePromise
    },
  }
}
