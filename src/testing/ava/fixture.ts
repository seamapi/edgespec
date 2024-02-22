import path from "node:path"
import hash from "object-hash"
import getPort from "@ava/get-port"
import { registerSharedWorker } from "ava/plugin"
import { devServer } from "src/dev/dev.ts"
import { InitialWorkerData } from "./types.ts"
import { loadConfig } from "src/config/index.ts"
import { ExecutionContext } from "ava"
import { fileURLToPath } from "node:url"
import { Middleware } from "src/middleware/types.ts"
import { once } from "node:events"

const getWorker = async (initialData: InitialWorkerData) => {
  const key = hash(initialData)

  const dirname = path.dirname(fileURLToPath(import.meta.url))

  if (process.env.IS_TESTING_EDGESPEC) {
    const { registerSharedTypeScriptWorker } = await import(
      "ava-typescript-worker"
    )
    return registerSharedTypeScriptWorker({
      filename: new URL(
        `file:${path.resolve(dirname, "worker-wrapper.ts")}#${key}`
      ),
      initialData: initialData as any,
    })
  }

  return registerSharedWorker({
    filename: new URL(
      `file:${path.resolve(dirname, "ava/worker-wrapper.js")}#${key}`
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
  /**
   * Middleware that run before any other middleware.
   * This is often used for dependency injection.
   */
  middleware?: Middleware[]
}

/**
 * Start a test dev server for AVA. This works in watch mode too!
 * Check out the [docs](https://github.com/seamapi/edgespec/blob/main/docs/testing.md) for more information.
 *
 * @param t test context from AVA
 */
export const getTestServer = async (
  t: ExecutionContext,
  options?: GetTestServerOptions
) => {
  const rootDirectory = options?.rootDirectory ?? process.cwd()

  const worker = await getWorker({
    rootDirectory,
  })
  await worker.available

  const [firstMessage, port] = await Promise.all([
    worker.subscribe().next(),
    getPort(),
  ])
  if (firstMessage.value.data.type !== "ready") {
    throw new Error("Unexpected message from AVA test worker")
  }

  let httpServerRpcCallback: (data: any) => void

  const serverFixture = await devServer.headless.startServer({
    port,
    config: await loadConfig(rootDirectory),
    rpcChannel: {
      post: (data) => worker.publish(data),
      on: (data) => {
        httpServerRpcCallback = data
      },
    },
    middleware: options?.middleware ?? [],
  })

  const messageHandlerAbortController = new AbortController()
  const messageHandlerPromise = Promise.race([
    once(messageHandlerAbortController.signal, "abort"),
    (async () => {
      for await (const msg of worker.subscribe()) {
        httpServerRpcCallback!(msg.data)

        if (messageHandlerAbortController.signal.aborted) {
          break
        }
      }
    })(),
  ])

  t.teardown(async () => {
    messageHandlerAbortController.abort()
    await messageHandlerPromise
    await serverFixture.stop()
  })

  return {
    port,
  }
}
