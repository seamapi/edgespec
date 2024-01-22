import { Command, Option } from "clipanion"
import { bundle } from "src/bundle/bundle"
import fs from "node:fs/promises"
import prettyBytes from "pretty-bytes"

export class BundleCommand extends Command {
  static paths = [[`bundle`]]

  static usage = Command.Usage({
    description: "Bundle your app for distribution",
    details: `
      This command bundles your app for distribution. It outputs a single file that can be run in a variety of environments.
    `,
    examples: [[`Bundle your app`, `$0 bundle --output bundled.js`]],
  })

  outputPath = Option.String("--output,-o", {
    description: "The path to output the bundle",
    required: true,
  })
  appDirectory = Option.String("--app-directory", process.cwd(), {
    description: "The directory to bundle",
  })

  async execute() {
    try {
      await fs.stat(this.appDirectory)
    } catch (error) {
      this.context.stderr.write(
        `Could not find directory ${this.appDirectory}\n`
      )
      return 1
    }

    const output = await bundle({
      directoryPath: this.appDirectory,
    })

    await fs.writeFile(this.outputPath, output)
    this.context.stdout.write(
      `Wrote bundle to ${this.outputPath} (${prettyBytes(output.length)})\n`
    )
  }
}
