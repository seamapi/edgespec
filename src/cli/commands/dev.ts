import { Command, Option } from "clipanion"
import { createServer } from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { EdgeRuntime } from "edge-runtime"
import { watchAndBundle } from "src/bundle/watch"
import { durationFormatter } from "human-readable"

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
    let runtime: EdgeRuntime

    const command = this
    await watchAndBundle({
      directoryPath: this.appDirectory,
      // todo: allow running in the same Node.js process/context to access system APIs
      bundledAdapter: "wintercg-minimal",
      esbuild: {
        plugins: [
          {
            name: "watch",
            setup(build) {
              let buildStartedAt: number
              build.onStart(() => {
                buildStartedAt = performance.now()
              })

              const timeFormatter = durationFormatter({
                allowMultiples: ["m", "s", "ms"],
              })

              build.onEnd((result) => {
                const durationMs = performance.now() - buildStartedAt
                command.context.stdout.write(
                  `Built in ${timeFormatter(durationMs)}\n`
                )

                if (!result.outputFiles) throw new Error("no output files")

                runtime = new EdgeRuntime({
                  initialCode: result.outputFiles[0].text,
                })
              })
            },
          },
        ],
      },
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
