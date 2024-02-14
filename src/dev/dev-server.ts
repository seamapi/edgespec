import { EventEmitter } from "node:events"
import { AddressInfo } from "node:net"
import { EdgeSpecConfig } from "src"
import { loadConfig } from "src/config/utils"
import TypedEventEmitter from "typed-emitter"
import { startHeadlessDevServer } from "./headless/start-server"
import { HeadlessBuildEvents } from "./headless/types"
import { startHeadlessDevBundler } from "./headless/start-bundler"
import type { Middleware } from "src/middleware"

export interface StartDevServerOptions {
  rootDirectory?: string
  config?: EdgeSpecConfig
  port?: number
  onListening?: (port: number) => void
  onBuildStart?: () => void
  onBuildEnd?: () => void
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

  const eventEmitter =
    new EventEmitter() as TypedEventEmitter<HeadlessBuildEvents>
  eventEmitter.on("started-building", () => {
    options.onBuildStart?.()
  })
  eventEmitter.on("finished-building", () => {
    options.onBuildEnd?.()
  })

  const port = options.port ?? 3000

  const [headlessServer, headlessBundler] = await Promise.all([
    startHeadlessDevServer({
      port,
      config,
      headlessEventEmitter: eventEmitter,
      middleware: options.middleware,
    }),
    startHeadlessDevBundler({
      config,
      headlessEventEmitter: eventEmitter,
    }),
  ])

  return {
    port: (headlessServer.server.address() as AddressInfo).port.toString(),
    stop: async () => {
      await Promise.all([headlessServer.stop(), headlessBundler.stop()])
    },
  }
}
