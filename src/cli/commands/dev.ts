import { Command, Option } from "clipanion"
import { createServer } from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { EdgeRuntime } from "edge-runtime"
import { bundle } from "src/bundle/bundle"

export class DevCommand extends Command {
  static paths = [[`dev`]]

  static usage = Command.Usage({
    description: `Start a development server`,
  })

  port = Option.String("--port", "3000", {
    description: "The port to serve your app on",
  })

  appDirectory = Option.String("--app-directory", process.cwd(), {
    description: "The directory of your app",
  })

  async execute() {
    const bundled = await bundle({
      directoryPath: this.appDirectory,
      // todo: allow running in the same Node.js process/context to access system APIs
      bundledAdapter: "wintercg-minimal",
    })

    const runtime = new EdgeRuntime({
      initialCode: bundled,
    })

    const server = createServer(
      transformToNodeBuilder({
        defaultOrigin: `http://localhost:${this.port}`,
      })(async (req) => {
        const response = await runtime.dispatchFetch(req.url, req)
        await response.waitUntil()
        return response
      })
    )

    server.listen(this.port, () => {
      this.context.stdout.write(`Listening on port ${this.port}\n`)
    })
  }
}
