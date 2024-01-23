import { Command, Option } from "clipanion"
import { createServer } from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { EdgeRuntime } from "edge-runtime"
import { watchAndBundle } from "src/bundle/watch"
import { durationFormatter } from "human-readable"
import ora from "ora"
import { handleRequestWithEdgeSpec } from "src"
import path from "node:path"
import chalk from "chalk"

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

  // todo: better syntax for this flag, seems to need --no-emulate-wintercg
  emulateWinterCG = Option.Boolean("--emulate-wintercg", true, {
    description:
      "Emulate the WinterCG runtime. When true, native APIs are unavailable.",
  })

  async execute() {
    const listenSpinner = ora({
      text: "Starting server...",
      hideCursor: false,
      discardStdin: false,
    }).start()

    let runtime: EdgeRuntime
    let nonWinterCGHandler: ReturnType<typeof handleRequestWithEdgeSpec>

    const server = createServer(
      transformToNodeBuilder({
        defaultOrigin: `http://localhost:${this.port}`,
      })(async (req) => {
        if (this.emulateWinterCG) {
          const response = await runtime.dispatchFetch(req.url, req)
          await response.waitUntil()
          return response
        }

        try {
          return await nonWinterCGHandler(req)
        } catch (error) {
          if (error instanceof Error) {
            this.context.stderr.write(
              chalk.bgRed("\nUnhandled exception:\n") +
                (error.stack ?? error.message) +
                "\n"
            )
          } else {
            this.context.stderr.write(
              "Unhandled exception:\n" + JSON.stringify(error) + "\n"
            )
          }

          return new Response("Internal server error", {
            status: 500,
          })
        }
      })
    )

    server.listen(this.port, () => {
      listenSpinner.stopAndPersist({
        symbol: "☃️",
        text: ` listening on port ${this.port}: http://localhost:${this.port}\n`,
      })
    })

    const command = this
    await watchAndBundle({
      directoryPath: this.appDirectory,
      bundledAdapter: this.emulateWinterCG ? "wintercg-minimal" : undefined,
      esbuild: {
        platform: this.emulateWinterCG ? "browser" : "node",
        outfile: this.emulateWinterCG ? undefined : ".edgespec/dev-bundle.js",
        write: this.emulateWinterCG ? false : true,
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

              build.onEnd(async (result) => {
                const durationMs = performance.now() - buildStartedAt
                spinner.succeed(`Built in ${timeFormatter(durationMs)}`)

                if (command.emulateWinterCG) {
                  if (!result.outputFiles) throw new Error("no output files")

                  runtime = new EdgeRuntime({
                    initialCode: result.outputFiles[0].text,
                  })
                } else {
                  const edgeSpecModule = await import(
                    `file:${path.resolve(
                      ".edgespec/dev-bundle.js"
                      // We append the timestamp to the path to bust the cache
                    )}#${Date.now()}`
                  )
                  nonWinterCGHandler = handleRequestWithEdgeSpec(
                    edgeSpecModule.default
                  )
                }
              })
            },
          },
        ],
      },
    })
  }
}
