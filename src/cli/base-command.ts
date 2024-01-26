import { Command, Option } from "clipanion"
import { ResolvedEdgeSpecConfig, loadConfig } from "src/config/utils"

export abstract class BaseCommand extends Command {
  configPath = Option.String("--config,-c", {
    description: "Path to your config file (usually edgespec.config.ts)",
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
    }

    if (this.configPath) {
      return this.run(await loadConfig(this.configPath, overrides))
    }

    const resolvedConfig = await loadConfig(undefined, overrides)

    return this.run(resolvedConfig)
  }

  abstract run(config: ResolvedEdgeSpecConfig): Promise<number | void>
}
