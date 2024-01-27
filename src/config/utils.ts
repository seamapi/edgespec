import path from "node:path"
import fs from "node:fs/promises"
import { bundleRequire } from "bundle-require"
import { EdgeSpecConfig } from "src/config/config"

const cloneObjectAndDeleteUndefinedKeys = <T extends Record<string, any>>(
  obj: T
) => {
  const clone = { ...obj }
  Object.keys(clone).forEach((key) => {
    if (clone[key] === undefined) {
      delete clone[key]
    }
  })
  return clone
}

const resolvePossibleRelativePath = (
  possibleRelativePath: string,
  configDirectory: string
) => {
  if (path.isAbsolute(possibleRelativePath)) {
    return possibleRelativePath
  }

  return path.resolve(configDirectory, possibleRelativePath)
}

export interface ResolvedEdgeSpecConfig extends EdgeSpecConfig {
  rootDirectory: string
  tsconfigPath: string
  routesDirectory: string
}

const resolveConfig = (
  config: EdgeSpecConfig,
  configPath?: string
): ResolvedEdgeSpecConfig => {
  let rootDirectory = process.cwd()

  if (config.rootDirectory) {
    rootDirectory = config.rootDirectory
  } else if (config.tsconfigPath && path.isAbsolute(config.tsconfigPath)) {
    rootDirectory = path.dirname(config.tsconfigPath)
  } else if (configPath && path.isAbsolute(configPath)) {
    rootDirectory = path.dirname(configPath)
  }

  const { tsconfigPath, routesDirectory, ...rest } =
    cloneObjectAndDeleteUndefinedKeys(config)

  return {
    rootDirectory,
    tsconfigPath: resolvePossibleRelativePath(
      tsconfigPath ?? "tsconfig.json",
      rootDirectory
    ),
    routesDirectory: resolvePossibleRelativePath(
      routesDirectory ?? "api",
      rootDirectory
    ),
    ...rest,
  }
}

const validateConfig = async (config: ResolvedEdgeSpecConfig) => {
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
    resolveConfig(
      {
        ...loadedConfig,
        ...cloneObjectAndDeleteUndefinedKeys(overrides ?? {}),
      },
      configPath
    )
  )
}
