import { MessageChannel } from "node:worker_threads"
import { AddressInfo } from "node:net"
import type { ChannelOptions } from "birpc"
import type { EdgeSpecConfig } from "src/config/config.ts"
import { loadConfig } from "src/config/utils.ts"
import { startHeadlessDevServer } from "./headless/start-server.ts"
import {
  StartHeadlessDevBundlerOptions,
  startHeadlessDevBundler,
} from "./headless/start-bundler.ts"
import type { Middleware } from "src/middleware/index.ts"

export interface StartDevServerOptions {
  rootDirectory?: string
  config?: EdgeSpecConfig
  port?: number
  onListening?: (port: number) => void
  onBuildStart?: () => void
  onBuildEnd?: StartHeadlessDevBundlerOptions["onBuildEnd"]
  middleware?: Middleware[]
}

/**
 * Start an EdgeSpec dev server. It will continuously watch your code and rebuild on changes. (This is the same function called by `edgespec dev`.)
 *
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startDevServer = async (options: StartDevServerOptions) => {
  const config = await loadConfig(
    options.rootDirectory ?? process.cwd(),
    options.config
  )

  const port = options.port ?? 3000

  const headlessBundler = await startHeadlessDevBundler({
    config,
    onBuildStart: options.onBuildStart,
    onBuildEnd: options.onBuildEnd,
  })

  const messageChannel = new MessageChannel()

  const bundlerRpcChannel: ChannelOptions = {
    post: (data) => messageChannel.port1.postMessage(data),
    on: (data) => messageChannel.port1.on("message", data),
  }

  const httpServerRpcChannel: ChannelOptions = {
    post: (data) => messageChannel.port2.postMessage(data),
    on: (data) => messageChannel.port2.on("message", data),
  }

  headlessBundler.birpc.updateChannels((channels) =>
    channels.push(bundlerRpcChannel)
  )

  const [headlessServer] = await Promise.all([
    startHeadlessDevServer({
      port,
      config,
      rpcChannel: httpServerRpcChannel,
      middleware: options.middleware,
      onListening: options.onListening,
    }),
  ])

  return {
    port: (headlessServer.server.address() as AddressInfo).port.toString(),
    stop: async () => {
      await Promise.all([headlessServer.stop(), headlessBundler.stop()])
    },
  }
}
