import { Command, Option } from "clipanion"
import { ResolvedEdgeSpecConfig, loadConfig } from "src/config/utils"

export abstract class BaseCommand extends Command {
  rootDirectory = Option.String("--root", {
    description: "Path to your project root",
  })

  tsconfigPath = Option.String("--tsconfig", {
    description: "Path to your tsconfig.json",
  })

  routesDirectory = Option.String("--routes-directory", {
    description: "Path to your routes directory",
  })

  async execute() {
    const overrides = {
      tsconfigPath: this.tsconfigPath,
      routesDirectory: this.routesDirectory,
      rootDirectory: this.rootDirectory,
    }

    return this.run(
      await loadConfig(this.rootDirectory ?? process.cwd(), overrides)
    )
  }

  abstract run(config: ResolvedEdgeSpecConfig): Promise<number | void>
}
