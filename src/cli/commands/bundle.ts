import { Command, Option } from "clipanion"
import { bundle } from "src/bundle/bundle"
import fs from "node:fs/promises"
import { durationFormatter, sizeFormatter } from "human-readable"
import ora from "ora"
import { BaseCommand } from "../base-command"
import { ResolvedEdgeSpecConfig } from "src/config/utils"

export class BundleCommand extends BaseCommand {
  static paths = [[`bundle`]]

  static usage = Command.Usage({
    description: "Bundle your app for distribution",
    details: `
      This command bundles your app for distribution. It outputs a zero-dependency file that can be run in a variety of environments.
    `,
    examples: [[`Bundle your app`, `$0 bundle --output bundled.js`]],
  })

  outputPath = Option.String("--output,-o", {
    description: "The path to output the bundle",
    required: true,
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const spinner = ora("Bundling...").start()
    const buildStartedAt = performance.now()

    const output = await bundle({
      routesDirectory: config.routesDirectory,
      rootDirectory: config.rootDirectory,
    })

    await fs.writeFile(this.outputPath, output)

    spinner.stopAndPersist({
      symbol: "☃️",
      text: ` brr... bundled in ${durationFormatter({
        allowMultiples: ["m", "s", "ms"],
      })(performance.now() - buildStartedAt)} (${sizeFormatter()(
        output.length
      )})`,
    })
  }
}
