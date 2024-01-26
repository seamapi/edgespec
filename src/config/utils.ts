import path from "node:path"
import fs from "node:fs/promises"
import { bundleRequire } from "bundle-require"
import { EdgeSpecConfig } from "src/config/config"

export interface ResolvedEdgeSpecConfig extends EdgeSpecConfig {
  tsconfigPath: string
  routesDirectory: string
}

export const resolveConfig = (
  config: EdgeSpecConfig
): ResolvedEdgeSpecConfig => {
  return {
    tsconfigPath: path.resolve(process.cwd(), "tsconfig.json"),
    routesDirectory: path.resolve(process.cwd(), "api"),
    ...config,
  }
}

export const validateConfig = async (config: ResolvedEdgeSpecConfig) => {
  try {
    await fs.stat(config.routesDirectory)
  } catch (error) {
    throw new Error(`Could not find routes directory ${config.routesDirectory}`)
  }

  try {
    await fs.stat(config.tsconfigPath)
  } catch (error) {
    throw new Error(`Could not find tsconfig.json at ${config.tsconfigPath}`)
  }

  return config
}

export const loadConfig = async (
  configPath?: string,
  overrides?: Partial<EdgeSpecConfig>
) => {
  let loadedConfig: EdgeSpecConfig = {}
  if (configPath) {
    const {
      mod: { default: config },
    } = await bundleRequire({
      filepath: configPath,
    })

    if (!config) {
      throw new Error(`Could not find a default export in ${configPath}`)
    }

    loadedConfig = config
  }

  return await validateConfig(
    resolveConfig({
      ...loadedConfig,
      ...overrides,
    })
  )
}
