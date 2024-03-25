import { Command, Option } from "clipanion"
import { bundle } from "src/bundle/bundle.js"
import fs from "node:fs/promises"
import path from "node:path"
import { durationFormatter, sizeFormatter } from "human-readable"
import ora from "ora"
import { BaseCommand } from "../base-command.js"
import { ResolvedEdgeSpecConfig } from "src/config/utils.js"

import { bundleAndWatch } from "src/bundle/watch.js"
import { formatMessages } from "esbuild"

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

  watchMode =
    Option.Boolean("--watch,-w", {
      description: "Watch for changes and rebuild",
    }) ?? false

  async run(config: ResolvedEdgeSpecConfig) {
    if (this.watchMode) {
      await this.runWatchMode(config)
      return
    }

    const spinner = ora("Bundling...").start()
    const buildStartedAt = performance.now()

    const output = await bundle(config)

    await fs.mkdir(path.dirname(this.outputPath), { recursive: true })
    await fs.writeFile(this.outputPath, output)

    spinner.stopAndPersist({
      symbol: "☃️",
      text: ` brr... bundled in ${timeFormatter(
        performance.now() - buildStartedAt
      )} (${sizeFormatter()(output.length)})`,
    })
  }

  async runWatchMode(config: ResolvedEdgeSpecConfig) {
    const watchingSpinner = ora({
      hideCursor: false,
      discardStdin: false,
      text: "Watching...",
    }).start()

    const buildingSpinner = ora({
      hideCursor: false,
      discardStdin: false,
      text: "Building...",
    })

    let buildStartedAt = performance.now()

    await bundleAndWatch({
      rootDirectory: config.rootDirectory,
      routesDirectory: config.routesDirectory,
      bundledAdapter:
        config.platform === "wintercg-minimal" ? "wintercg-minimal" : undefined,
      esbuild: {
        platform: config.platform === "wintercg-minimal" ? "browser" : "node",
        packages: config.platform === "node" ? "external" : undefined,
        format: config.platform === "wintercg-minimal" ? "cjs" : "esm",
        outfile: this.outputPath,
        write: true,
        plugins: [
          {
            name: "watch",
            setup(build) {
              build.onStart(async () => {
                buildStartedAt = performance.now()
                watchingSpinner.stop()
                buildingSpinner.start()
              })

              build.onEnd(async (result) => {
                if (result.errors.length === 0) {
                  const durationMs = performance.now() - buildStartedAt
                  buildingSpinner.succeed(
                    `Built in ${timeFormatter(durationMs)}`
                  )
                } else {
                  buildingSpinner.fail(
                    "Build failed.\n" +
                      (
                        await formatMessages(result.errors, {
                          kind: "error",
                        })
                      ).join("\n")
                  )
                }

                watchingSpinner.start()
              })
            },
          },
        ],
      },
    })
  }
}

const timeFormatter = durationFormatter({
  allowMultiples: ["m", "s", "ms"],
})
