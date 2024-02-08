import path from "node:path"
import hash from "object-hash"
import getPort from "@ava/get-port"
import EventEmitter2 from "eventemitter2"
import { registerSharedWorker } from "ava/plugin"
import { devServer } from "src/dev/dev"
import { InitialWorkerData, MessageFromWorker } from "./types"
import { loadConfig } from "src/config"
import { ExecutionContext } from "ava"
import { once } from "node:events"

const getWorker = async (initialData: InitialWorkerData) => {
  const key = hash(initialData)

  if (process.env.IS_TESTING_EDGESPEC) {
    const { registerSharedTypeScriptWorker } = await import(
      "ava-typescript-worker"
    )
    return registerSharedTypeScriptWorker({
      filename: new URL(
        `file:${path.resolve(__dirname, "worker-wrapper.ts")}#${key}`
      ),
      initialData: initialData as any,
    })
  }

  return registerSharedWorker({
    filename: new URL(
      `file:${path.resolve(__dirname, "worker-wrapper.mjs")}#${key}`
    ),
    initialData: initialData as any,
    supportedProtocols: ["ava-4"],
  })
}

export type GetTestServerOptions = {
  /**
   * Defaults to the current working directory.
   */
  rootDirectory?: string
}

export const getTestServer = async (
  t: ExecutionContext,
  options?: GetTestServerOptions
) => {
  const worker = await getWorker({
    rootDirectory: options?.rootDirectory ?? process.cwd(),
  })
  await worker.available

  const reply = await worker
    .publish({ type: "get-initial-bundle" })
    .replies()
    .next()
  if (reply.done) {
    throw new Error("No reply from worker")
  }
  const msg = reply.value.data as MessageFromWorker
  if (msg.type !== "initial-bundle") {
    throw new Error("Unexpected message from worker")
  }

  const eventEmitter = new EventEmitter2({ wildcard: true })
  const port = await getPort()
  const server = devServer.headless.startServer({
    port,
    config: await loadConfig({ rootDirectory: options?.rootDirectory }),
    headlessEventEmitter: eventEmitter as any,
    initialBundlePath: msg.bundlePath,
  })

  const messageHandlerAbortController = new AbortController()
  const messageHandlerPromise = Promise.race([
    once(messageHandlerAbortController.signal, "abort"),
    (async () => {
      for await (const msg of worker.subscribe()) {
        if (messageHandlerAbortController.signal.aborted) {
          break
        }

        if (msg.data.type === "from-headless-dev-bundler") {
          eventEmitter.emit(msg.data.originalEventType, ...msg.data)
        }
      }
    })(),
  ])

  t.teardown(async () => {
    messageHandlerAbortController.abort()
    await messageHandlerPromise
    server.close()
  })

  const listeningPromise = once(server, "listening")
  server.listen(port)
  await listeningPromise

  return {
    port,
  }
}
