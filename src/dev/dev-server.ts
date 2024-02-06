import { once, EventEmitter } from "node:events"
import { AddressInfo } from "node:net"
import { EdgeSpecConfig } from "src"
import { ResolvedEdgeSpecConfig, loadConfig } from "src/config/utils"
import TypedEventEmitter from "typed-emitter"
import { startHeadlessDevServer } from "./headless/start-server"
import { HeadlessBuildEvents } from "./headless/types"
import { startHeadlessDevBundler } from "./headless/start-bundler"

export interface StartDevServerOptions {
  configPath?: string
  config?: EdgeSpecConfig
  port: number
  onListening?: (port: number) => void
  onBuildStart?: () => void
  onBuildEnd?: () => void
}

/**
 * Start an EdgeSpec dev server. It will continuously watch your code and rebuild on changes. (This is the same function called by `edgespec dev`.)
 *
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startDevServer = async (options: StartDevServerOptions) => {
  let config: ResolvedEdgeSpecConfig
  if (options.configPath) {
    config = await loadConfig(options.configPath, options.config)
  } else {
    config = await loadConfig(undefined, options.config)
  }

  const eventEmitter =
    new EventEmitter() as TypedEventEmitter<HeadlessBuildEvents>
  eventEmitter.on("started-building", () => {
    options.onBuildStart?.()
  })
  eventEmitter.on("finished-building", () => {
    options.onBuildEnd?.()
  })

  const [server, { stop }] = await Promise.all([
    startHeadlessDevServer({
      port: options.port,
      config,
      headlessEventEmitter: eventEmitter,
    }),
    startHeadlessDevBundler({
      config,
      headlessEventEmitter: eventEmitter,
    }),
  ])

  server.listen(options.port, () => {
    options.onListening?.(options.port)
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
