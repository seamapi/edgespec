import { InitialWorkerData } from "./types.ts"
import { devServer } from "src/dev/dev.ts"
import { SharedWorker } from "ava/plugin"
import { loadConfig } from "src/config/index.ts"
import { ChannelOptions } from "birpc"

export class Worker {
  private startBundlerPromise: ReturnType<
    typeof devServer.headless.startBundler
  >

  constructor(private initialData: InitialWorkerData) {
    this.startBundlerPromise = this.startBundler()
  }

  public async handleTestWorker(testWorker: SharedWorker.TestWorker) {
    const bundler = await this.startBundlerPromise

    const channel: ChannelOptions = {
      post: (data) => testWorker.publish(data),
      on: (data) => {
        ;(async () => {
          for await (const msg of testWorker.subscribe()) {
            data(msg.data)
          }
        })()
      },
    }

    bundler.birpc.updateChannels((channels) => channels.push(channel))

    testWorker.publish({
      type: "ready",
    })

    testWorker.teardown(() => {
      bundler.birpc.updateChannels((channels) =>
        channels.filter((c) => c !== channel)
      )
    })
  }

  private async startBundler() {
    const config = await loadConfig(this.initialData.rootDirectory)
    return devServer.headless.startBundler({
      config,
    })
  }
}
