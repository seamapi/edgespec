import { Command, Option } from "clipanion"
import { createServer } from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { EdgeRuntime } from "edge-runtime"
import { watchAndBundle } from "src/bundle/watch"
import { durationFormatter } from "human-readable"
import ora from "ora"

export class DevCommand extends Command {
  static paths = [[`dev`]]

  static usage = Command.Usage({
    description: `Start a development server`,
  })

  port = Option.String("--port,-p", "3000", {
    description: "The port to serve your app on",
  })

  appDirectory = Option.String("--app-directory", process.cwd(), {
    description: "The directory of your app",
  })

  async execute() {
    const listenSpinner = ora({
      text: "Starting server...",
      hideCursor: false,
      discardStdin: false,
    }).start()

    let runtime: EdgeRuntime

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
      listenSpinner.stopAndPersist({
        symbol: "☃️",
        text: ` listening on port ${this.port}: http://localhost:${this.port}\n`,
      })
    })

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
              let spinner = ora({
                hideCursor: false,
                discardStdin: false,
                text: "Building...",
              }).start()
              build.onStart(() => {
                spinner.start("Building...")
                buildStartedAt = performance.now()
              })

              const timeFormatter = durationFormatter({
                allowMultiples: ["m", "s", "ms"],
              })

              build.onEnd((result) => {
                const durationMs = performance.now() - buildStartedAt
                spinner.succeed(`Built in ${timeFormatter(durationMs)}`)

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
  }
}
