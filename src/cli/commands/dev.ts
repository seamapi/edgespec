import { Command, Option } from "clipanion"
import { durationFormatter } from "human-readable"
import ora from "ora"
import { startDevServer } from "src/dev/dev-server"
import { BaseCommand } from "../base-command"
import { ResolvedEdgeSpecConfig } from "src/config/utils"

export class DevCommand extends BaseCommand {
  static paths = [[`dev`]]

  static usage = Command.Usage({
    description: `Start a development server. It watches your source code and will automatically rebuild upon changes.`,
  })

  port = Option.String("--port,-p", "3000", {
    description: "The port to serve your app on",
  })

  // todo: better syntax for this flag, seems to need --no-emulate-wintercg
  emulateWinterCG = Option.Boolean("--emulate-wintercg", true, {
    description:
      "Emulate the WinterCG runtime. When true, native APIs are unavailable.",
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const listenSpinner = ora({
      text: "Starting server...",
      hideCursor: false,
      discardStdin: false,
    }).start()

    let buildStartedAt: number
    const spinner = ora({
      hideCursor: false,
      discardStdin: false,
      text: "Building...",
    }).start()

    const timeFormatter = durationFormatter({
      allowMultiples: ["m", "s", "ms"],
    })

    await startDevServer({
      port: this.port,
      config,
      stderr: this.context.stderr,
      onListening(port) {
        listenSpinner.stopAndPersist({
          symbol: "☃️",
          text: ` listening on port ${port}: http://localhost:${port}\n`,
        })
      },
      onBuildStart() {
        spinner.start("Building...")
        buildStartedAt = performance.now()
      },
      onBuildEnd() {
        const durationMs = performance.now() - buildStartedAt
        spinner.succeed(`Built in ${timeFormatter(durationMs)}`)
      },
    })
  }
}
