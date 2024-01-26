import { Command, Option } from "clipanion"
import { bundleRequire } from "bundle-require"
import { ResolvedEdgeSpecConfig } from "src/config"
import path from "node:path"
import fs from "node:fs/promises"

export abstract class BaseCommand extends Command {
  configPath = Option.String("--config,-c", {
    description: "Path to your config file (usually edgespec.config.ts)",
  })

  tsconfigPath = Option.String(
    "--tsconfig",
    path.resolve(process.cwd(), "tsconfig.json"),
    {
      description: "Path to your tsconfig.json",
    }
  )

  routesDirectory = Option.String(
    "--routes-directory",
    path.resolve(process.cwd(), "routes"),
    {
      description: "Path to your routes directory",
    }
  )

  async execute() {
    if (this.configPath) {
      const {
        mod: { default: config },
      } = await bundleRequire({
        filepath: this.configPath,
      })

      if (!config) {
        this.context.stderr.write(
          `Could not find a default export in ${this.configPath}\n`
        )
        return 1
      }

      const combinedConfig = {
        tsconfigPath: this.tsconfigPath,
        routesDirectory: this.routesDirectory,
        ...config,
      }
      await this.validateConfig(combinedConfig)
      return this.run(combinedConfig)
    }

    const config = {
      tsconfigPath: this.tsconfigPath,
      routesDirectory: this.routesDirectory,
    }
    await this.validateConfig(config)

    return this.run(config)
  }

  private async validateConfig(config: ResolvedEdgeSpecConfig) {
    try {
      await fs.stat(config.routesDirectory)
    } catch (error) {
      this.context.stderr.write(
        `Could not find directory ${config.routesDirectory}\n`
      )
      return 1
    }
  }

  abstract run(config: ResolvedEdgeSpecConfig): Promise<number | void>
}
