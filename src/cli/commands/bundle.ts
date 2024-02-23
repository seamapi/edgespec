import { Command, Option } from "clipanion"
import { bundle } from "src/bundle/bundle.ts"
import fs, { readFile } from "node:fs/promises"
import path from "node:path"
import { durationFormatter, sizeFormatter } from "human-readable"
import ora from "ora"
import { BaseCommand } from "../base-command.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"

import { BundleOptions } from "src/bundle/types.ts"
import { join as joinPath } from "node:path"

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

    let platformBundleOptions: Partial<BundleOptions> = {}

    if (config.platform === "node") {
      platformBundleOptions = {
        esbuild: {
          platform: "node",
          packages: "external",
        },
      }
    }

    const output = await bundle({
      ...platformBundleOptions,
      routesDirectory: config.routesDirectory,
      rootDirectory: config.rootDirectory,
    })

    await fs.mkdir(path.dirname(this.outputPath), { recursive: true })
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
