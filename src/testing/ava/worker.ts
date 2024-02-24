import { InitialWorkerData } from "./types.ts"
import { devServer } from "src/dev/dev.ts"
import { SharedWorker } from "ava/plugin"
import { loadConfig } from "src/config/index.ts"
import { ChannelOptions } from "birpc"
import { once } from "node:events"

export class Worker {
  private startBundlerPromise: ReturnType<
    typeof devServer.headless.startBundler
  >

  constructor(private initialData: InitialWorkerData) {
    this.startBundlerPromise = this.startBundler()
  }

  public async handleTestWorker(testWorker: SharedWorker.TestWorker) {
    const bundler = await this.startBundlerPromise

    let workerRpcCallback: (data: any) => void

    const channel: ChannelOptions = {
      post: (data) => testWorker.publish(data),
      on: (data) => {
        workerRpcCallback = data
      },
    }

    const messageHandlerAbortController = new AbortController()
    const messageHandlerPromise = Promise.race([
      once(messageHandlerAbortController.signal, "abort"),
      (async () => {
        for await (const msg of testWorker.subscribe()) {
          workerRpcCallback!(msg.data)

          if (messageHandlerAbortController.signal.aborted) {
            break
          }
        }
      })(),
    ])

    bundler.birpc.updateChannels((channels) => channels.push(channel))

    testWorker.publish({
      type: "ready",
    })

    testWorker.teardown(async () => {
      bundler.birpc.updateChannels((channels) =>
        channels.filter((c) => c !== channel)
      )
      messageHandlerAbortController.abort()
      await messageHandlerPromise
    })
  }

  private async startBundler() {
    const config = await loadConfig(this.initialData.rootDirectory)
    return devServer.headless.startBundler({
      config,
    })
  }
}
